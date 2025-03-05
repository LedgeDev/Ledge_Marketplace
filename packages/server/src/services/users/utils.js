const prisma = require('../../prisma');
const { uploadFile } = require('../../utils/uploadFile')
const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Calculate how many questions of the corresponding level questionnaire the user has answered
 * @param {Object} user - The user object
 * @returns {Number} The amount of questions answered
 */
async function getNextLevelName(userId) {
  // Get the user object with level
  const user = await prisma.users.findUnique({
    where: {
      id: userId,
    },
    include: {
      level: true,
    },
  });
  if (!user) {
    return null;
  }
  const nextLevel = await prisma.levels.findFirst({
    where: {
      order: {
        gt: user.level?.order,
      },
    },
    orderBy: {
      order: 'asc',
    },
  });
  if (!nextLevel) {
    return null;
  }
  return nextLevel.name;
}

/**
 * Check the user level and update if possible
 * @param {Object} user - The user object
 * @returns {Object} The user object with updated level
 */
async function updateUserLevel(userId) {

  const questionnaireAnswerCount = await getQuestionnaireAnswerCount(userId);
  let user = await prisma.users.findUnique({
    where: {
      id: userId,
    },
    include: {
      level: true,
    },
  });

  if (!user) {
    return null;
  }

  if (!user.level) {
    let level = await prisma.levels.findFirst({
      where: {
        order: 0,
      },
    });
    user = await prisma.users.update({
      where: {
        id: userId,
      },
      data: {
        level: {
          connect: {
            id: level.id,
          },
        },
      },
      include: {
        level: true,
      },
    });
  }

  if (
    questionnaireAnswerCount >= user.level?.requiredAnswers &&
    user.brandsExplored >= user.level?.requiredBrandsExplored
  ) {
    const nextLevel = await prisma.levels.findFirst({
      where: {
        order: {
          gt: user.level.order,
        },
      },
      orderBy: {
        order: 'asc',
      },
    });
    // restart brandsExplored and add additional brands explored
    const additionalBrandsExplored = Math.max(user.brandsExplored - user.level.requiredBrandsExplored, 0);

    if (nextLevel) {
      const updatedUser = await prisma.users.update({
        where: {
          id: userId,
        },
        data: {
          level: {
            connect: {
              id: nextLevel.id,
            },
          },
          brandsExplored: additionalBrandsExplored,
        },
        include: {
          level: true,
        },
      });
      return updatedUser;
    }
  }

  return user;
}

/**
 * Calculate how many founders the user has reached through interactions, and
 * the percentage of users that have that amount or less
 * @param {Object} userId - The id of the user
 * @returns {Array} The amount of founders reached and the percentage
 */
async function getFoundersReached(userId) {
  // Get the user object
  const user = await prisma.users.findUnique({
    where: {
      id: userId,
    },
    include: {
      foundersReachedLeaderboard: true,
    },
  });
  const totalUsers = await prisma.users.count();
  let foundersReached = 0;
  // calculate the number of users that have 0 founders reached
  const usersNoTier = await prisma.users.count({
    where: {
      OR: [
        { foundersReachedLeaderboardId: null },
        { foundersReachedLeaderboardId: undefined },
        { foundersReachedLeaderboardId: { isSet: false } },
      ],
    },
  });
  if (!user || !user.foundersReachedLeaderboard) {
    return [0, 100];
  }
  foundersReached = user.foundersReachedLeaderboard.amount;
  // calculate the percentage of users that have that amount or more
  const leaderboardTiersAbove =
    await prisma.foundersReachedLeaderboard.findMany({
      where: {
        amount: {
          gte: foundersReached,
        },
      },
      include: {
        users: true,
      },
    });
  const usersAbove = leaderboardTiersAbove.reduce(
    (acc, tier) => acc + tier.users.length,
    0,
  );
  const percentage = (usersAbove / totalUsers) * 100;
  // round to 1 decimal

  return [foundersReached, Math.round(percentage * 10) / 10];
}

// userService.js
const generateFriendCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

const createUser = async (userId, userEmail, userName, userIncludes) => {
  // get the brand with the highest ledgeRating value
  const firstBrand = await prisma.brands.findFirst({
    orderBy: {
      ledgeRating: 'desc',
    },
    where: {
      isVisible: true,
    },
  });

  return prisma.users.create({
    data: {
      id: userId,
      email: userEmail,
      name: userName,
      myFavourites: [],
      brandsExplored: 0,
      friendCode: generateFriendCode(),
      forYouBrands: {
        connect: {
          id: firstBrand.id,
        },
      },
      level: {
        connectOrCreate: {
          where: { order: 0 },
          create: {
            order: 0,
            name: 'Scout',
            requiredBrandsExplored: 3,
            requiredAnswers: 3,
          },
        },
      },
    },
    include: userIncludes,
  });
};

const registerCategoryChoices = async (userId, categoryIds, like) => {
  await prisma.category_choices.createMany({
    data: categoryIds.map((categoryId) => ({
      userId,
      categoryId,
      like,
    })),
  })
};

const restoreSuperUserBrands = async (userId, adminUserIncludes) => {
  const user = await prisma.users.findUnique({
    where: {
      id: userId,
    }
  });
  if (!user) {
    return null;
  }
  if (user.superUser !== true) {
    return null;
  }
  // restore for you brands
  const allBrands = await prisma.brands.findMany({
    select: {
      id: true,
    }
  });
  const allBrandsIds = allBrands.map((brand) => brand.id);
  const updatedUser = await prisma.users.update({
    where: {
      id: userId,
    },
    data: {
      forYouBrandsIds: {
        set: allBrandsIds,
      },
      forYouBrandsPoolIds: {
        set: [],
      },
      myFavourites: {
        set: [],
      }
    },
    include: adminUserIncludes,
  });
  // unassign unused deals. used deals will stay
  await prisma.deal_codes.updateMany({
    where: {
      userId,
      isUsed: false,
    },
    data: {
      userId: null,
    }
  });
  // remove unlock history
  await prisma.unlocked_brands_history.deleteMany({
    where: {
      userId,
    }
  });
  return updatedUser;
};

const removeSuperUserBrands = async (userId, adminUserIncludes) => {
  const user = await prisma.users.findUnique({
    where: {
      id: userId,
    }
  });
  if (!user) {
    return null;
  }
  // restore normal forYouBrands
  const updatedUser = await prisma.users.update({
    where: {
      id: userId,
    },
    data: {
      forYouBrandsIds: {
        set: user.forYouBrandsIds.slice(0, 3),
      },
      forYouBrandsPoolIds: {
        set: [],
      },
      myFavourites: {
        set: [],
      }
    },
    include: adminUserIncludes,
  });
  // assigned deals and unlocked brands stay the same
  return updatedUser;
};

// Write a function that gets the recomended brands to the user based on the answers to the onboarding questions
const getRecomendedBrands = async (userId, answers) => {
  // Get all visible brands with their descriptions and IDs
  const brands = await prisma.brands.findMany({
    where: {
      isVisible: true,
    },
    select: {
      id: true,
      description: true,
    },
  });

  // Answers is a dictionary with the following structure:
  // {
  //   "idQuestion1 ": "value1",
  //   "idQuestion2": "value2",
  //   "idQuestion3": "value3",
  // }

  // Get the questions
  const questions = await prisma.questions.findMany({
    where: {
      id: {
        in: Object.keys(answers),
      },
    },
  });

  // Format answers for the prompt
  const formattedAnswers = questions.map(question => ({
    question: question.question.en,
    answer: answers[question.id]
  }));

  const prompt = `Based on a user's answers to onboarding questions, recommend 8 brands that would best match their preferences.

User's answers:
${formattedAnswers.map(a => `Question: ${a.question}\nAnswer: ${a.answer}`).join('\n\n')}

Available brands:
${brands.map(b => `ID: ${b.id}\nDescription: ${b.description}`).join('\n\n')}

Important: Return ONLY a JSON array of exactly 8 brand IDs with no additional text or formatting. Example: ["id1","id2","id3","id4","id5","id6","id7","id8"]`;

  // Clean the response to ensure we get a valid array
  const cleanResponse = (response) => {
    return response
      .trim()
      .replace(/^```json?\s*/, '')
      .replace(/\s*```$/, '')
      .replace(/^\[|\]$/g, '')
      .split(',')
      .map(id => id.trim().replace(/['"]/g, ''))
      .filter(Boolean); 
  };

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });

  const rawResponse = await model.generateContent(prompt);
  const cleanedIds = cleanResponse(rawResponse.response.text());
  const finalArray = cleanedIds.slice(0, 8); // Ensure exactly 8 items

  // Update the user with the recommended brands
  const updatedUser = await prisma.users.update({
    where: {
      id: userId,
    },
    data: {
      forYouBrands: {
        set: finalArray.map(brandId => ({ id: brandId })),
      },
    },
    include: {
      forYouBrands: true,
    },
  });

  return updatedUser;
};

const updateUserAttributes = async (user, attributes) => {

  // Check if the profilePicture is type='image'
  if (attributes.profilePicture.type === 'image') {


    const imageUrl = await uploadFile(attributes.profilePicture.data);
    attributes.profilePicture = {
      type: 'image',
      data: imageUrl,
    };
  } else if (attributes.profilePicture.type === 'avatar') {
    // Here we format the parts of the avatar
    // The avatar is a object. First, delete the key (and value) 'body'
    // Then, all the other attributes are objects with just the key src, so
    // changue this so the attribute is directly the value of src

    delete attributes.profilePicture.data.body;

    for (const [key, value] of Object.entries(attributes.profilePicture.data)) {
      if (typeof value === 'object' && value.src) {
        // The values are the strings to the paths to the svgs that conform the avatar
        // Extract the last 2 characters and convert to integer
        const lastTwoChars = value.src.slice(-2);
        attributes.profilePicture.data[key] = parseInt(lastTwoChars, 10);
      }
    }
  }

  await prisma.users.update({
    where: { id: user.id },
    data: attributes,
  });
};

module.exports = {
  getQuestionnaireAnswerCount,
  updateUserLevel,
  getNextLevelName,
  getFoundersReached,
  createUser,
  registerCategoryChoices,
  restoreSuperUserBrands,
  removeSuperUserBrands,
  getRecomendedBrands,
  updateUserAttributes,
};
