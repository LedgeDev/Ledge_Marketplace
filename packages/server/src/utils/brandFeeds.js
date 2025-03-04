const prisma = require('../prisma');
const config = require('config');

const getAlternativeBudget = (budget) => {
  if(!budget) {
    return 1;
  }
  return parseInt(budget) === 1 ? 2 : parseInt(budget) - 1;
}

const getTargetGenders = (targetGender) => {
  if (targetGender === null || targetGender === undefined) {
    return ['both', 'other'];
  }
  if (targetGender === 'other' || targetGender === 'both') {
    return ['men', 'women', 'both', 'other'];
  }
  return [targetGender, 'both', 'other'];
};

async function updateFoundersReachedLeaderboard(userId, foundersToAdd) {
  const user = await prisma.users.findUnique({
    where: {
      id: userId,
    },
    include: {
      foundersReachedLeaderboard: true,
    },
  });
  if (!user) {
    return;
  }
  let foundersReached = user.foundersReachedLeaderboard?.amount
    ? user.foundersReachedLeaderboard.amount
    : 0;
  foundersReached += foundersToAdd;
  if (foundersReached <= 0) {
    return;
  }
  await prisma.foundersReachedLeaderboard.upsert({
    where: {
      amount: foundersReached,
    },
    update: {
      users: {
        connect: {
          id: userId,
        },
      },
    },
    create: {
      amount: foundersToAdd,
      users: {
        connect: {
          id: userId,
        },
      },
    },
  });
  return;
}

const getBrandsCategories = async (brandIds) => {
  const categories = await prisma.categories.findMany({
    where: {
      brands: {
        some: {
          id: {
            in: brandIds
          }
        }
      }
    }
  });
  return categories;
}

const getUserInterestedBrands = async (userId) => {
  const user = await prisma.users.findUnique({
    where: {
      id: userId
    },
    include: {
      brandUnlockHistory: true,
      dealCodes: {
        include: {
          group: true
        }
      },
    }
  });
  let userBrandIds = [...user.forYouBrandsIds, ...user.forYouBrandsPoolIds];
  userBrandIds = userBrandIds.filter(id => id);
  let targetGenders = getTargetGenders(user.targetGender);
  const interestedBrands = await prisma.brands.findMany({
    where: {
      isVisible: true,
      AND: [
        {
          id: {
            notIn: [...userBrandIds, ...user.notInterestedBrandsIds, ...user.deletedBrands]
          }
        },
        {
          targetGender: {
            in: targetGenders
          }
        },
        {
          budgetInterval: parseInt(user.budgetInterval)
        }
      ]
    }
  });
  return interestedBrands;
}

const getUserMayBeInterestedBrands = async (userId) => {
  const user = await prisma.users.findUnique({
    where: {
      id: userId
    },
    include: {
      brandUnlockHistory: true,
      dealCodes: {
        include: {
          group: true
        }
      }
    }
  });

  const userMyDealsIds = user.dealCodes.map(entry => entry.group.brandId);
  const userMyFavouritesIds = user.myFavourites.map(entry => entry.brandId);
  const userBrandIds = [...userMyDealsIds, ...user.forYouBrandsIds, ...user.forYouBrandsPoolIds, ...userMyFavouritesIds];
  const unlockedBrandsIds = user.brandUnlockHistory.map(entry => entry.brandId);
  const mayInterestedBrands = await prisma.brands.findMany({
    where: {
      isVisible: true,
      AND: [
        {
          id: {
            notIn: [...userBrandIds, ...unlockedBrandsIds, ...user.notInterestedBrandsIds, ...user.deletedBrands]
          }
        },
      ]
    }
  });
  return mayInterestedBrands;
}

const getUserNotInterestedBrands = async (userId) => {
  if (!userId) {
    return [];
  }
  const user = await prisma.users.findUnique({
    where: {
      id: userId
    }
  });
  const userTargetGender = user.targetGender;
  const userBudget = parseInt(user.budgetInterval);
  const alternativeBudget = getAlternativeBudget(userBudget);
  const targetGenders = getTargetGenders(userTargetGender);
  const notInterestedBrands = await prisma.brands.findMany({
    where: {
      isVisible: true,
      OR: [
        {
          targetGender: {
            not: {
              in: targetGenders
            }
          }
        },
        {
          AND: [
            {
              targetGender: {
                in: targetGenders
              }
            },
            {
              budgetInterval: {
                not: {
                  in: [userBudget, alternativeBudget]
                }
              }
            }
          ]
        },
        {
          id: {
            in: user.notInterestedBrandsIds,
          }
        }
      ]
    }
  });
  return notInterestedBrands;
}

const addToUserForYouBrandsPool = async (userId, brandIds) => {
  const updatedUser = await prisma.users.update({
    where: {
      id: userId
    },
    data: {
      forYouBrandsPoolIds: {
        push: brandIds
      }
    }
  });
  return updatedUser;
}

const refillUserForYouBrandsFromPool = async (userId) => {
  const user = await prisma.users.findUnique({
    where: {
      id: userId
    }
  });

  const userForYouBrandsPoolIds = [...user.forYouBrandsPoolIds];
  const userForYouBrandsIds = [...user.forYouBrandsIds];
  const forYouExpectedLength = 3;
  let filled = true;
  let poolNeedsRefill = false;

  while (userForYouBrandsIds.length < forYouExpectedLength && userForYouBrandsPoolIds.length > 0) {
    userForYouBrandsIds.push(userForYouBrandsPoolIds.shift());
    if (userForYouBrandsIds.length < forYouExpectedLength && userForYouBrandsPoolIds.length === 0) {
      filled = false;
      break;
    }
  }

  if (userForYouBrandsPoolIds.length < 1) {
    poolNeedsRefill = true;
  }

  await prisma.users.update({
    where: {
      id: userId
    },
    data: {
      forYouBrandsIds: userForYouBrandsIds,
      forYouBrandsPoolIds: userForYouBrandsPoolIds,
    }
  });

  return [filled, poolNeedsRefill];
}

async function removeBrandFromForYou(brandId, userId) {
  const user = await prisma.users.findUnique({
    where: {
      id: userId,
    },
  });
  if (!user) {
    return;
  }
  if (!user.forYouBrandsIds.includes(brandId)) {
    return;
  }
  await prisma.users.update({
    where: {
      id: userId,
    },
    data: {
      forYouBrandsIds: {
        set: user.forYouBrandsIds.filter((id) => id !== brandId),
      },
    },
  });
}

async function addBrandToMyDeals(brandId, userId) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    include: { dealCodes: { include: { group: true } } },
  });

  if (!user) {
    return "User doesn't exist";
  }

  if (user.deletedBrands.includes(brandId)) {
    const newDeletedBrands = user.deletedBrands.filter(id => id !== brandId);
    await prisma.users.update({
      where: { id: userId },
      data: {
        deletedBrands: newDeletedBrands,
      },
    });
  }

  const brand = await prisma.brands.findUnique({
    where: {
      id: brandId,
      isVisible: true,
     },
    include: {
      dealCodeGroups: true
    }
  });

  if (!brand) {
    return "Brand doesn't exist";
  }

  const existingDealCode = user.dealCodes.find(code =>
    code.group.brandId === brandId
  );
  if (existingDealCode) {
    return "User already has a deal code for this brand";
  }

  const dealCode = await prisma.deal_codes.findFirst({
    where: {
      groupId: {
        in: brand.dealCodeGroups.map(group => group.id)
      },
      userId: null,
      isUsed: false,
    },
  });

  if (!dealCode) {
    return "No deal codes available for this brand";
  }

  const unlockedAt = new Date(Date.now());

  const dealExpirationDays = parseInt(config.get('dealExpirationDays'));
  const userExpireDate = new Date(Date.now() + dealExpirationDays * 24 * 60 * 60 * 1000);

  const updatedDealCode = await prisma.deal_codes.update({
    where: { id: dealCode.id },
    data: {
      userId,
      unlockedAt,
      userExpireDate,
    },
  });

  await prisma.users.update({
    where: { id: userId },
    data: {
      brandsExplored: {
        increment: 1,
      },
    },
  });

  const foundersReached = brand.founders?.length || 1;
  await updateFoundersReachedLeaderboard(userId, foundersReached);

  return updatedDealCode;
}

async function addBrandToDeletedBrands(brandId, userId) {
  const userInfo = await prisma.users.findUnique({
    where: {
      id: userId,
    },
  });

  const updatedViewedPitches = userInfo.deletedBrands
    ? [...userInfo.deletedBrands]
    : [];

  if (!updatedViewedPitches.includes(brandId)) {
    updatedViewedPitches.push(brandId);
  }

  await prisma.users.update({
    where: {
      id: userId,
    },
    data: {
      deletedBrands: updatedViewedPitches,
    },
  });
}

async function addBrandToNotInterestedBrands(brandId, userId) {
  const userInfo = await prisma.users.findUnique({
    where: {
      id: userId,
    },
  });

  const updatedNotInterestedBrands = userInfo.notInterestedBrandsIds
    ? [...userInfo.notInterestedBrandsIds]
    : [];

  if (!updatedNotInterestedBrands.includes(brandId)) {
    updatedNotInterestedBrands.push(brandId);
  }

  await prisma.users.update({
    where: {
      id: userId,
    },
    data: {
      notInterestedBrandsIds: updatedNotInterestedBrands,
    },
  });
}

function getBrandsToRotate(user) {
  try {
    const forYouViews = user.contentViews.filter(view => view.section === 'forYou');
    const brandProfileViews = user.contentViews.filter(view => view.section === 'brandProfile');
    // we rotate the brands that:
    // 1. have been viewed 3 or more times in for you, or
    // 2. the brand profile has been seen and the brand has been viewed 1 or more times after that
    let brandsToRotate = user.forYouBrands.filter(brand => {
      const brandView = forYouViews.find(view => view.contentId === brand.id);
      const brandProfileView = brandProfileViews.find(view => view.contentId === brand.id);

      return (
        brandView?.views >= 3 || (
          brandView?.views >= 1 &&
          brandProfileView?.views >= 1 &&
          brandView?.updatedAt > brandProfileView?.createdAt
        )
      );
    });
    return brandsToRotate.map(brand => brand.id) || [];
  } catch (error) {
    console.error('Error getting brands to rotate', error);
    return [];
  }
}

async function rotateSleeperForYouBrands(userId) {
  let user = await prisma.users.findUnique({
    where: {
      id: userId
    },
    include: {
      contentViews: {
        where: {
          section: {
            in: ['forYou', 'brandProfile']
          },
          contentType: 'brand',
        }
      },
      forYouBrands: true,
    }
  });

  const brandsToRotate = getBrandsToRotate(user);

  // we remove the content views for the brands that we are going to rotate,
  // so thet don't get rotated again when they get back in the for you
  await prisma.content_views.deleteMany({
    where: {
      userId,
      contentId: {
        in: brandsToRotate
      },
      contentType: 'brand',
    }
  });

  // the brands that were previously rotated, are added to the not interested brands.
  const previouslyRotatedBrands = brandsToRotate.filter(brandId => user.recentlyRotatedBrandsIds.includes(brandId));
  // the ones that were not rotated, are added to the for you brands pool and the recently rotated brands
  const firstTimeRotatedBrands = brandsToRotate.filter(brandId => !user.recentlyRotatedBrandsIds.includes(brandId));

  await prisma.users.update({
    where: {
      id: userId
    },
    data: {
      forYouBrandsIds: {
        set: user.forYouBrandsIds.filter((id) => !brandsToRotate.includes(id)),
      },
      forYouBrandsPoolIds: {
        push: firstTimeRotatedBrands,
      },
      recentlyRotatedBrands: {
        connect: firstTimeRotatedBrands.map(id => ({ id })),
        disconnect: previouslyRotatedBrands.map(id => ({ id })),
      },
      notInterestedBrandsIds: {
        push: previouslyRotatedBrands
      },
    }
  });
  await refillUserForYouBrandsFromPool(userId);
  user = await prisma.users.findUnique({
    where: {
      id: userId,
    },
  });
  const forYouBrandsIds = user.forYouBrandsIds;
  const interestedBrands = await getUserMayBeInterestedBrands(userId);
  const brandsAvailableForPool = interestedBrands.length > 0;
  return { forYouBrandsIds, brandsAvailableForPool };
}

async function restoreBrandFromDeleted(brandId, userId){
  const user = await prisma.users.findUnique({
    where: {
      id: userId,
    },
  });

  const newDeletedBrands = user.deletedBrands.filter(id => id !== brandId);

  await prisma.users.update({
    where: {
      id: userId,
    },
    data: {
      deletedBrands: newDeletedBrands,
    },
  });

  return;
}

module.exports = {
  getBrandsCategories,
  getUserInterestedBrands,
  getUserMayBeInterestedBrands,
  getUserNotInterestedBrands,
  addToUserForYouBrandsPool,
  refillUserForYouBrandsFromPool,
  removeBrandFromForYou,
  addBrandToMyDeals,
  addBrandToDeletedBrands,
  addBrandToNotInterestedBrands,
  rotateSleeperForYouBrands,
  getBrandsToRotate,
  restoreBrandFromDeleted
}
