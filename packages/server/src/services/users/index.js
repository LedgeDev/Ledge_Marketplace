const prisma = require('../../prisma');
const express = require('express');
const { authenticate, deleteUser, changeEmail } = require('../../authentication');
const router = express.Router();
const { sendGlobalNotification } = require('../../utils/sendNotification');
const {
  getQuestionnaireAnswerCount,
  getNextLevelName,
  getFoundersReached,
  createUser,
  registerCategoryChoices,
  restoreSuperUserBrands,
  removeSuperUserBrands,
  getRecomendedBrands,
  updateUserAttributes,
} = require('./utils');
const config = require('config');

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const {
  getBrandsCategories,
  addToUserForYouBrandsPool,
  refillUserForYouBrandsFromPool,
  removeBrandFromForYou,
} = require('../../utils/brandFeeds');

const versionGate = require('../../middleware/versionGate');

const userIncludes = {
  offers: {
    include: {
      product: true,
    },
  },
}

const adminUserIncludes = {
};

const additionalUserAttributes = async (user) => {
  user.levelQuestionnaireAnswerCount = await getQuestionnaireAnswerCount(
    user.id,
  );
  user.nextLevelName = await getNextLevelName(user.id);
  const [foundersReached, foundersReachedTopPercentage] =
    await getFoundersReached(user.id);
  user.foundersReached = foundersReached;
  user.foundersReachedTopPercentage = foundersReachedTopPercentage;
};

// Use authenticate in all routes
router.use(authenticate);

// In this endpoint we recomend the brands to the user based on the answers to the onboarding questions
router.post('/onboarding', [], async (req, res) => {
  try {
    const answers = req.body;
    const userId = req.headers.currentUserId;
    // save answers in db
    const savedAnswers = [];
    let locationAnswer = null;

    for (const [questionId, answerData] of Object.entries(answers)) {
      const question = await prisma.questions.findUnique({
        where: { id: questionId },
        select: { question: true },
      });
      if (!question) {
        console.warn(`Question with ID ${questionId} not found`);
        continue;
      }

      // Check if this is the location question
      if (questionId === config.get('locationQuestionId')) {
        locationAnswer = answerData;
      }

      const answerDocument = await prisma.answers.upsert({
        where: {
          userId_questionId: {
            userId,
            questionId,
          },
        },
        update: {
          answer: answerData,
        },
        create: {
          user: {
            connect: { id: userId },
          },
          question: {
            connect: { id: questionId },
          },
          questionText: question.question,
          answer: answerData,
        },
      });
      savedAnswers.push(answerDocument);
    }

    // Update user with location and completed onboarding status
    await prisma.users.update({
      where: { id: userId },
      data: {
        hasCompletedOnboarding: true,
        ...(locationAnswer && { location: locationAnswer.description })
      },
    });

    // Recomend brands to the user based on the answers to the onboarding questions
    await getRecomendedBrands(userId, answers);

    res.status(200);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

router.post('/poolRefill', [], async (req, res) => {
  try {
    const answer = req.body;
    const userId = req.headers.currentUserId;

    const swipedRightCategoryIds = [];
    const swipedLeftCategoryIds = [];

    for (const [categoryId, answerData] of Object.entries(answer)) {
      if (answerData.answer === true) {
        swipedRightCategoryIds.push(categoryId);
      } else {
        swipedLeftCategoryIds.push(categoryId);
      }
    }

    // get the swiped left brands of the categories and add them to the user's notInterestedBrands
    const swipedRLeftBrands = await prisma.brands.findMany({
      where: {
        isVisible: true,
        categoryId: {
          in: swipedLeftCategoryIds,
        },
      },
    });
    await prisma.users.update({
      where: {
        id: userId,
      },
      data: {
        notInterestedBrands: {
          connect: swipedRLeftBrands.map((brand) => ({ id: brand.id })),
        },
      },
    });

    // get the swiped right brands brands of the categories and add them to the user's forYouBrandsPoolIds
    const swipedRightBrands = await prisma.brands.findMany({
      where: {
        isVisible: true,
        categoryId: {
          in: swipedRightCategoryIds,
        },
      },
    });

    await addToUserForYouBrandsPool(userId, swipedRightBrands.map((brand) => brand.id));
    // fill the user's forYouBrandsIds with brands from the new pool
    await refillUserForYouBrandsFromPool(userId);

    // save category choices
    if (swipedRightCategoryIds.length > 0) {
      await registerCategoryChoices(userId, swipedRightCategoryIds, true);
    }
    if (swipedLeftCategoryIds.length > 0) {
      await registerCategoryChoices(userId, swipedLeftCategoryIds, false);
    }

    res.status(200).json('OK');
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

router.get('/navbarMessage', [], async (req, res) => {
  try {
    const userId = req.headers.currentUserId;
    const user = await prisma.users.findUnique({
      where: { id: userId },
    });


    const level = await prisma.levels.findUnique({
      where: { id: user.levelId },
    });

    if (level) {
      const message = `Welcome ${level.name} `;
      res.json({ message });
    } else {
      res.status(404).json({ error: 'Level not found' });
    }
  } catch (error) {
    console.error('Error getting navbar message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Put again the middlewares: fixAuth0UserId, checkOwner
router.get('/', [], async (req, res) => {
  try {
    const userId = req.headers.currentUserId;
    const userInfo = await prisma.users.update({
      where: {
        id: userId,
      },
      data: {
        lastOpened: new Date(Date.now()),
      },
      include: userIncludes,
    });
    if (!userInfo) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(userInfo);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: error.message }); // Send the actual error message
  }
});

router.get('/all', [], async (req, res) => {
  try {
    // restrict to admin
    if (req.user?.isAdmin !== 'true') {
      res.status(403).send('User is not an admin');
      return;
    }

    const users = await prisma.users.findMany({
      include: adminUserIncludes,
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/myFavourites', versionGate('2.99.99'), async (req, res) => {
  try {
    const userId = req.headers.currentUserId;
    const { brandId } = req.body;
    const userInfo = await prisma.users.findUnique({
      where: {
        id: userId,
      },
      include: {
        likes: true,
      },
    });

    const updatedMyFavourites = userInfo.myFavourites
      ? [...userInfo.myFavourites]
      : [];
    if (!updatedMyFavourites.find((entry) => entry.brandId === brandId)) {
      updatedMyFavourites.push({
        brandId,
        addedAt: new Date().toISOString(),
      });
    }
    await prisma.users.update({
      where: {
        id: userId,
      },
      data: {
        myFavourites: updatedMyFavourites,
      },
      include: userIncludes,
    });

    // new like logic
    if (!user.likes.some((like) => like.brandId === brandId)) {
      await prisma.brands_likes.create({
        data: {
          brandId,
          userId,
        },
      });
    }

    res.json(brandId);
  } catch (error) {
    console.error('Error updating user myFavourites:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/viewedPitch', async (req, res) => {
  try {
    const userId = req.headers.currentUserId;
    const { brandId } = req.body;

    // Fetch the user's current information
    const userInfo = await prisma.users.findUnique({
      where: {
        id: userId,
      },
    });

    // Initialize the viewedPitches array, or use an existing one
    const updatedViewedPitches = userInfo.viewedPitches
      ? [...userInfo.viewedPitches]
      : [];

    // Check if the brandId is already in viewedPitches; if not, add it
    if (!updatedViewedPitches.includes(brandId)) {
      updatedViewedPitches.push(brandId);
    }

    // Update the user with the new array of viewedPitches
    const updatedUser = await prisma.users.update({
      where: {
        id: userId,
      },
      data: {
        viewedPitches: updatedViewedPitches, // Assign the updated array of strings
      },
    });

    // Respond with the updated user information
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user viewedPitches:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



router.delete('/myFavourites', versionGate('2.99.99'), async (req, res) => {
  try {
    const userId = req.headers.currentUserId;
    const { brandId } = req.body;

    const userInfo = await prisma.users.findUnique({
      where: {
        id: userId,
      },
    });

    const updatedMyFavourites = userInfo.myFavourites
      ? [...userInfo.myFavourites]
      : [];
    const index = updatedMyFavourites.findIndex(
      (entry) => entry.brandId === brandId,
    );

    if (index > -1) {
      updatedMyFavourites.splice(index, 1);
    } else {
      return res
        .status(404)
        .json({ error: "BrandId not found in user's myFavourites" });
    }

    await prisma.users.update({
      where: {
        id: userId,
      },
      data: {
        myFavourites: updatedMyFavourites,
      },
      include: userIncludes,
    });

    // new like logic
    if (userInfo.likes.some((like) => like.brandId === brandId)) {
      await prisma.brands_likes.delete({
        where: {
          brandId,
          userId,
        },
      });
    }

    res.json(brandId);
  } catch (error) {
    console.error("Error removing brandId from user's myFavourites:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', [], async (req, res) => {
  try {
    const userId = req.headers.currentUserId;
    const userEmail = req.body.email;
    const userName = req.body.name;

    let user = await prisma.users.findUnique({
      where: { id: userId },
      include: userIncludes,
    });

    if (!user) {
      user = await createUser(userId, userEmail, userName, userIncludes);
    } else {
      user = await prisma.users.update({
        where: { id: userId },
        data: {
          lastOpened: new Date(Date.now()),
        },
        include: userIncludes,
      });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.patch('/', [], async (req, res) => {
  try {
    const userId = req.headers.currentUserId;

    const user = await prisma.users.update({
      where: {
        id: userId,
      },
      data: req.body,
      include: userIncludes,
    });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message }); // Send the actual error message
  }
});

router.delete('/', [], async (req, res) => {
  try {
    const userId = req.headers.currentUserId;
    // If id is process.env.ADMIN_USER_ID, return an error
    if (userId === process.env.ADMIN_USER_ID) {
      return res.status(403).json({ error: "You can't delete the admin user" });
    }
    // delete user from Auth0
    await deleteUser(userId);
    // unassign user from unused codes so they dont get deleted
    await prisma.deal_codes.updateMany({
      where: {
        userId,
        isUsed: false,
      },
      data: {
        userId: null,
      },
    });
    // Delete the user
    const deletedUser = await prisma.users.delete({
      where: {
        id: userId,
      },
    });
    res.json(deletedUser);
  } catch (error) {
    console.error('Error deleting user', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/registerNotificationsToken', async (req, res) => {
  try {
    const userId = req.headers.currentUserId;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const updatedUser = await prisma.users.update({
      where: {
        id: userId,
      },
      data: {
        notificationsToken: token,
      },
      include: userIncludes,
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

router.post('/unregisterNotificationsToken', async (req, res) => {
  try {
    const userId = req.headers.currentUserId;

    const updatedUser = await prisma.users.update({
      where: {
        id: userId,
      },
      data: {
        notificationsToken: null,
      },
      include: userIncludes,
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

router.post('/sendGlobalNotification', async (req, res) => {
  try {
    const { content, title, type } = req.body;

    if (req.user?.isAdmin !== 'true') {
      res.status(403).send('User is not an admin');
      return;
    }

    if (content.length === 0) {
      res.status(300).json({ message: "notification must have content"})
      return;
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const usersWithToken = await prisma.users.findMany({
      where: {
        AND: [
          {
            notificationsToken: {
              not: null
            }
          },
          {
            OR: [
              {
                lastOpened: null
              },
              {
                lastOpened: {
                  gte: thirtyDaysAgo
                }
              }
            ]
          }
        ]
      },
      select: {
        notificationsToken: true
      }
    });

    const tokens = usersWithToken.map(user => user.notificationsToken);

    await sendGlobalNotification(tokens, {
      title: title || 'ledge',
      message: content,
      type
    });

    res.json({ message: 'Global notification sent' });
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

router.post('/linkVisits', async (req, res) => {
  try {
    const userId = req.headers.currentUserId;
    const { brandId, productId, benefitId, url } = req.body;

    await prisma.link_visits.create({
      data: {
        url,
        brand: brandId ? { connect: { id: brandId } } : {},
        user: {
          connect: {
            id: userId,
          },
        },
        product: productId ? { connect: { id: productId } } : {},
        benefit: benefitId ? { connect: { id: benefitId } } : {},
      },
    });

    res.json({ message: 'Link visit added' });
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

router.post('/brandScreenTimes', async (req, res) => {
  try {
    const userId = req.headers.currentUserId;
    const { brandId, time } = req.body;

    // verify that there is no brand screen time for this user and brand
    const brandScreenTime = await prisma.brand_screen_times.findFirst({
      where: {
        brandId,
        userId,
      },
    });
    if (brandScreenTime) {
      return res
        .status(200)
        .json({ message: 'Brand screen time already exists' });
    }

    const screenTime = await prisma.brand_screen_times.create({
      data: {
        time,
        brand: {
          connect: {
            id: brandId,
          },
        },
        user: {
          connect: {
            id: userId,
          },
        },
      },
    });

    res.status(201).json(screenTime);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

router.patch('/changeEmail', async (req, res) => {
  try {
    const userId = req.headers.currentUserId;
    const { email } = req.body;
    const result = await changeEmail(userId, email);
    const updatedUser = await prisma.users.update({
      where: {
        id: userId,
      },
      data: {
        email,
      },
      include: userIncludes,
    });
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user email:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/forYou/:id', async (req, res) => {
  try {
    const userId = req.headers.currentUserId;
    const brandId = req.params.id;
    await removeBrandFromForYou(brandId, userId);
    await refillUserForYouBrandsFromPool(userId);
    const user = await prisma.users.findUnique({
      where: {
        id: userId,
      },
      include: userIncludes,
    });
    // manage when could not fill the user's forYouBrandsIds
    res.status(200).json(user);

  } catch (error) {
    console.error('Error updating user email:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/interestedCategories', async (req, res) => {
  try {
    const userId = req.headers.currentUserId;
    const interestedBrands = [];
    let interestedCategories = await getBrandsCategories(interestedBrands.map((brand) => brand.id));
    const question = await prisma.questions.findUnique({
      where: {
        id: config.get('interestsQuestionId'),
      },
    });
    // filter the categories that were already swiped right, and the ones that have been
    // swiped left 2 times or more
    const categories = await prisma.categories.findMany({
      where: {
        id: {
          in: interestedCategories.map((category) => category.id),
        },
      },
      include: {
        userChoices: {
          where: {
            userId,
          },
        },
      },
    })
    // remove the categories that were already swiped
    const categoriesToRemove = categories.filter((category) => {
      if (category.userChoices.length > 0) {
        return true;
      }
    });
    const categoriesToRemoveIds = categoriesToRemove.map((category) => category.id);
    interestedCategories = interestedCategories.filter((category) => !categoriesToRemoveIds.includes(category.id));

    // limit the number of categories to 8 max
    interestedCategories = interestedCategories.slice(0, 8);
    res.json({ question, interestedCategories });
  } catch (error) {
    console.error('Error getting user interested categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/superUser/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { superUser } = req.body;

    if (req.user?.isAdmin !== 'true') {
      res.status(403).send('User is not an admin');
      return;
    }

    await prisma.users.update({
      where: {
        id,
      },
      data: {
        superUser,
      },
      include: adminUserIncludes,
    });

    let updatedUser;

    if (superUser) {
      updatedUser = await restoreSuperUserBrands(id, adminUserIncludes);
    } else {
      updatedUser = await removeSuperUserBrands(id, adminUserIncludes);
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user superUser:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/contentViews', [], async (req, res) => {
  try {
    const data = req.body; // array of objects with contentId, contentType, section and increment
    const userId = req.headers.currentUserId;
    await prisma.$transaction(
      data.map((row) =>
        prisma.content_views.upsert({
          where: {
            userId_contentId_section: {
              section: row.section,
              userId,
              contentId: row.contentId,
            },
          },
          update: {
            views: {
              increment: row.increment,
            },
          },
          create: {
            user: {
              connect: { id: userId },
            },
            contentId: row.contentId,
            contentType: row.contentType,
            section: row.section,
            views: row.increment,
          },
        })
      )
    );

    res.status(200).json('OK');
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

router.post('/likes', async (req, res) => {
  try {
    const userId = req.headers.currentUserId;
    const { brandId } = req.body;
    let user = await prisma.users.findUnique({
      where: { id: userId },
      include: { likes: true },
      });
    if (!user.likes.some((like) => like.brandId === brandId)) {
      await prisma.brands_likes.create({
        data: {
          brandId,
          userId,
        },
      });
    }
    user = await prisma.users.findUnique({
      where: { id: userId },
      include: userIncludes,
    });
    res.json(user);
  } catch (error) {
    console.error('Error adding brand to likes:', error);
    res.status(500).send(error.message);
  }
});

router.delete('/likes', async (req, res) => {
  try {
    const userId = req.headers.currentUserId;
    const { brandId } = req.body;
    await prisma.brands_likes.deleteMany({
      where: { brandId, userId },
    });
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: userIncludes,
    });
    res.json(user);
  } catch (error) {
    console.error('Error removing brand from likes:', error);
    res.status(500).send(error.message);
  }
});

router.patch('/profile', async (req, res) => {
  try {
    const userId = req.headers.currentUserId;
    const user = await prisma.users.findUnique({
      where: { id: userId }
    });

    const { name, location, profilePicture } = req.body;
    await updateUserAttributes(user, {
      name,
      location,
      profilePicture,
    });

    res.json(user);
  } catch (error) {
    console.error('Error removing brand from likes:', error);
    res.status(500).send(error.message);
  }
});

module.exports = {
  path: '/users',
  router,
};
