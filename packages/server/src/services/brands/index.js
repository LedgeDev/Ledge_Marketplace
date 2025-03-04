const prisma = require('../../prisma');
const express = require('express');
const { authenticate } = require('../../authentication');
const {
  captionsToSrt,
  srtToCaptions,
  updateProducts,
  deleteNonExistentProducts,
  addInteractionLabels,
  addRatings,
  searchBrandIds,
} = require('./utils');
const { ObjectId } = require('mongodb');

const {
  getUserNotInterestedBrands,
  rotateSleeperForYouBrands,
} = require('../../utils/brandFeeds');
const router = express.Router();

router.use(authenticate);

const brandSelects = (userId) => ({
  id: true,
  image: true,
  name: true,
  isVisible: true,
  shortDescription: true,
  description: true,
  mainPhrase: true,
  teamPicture: true,
  pitchVideo: true,
  pitchCaptions: true,
  brandLogo: true,
  teaser: true,
  images: true,
  category: true,
  pitchSections: true,
  founders: true,
  labels: true,
  products: true,
  pitchQuestions: true,
  dealCodeGroups: {
    include: {
      dealCodes: {
        where: {
          userId: userId,
        },
      },
    },
  },
  website: true,
  updatedAt: true,
  showTeamPictureInRating: true,
  usersFeedback: true,
  isCharity: true,
  unlockHistory: true,
  targetGender: true,
  likes: true,
  showFirst: true,
});

router.get('/', [], async (req, res) => {
  try {
    const userId = req.headers.currentUserId;
    const user = await prisma.users.findUnique({
      where: {
        id: userId,
      }
    });

    const deletedBrandsIds = user.deletedBrands.map((deleted) => deleted);

    const brands = await prisma.brands.findMany({
      orderBy: {
        showFirst: 'desc',
      },
      where: {
        isVisible: true,
        id: {
          notIn: deletedBrandsIds,
        }
      },
      select: brandSelects(userId),
    });

    await addRatings(brands);

    res.json(brands);
  } catch (error) {
    console.error('Error getting brands:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/ownedBrand', [], async (req, res) => {
  try {
    const userId = req.headers.currentUserId;
    if (req.user?.isBrand !== 'true') {
      res.status(403).send('User is not brand owner');
      return;
    }
    const user = await prisma.users.findUnique({
      where: {
        id: userId,
      },
      include: {
        ownedBrand: {
          include: {
            products: true,
            pitchQuestions: true,
            productionSubmissions: true,
          },
        },
      },
    });
    res.status(200).json(user.ownedBrand);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

router.patch('/ownedBrand', [], async (req, res) => {
  try {
    const userId = req.headers.currentUserId;
    if (req.user?.isBrand !== 'true') {
      res.status(403).send('User is not brand owner');
      return;
    }
    const user = await prisma.users.findUnique({
      where: {
        id: userId,
      },
    });
    const brand = await prisma.brands.update({
      where: {
        id: user.ownedBrandId,
      },
      data: req.body,
      include: {
        products: true,
        pitchQuestions: true,
        productionSubmissions: true,
      },
    });
    res.status(200).json(brand);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

router.get('/forYouBrands', [], async (req, res) => {
  try {
    const userId = req.headers.currentUserId;

   const {
    brandsAvailableForPool
  } = await rotateSleeperForYouBrands(userId);

    const user = await prisma.users.findUnique({
      where: {
        id: userId,
      },
    });

    const forYouBrands = user.forYouBrandsIds;

    const brands = await prisma.brands.findMany({
      where: {
        id: {
          in: forYouBrands,
        },
        isVisible: true
      },
      select: brandSelects(userId),
    });

    await addRatings(brands);

    const sortedBrands = brands.sort((a, b) => {
      return forYouBrands.indexOf(b.id) - forYouBrands.indexOf(a.id);
    });

    let nextForYouBrand = null;
    if (user.forYouBrandsPoolIds.length > 0) {
      nextForYouBrand = await prisma.brands.findUnique({
        where: {
          id: user.forYouBrandsPoolIds[0],
          isVisible: true
        },
        select: brandSelects(userId),
      });
    }
    res.json({
      forYouBrands: sortedBrands,
      nextForYouBrand,
      forYouBrandsPoolIds: user.forYouBrandsPoolIds,
      brandsAvailableForPool,
    });
  } catch (error) {
    console.error('Error getting for you brands:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/discovery', [], async (req, res) => {
  try {
    const userId = req.headers.currentUserId;
    const user = await prisma.users.findUnique({
      where: {
        id: userId,
      },
      include: {
        dealCodes: {
          include: {
            group: true
          }
        },
        brandUnlockHistory: true,
      }
    });

    const notInterestedBrands = await getUserNotInterestedBrands(user.id);
    const notInterestedBrandsIds = notInterestedBrands.map((brand) => brand.id);
    const myFavouritesIds = user.myFavourites.map((favourite) => favourite.brandId);
    const deletedBrandsIds = user.deletedBrands.map((deleted) => deleted);
    const myDealsIds = user.dealCodes.map((dc) => dc.group.brandId);
    const unlockedBrandsIds = user.brandUnlockHistory.map((unlock) => unlock.brandId);

    const discoveryBrands = await prisma.brands.findMany({
      where: {
        AND: {
          isVisible: true,
          NOT: {
            id: {
              in: [...myFavouritesIds, ...myDealsIds, ...user.forYouBrandsIds, ...deletedBrandsIds],
            }
          },
          OR: [
            {
              id: {
                in: notInterestedBrandsIds,
              }
            },
            {
              id: {
                in: unlockedBrandsIds,
              }
            },
            {
              id: {
                in: user.forYouBrandsPoolIds
              }
            }
          ]
        },
      },
      select: brandSelects(userId),
    });

    await addRatings(discoveryBrands);

    res.json(discoveryBrands);
  } catch (error) {
    console.error('Error getting discovery brands:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/myFavourites', [], async (req, res) => {
  try {
    const userId = req.headers.currentUserId;
    const user = await prisma.users.findUnique({
      where: {
        id: userId,
      },
      select: {
        myFavourites: true,
        dealCodes: {
          include: {
            group: true
          }
        },
      },
    });

    if (!user) {
      return res.status(404).send('User not found.');
    }

    const myFavourites = await prisma.brands.findMany({
      where: {
        id: {
          in: user.myFavourites.map((entry) => entry.brandId),
        },
        isVisible: true
      },
      select: {
        ...brandSelects(userId),
        website: true
      }
    });

    const myDCBrandsIds = user.dealCodes.map((dc) => dc.group.brandId);

    const myFavouritesWithStatus = myFavourites.map((brand) => ({
      ...brand,
      dealUnlocked: myDCBrandsIds.includes(brand.id),
      inMyFavourites: true,
    }));
    await addInteractionLabels(myFavouritesWithStatus, userId);
    await addRatings(myFavouritesWithStatus);

    res.json(myFavouritesWithStatus);
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).send('Server error while fetching brands');
  }
});

router.get('/myDeals', [], async (req, res) => {
  try {
    const userId = req.headers.currentUserId;

    const user = await prisma.users.findUnique({
      where: {
        id: userId,
      },
      include: {
        dealCodes: {
          include: {
            group: true
          }
        },
      },
    });

    const myDCBrandsIds = user.dealCodes.map((dc) => dc.group.brandId);

    const myFavouritesIds = user.myFavourites.map(
      (favourite) => favourite.brandId,
    );

    const myDeals = await prisma.brands.findMany({
      where: {
        isVisible: true,
        id: {
          in: myDCBrandsIds,
          not: {
            in: myFavouritesIds,
          },
        },
      },
      select: {
        ...brandSelects(userId),
        website: true,
      }
    });

    myDeals.forEach((brand) => {
      const deal = user.dealCodes.find((dc) => dc.group.brandId === brand.id);
      brand.unlockedAt = deal.unlockedAt;
      brand.expirationDate = deal.group.generalExpireDate;
      brand.dealUnlocked = true;
    });

    await addInteractionLabels(myDeals, userId);
    await addRatings(myDeals);

    res.json(myDeals);
  } catch (error) {
    console.error('Error fetching my deals:', error);
    res.status(500).send(error.message);
  }
});

router.get('/all', [], async (req, res) => {
  try {
    if (req.user?.isAdmin !== 'true') {
      res.status(403).send('User is not an admin');
      return;
    } else {
      const brands = await prisma.brands.findMany({});
      for (let brand of brands) {
        if (Array.isArray(brand.pitchCaptions)) {
          if (brand.pitchCaptions.length > 0) {
            brand.pitchCaptions = await captionsToSrt(brand.pitchCaptions);
          } else {
            brand.pitchCaptions = '';
          }
        }
      }
      res.json(brands);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

router.get("/search", [], async (req, res) => {
  try {
    const userId = req.headers.currentUserId;

    const { query, lang } = req.query;
  
    console.log(query);
    const results = await searchBrandIds(query, lang);
    const brands = await prisma.brands.findMany({
      where: {
        id: {
          in: results,
        },
      },
      select: brandSelects(userId),
    });

    await addRatings(brands);

    res.json(brands);

  } catch (error) {
    console.error('Error executing search:', error);
    res.status(500).send(error.message);
  }
});

router.get('/:id', [], async (req, res) => {

  try {
    const userId = req.headers.currentUserId;
    const brandId = req.params.id;

    const brand = await prisma.brands.findUnique({
      where: {
        id: brandId,
        isVisible: true
      },
      select: brandSelects(userId),
    });

    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    await addRatings([brand]);

    res.json(brand);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

router.get('/getAndRemoveFromDeleted/:id', [], async (req, res) => {
  try {
    const userId = req.headers.currentUserId;
    const brandId = req.params.id;

    // Check if the brandID is a valid mongodb ObjectId
    if (!ObjectId.isValid(brandId)) {
      return res.status(200).json(false);
    }

    const brand = await prisma.brands.findUnique({
      where: {
        id: brandId,
        isVisible: true
      },
      select: brandSelects(userId),
    });

    if (!brand) {
      return res.status(200).json(false);
    }

    // If the brand is in the user's deleted brands, remove it
    const user = await prisma.users.findUnique({
      where: {
        id: userId,
      },
    });

    if (user.deletedBrands.includes(brandId)) {
      const updatedDeletedBrands = user.deletedBrands.filter((id) => id !== brandId);
      await prisma.users.update({
        where: {
          id: userId,
        },
        data: {
          deletedBrands: updatedDeletedBrands,
        },
      });
    }

    await addRatings([brand]);

    res.json(brand);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

router.get('/:id/withAttributes', [], async (req, res) => {
  try {
    if (req.user?.isAdmin !== 'true') {
      res.status(403).send('User is not an admin');
      return;
    } else {
      const brandId = req.params.id;
      const brand = await prisma.brands.findUnique({
        where: {
          id: brandId
        },
        include: {
          products: true,
        },
      });
      if (Array.isArray(brand.pitchCaptions)) {
        if (brand.pitchCaptions.length > 0) {
          brand.pitchCaptions = await captionsToSrt(brand.pitchCaptions);
        } else {
          brand.pitchCaptions = '';
        }
      };

      res.json(brand);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

router.get("/brands/filtered", [], async (req, res) => {
  try {
    // params
    // sortBy: relevance | likes | rating | latest
    // categories: []
    // labels: []
    // gender: []
    // values: []
    // shipsTo: []

    const userId = req.headers.currentUserId;

    const {
      sortBy,
      categories,
      labels,
      gender,
      values,
      shipsTo
    } = req.query;

    const allBrands = await prisma.brands.findMany({
      include: {
        usersUnlocked: true,
        category: true
      }
    });

    await addRatings(allBrands);
    let results = allBrands;

    if (sortBy) {
      if (sortBy === 'relevance') {
        results = results.sort((a, b) => b.usersUnlocked.length - a.usersUnlocked.length);
      } else if (sortBy === 'likes') {
        // count users that have liked the brand
        // TODO: refactor user likes and create an intermediate collection to model them
      } else if (sortBy === 'rating') {
        results = results.sort((a, b) => b.rating - a.rating);
      } else if (sortBy === 'latest') {
        results = results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
    }

    if (categories) {
      results = results.filter((brand) => 
        brand.category && 
        (categories.some(category => category === brand.category.name.en || category === brand.category.name.de)
      ));
    }

    if (labels) {
      results = results.filter((brand) => 
        brand.labels && 
        (labels.some(label => 
          brand.labels.some(brandLabel => brandLabel.name.en === label || brandLabel.name.de === label)
        ))
      );
    }

    if (gender) {
      results = results.filter((brand) => 
        brand.targetGender && 
        (gender.some(gender => gender === brand.targetGender))
      );
    }

    if (values) {
      // TODO: implement values
    }

    if (shipsTo) {
      // TODO: implement shipsTo
    }

    const filteredBrands = await prisma.brands.findMany({
      where: {
        isVisible: true,
        id: {
          in: results.map((brand) => brand.id),
        },
      },
      select: brandSelects(userId),
    });

    await addRatings(filteredBrands);

    res.json(filteredBrands);

  } catch (error) {
    console.error('Error filtering brands:', error);
    res.status(500).send(error.message);
  }
});

router.post('/', async (req, res) => {
  try {
    if (req.user?.isAdmin !== 'true') {
      res.status(403).send('User is not an admin');
      return;
    }

    const data = req.body;

    // Process pitch captions
    if (typeof data.pitchCaptions === 'string') {
      if (data.pitchCaptions.length > 0) {
        data.pitchCaptions = await srtToCaptions(data.pitchCaptions);
      } else {
        data.pitchCaptions = [];
      }
    }

    const products = data.products || [];
    delete data.products;

    const newBrand = await prisma.brands.create({
      data: {
        ...data,
        ...(products.length > 0 && {
          products: {
            createMany: {
              data: products,
            }
          }
        })
      },
      include: {
        products: true,
      },
    });

    const newBrandId = newBrand.id;

    // Handle test user update
    if (process.env.INTEGRATION_TEST_MODE !== 'true') {
      const testUserId = process.env.ADMIN_USER_ID;
      const testUser = await prisma.users.findUnique({
        where: {
          id: testUserId,
        },
      });

      if (testUser) {
        const testUserForYouBrands = new Set(testUser.forYouBrandsIds);
        testUserForYouBrands.add(newBrandId);
        await prisma.users.update({
          where: {
            id: testUserId,
          },
          data: {
            forYouBrandsIds: Array.from(testUserForYouBrands),
          },
        });
      }
    }

    res.status(201).json(newBrand);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

router.put('/:id', async (req, res) => {
  try {
    if (req.user?.isAdmin !== 'true') {
      return res.status(403).send('User is not an admin');
    }

    const brandId = req.params.id;

    // Process specific fields if necessary
    const data = { ...req.body };

    // Remove the id from the data object
    delete data.id;

    // Handle special processing for pitchCaptions if present
    if (data.hasOwnProperty('pitchCaptions') && typeof data.pitchCaptions === 'string') {
      data.pitchCaptions = data.pitchCaptions.length > 0
        ? await srtToCaptions(data.pitchCaptions)
        : [];
    }

    // Handle products if provided
    const products = data.products || [];
    await deleteNonExistentProducts(products, brandId);
    await updateProducts(products, brandId);
    delete data.products;

    // Perform the update using Prisma
    delete data.feedbackImage;
    delete data.pitchPreviewImage;
    if (data.teaserVideo) {
      data.teaser = data.teaserVideo;
      delete data.teaserVideo;
    }
    const updatedBrand = await prisma.brands.update({
      where: { id: brandId },
      data,
      include: {
        products: true,
      },
    });

    // Return the updated brand
    return res.status(200).json(updatedBrand);
  } catch (error) {
    console.error(error);
    return res.status(500).send(error.message);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (req.user?.isAdmin !== 'true') {
      res.status(403).send('User is not an admin');
      return;
    } else {
      const brandId = req.params.id;

      const deletedBrand = await prisma.brands.delete({
        where: {
          id: brandId,
        },
      });
      res.status(200).json(deletedBrand);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

router.post('/byIds', authenticate, async (req, res) => {
  try {
    const { brandIds } = req.body;
    const brands = await prisma.brands.findMany({
      where: {
        id: {
          in: brandIds
        }
      },
      select: {
        name: true,
        mainPhrase: true,
        id: true,
      }
    });
    if (!brands) {
      return res.status(404).json({ message: 'No brands found for the given IDs' });
    }

    res.json(brands);
  } catch (error) {
    console.error('Failed to fetch brands by IDs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/removeFromDeleted', authenticate, async (req, res) => {
  try {
    const { brandIds } = req.body;
    const userId = req.headers.currentUserId;

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { deletedBrands: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedDeletedBrands = user.deletedBrands.filter(brandId => !brandIds.includes(brandId));

    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: { deletedBrands: updatedDeletedBrands }
    });

    res.status(200).json({ message: 'Brands removed from deleted successfully', updatedUser });
  } catch (error) {
    console.error('Failed to remove brands from deleted:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/feedback', [], async (req, res) => {
  try {
    const userId = req.headers.currentUserId;
    const { brandId, text, email } = req.body;
    const user = await prisma.users.findUnique({
      where: {
        id: userId,
      },
    });

    const brand = await prisma.brands.findUnique({
      where: {
        id: brandId,
        isVisible: true
      },
    });

    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }
    const name = user.name;

    const newFeedback = { text, email, name, userId, show: false };

    const updatedFeedback = Array.isArray(brand.usersFeedback)
      ? [...brand.usersFeedback, newFeedback]
      : [newFeedback];

    await prisma.brands.update({
      where: { id: brandId },
      data: { usersFeedback: updatedFeedback },
    });

    res.status(200).json({ message: 'Feedback submitted successfully' });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = {
  path: '/brands',
  router,
};
