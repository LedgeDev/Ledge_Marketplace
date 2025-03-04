const prisma = require('../../prisma.js');

async function handleAgeRatingDistributionIntent(brandId, userPromp) {
  try {
    // First get all the dealcode groups of the brand
    const dealCodeGroups = await prisma.deal_code_groups.findMany({
      where: {
        brandId
      }
    });

    // Now get the dealcodes from those dealCodeGroups that have userId not null
    const dealCodes = await prisma.deal_codes.findMany({
      where: {
        groupId: {
          in: dealCodeGroups.map(group => group.id)
        },
        userId: {
          not: null
        }
      }
    });

    // Get the users ids
    const userIds = dealCodes.map(dealcode => dealcode.userId);

    // Get the age answers of those users
    const ageAnswers = await prisma.answers.findMany({
      where: {
        userId: {
          in: userIds
        },
        questionId: "66bb764e0a7b3e2061d61bb4" // ID of the age question
      }
    });

    // From those users, get the ones that have the brand in their favorites
    const usersWithFavorites = await prisma.users.findMany({
      where: {
        id: {
          in: userIds
        }
      },
      select: {
        id: true,
        myFavourites: true
      }
    });

    // Create a set of user IDs who have this brand in favorites for quick lookup
    const userIdsWithBrandInFavorites = new Set(
      usersWithFavorites
        .filter(user => {
          return user.myFavourites.some(favorite => {
            if (typeof favorite === 'object') {
              return favorite.brandId === brandId;
            }
            return favorite === brandId;
          });
        })
        .map(user => user.id)
    );

    // Create separate distributions for all users and favorites
    const distribution = {
      totalUsers: userIds.length,
      totalUsersWithBrandInFavorites: userIdsWithBrandInFavorites.size,
      allUsersAgeDistribution: {},
      favoriteUsersAgeDistribution: {}
    };

    // Process each age answer
    ageAnswers.forEach(answer => {
      // Make sure we're getting the actual age value (assuming it's in the answer field)
      const age = answer.answer.value || answer.answer; // Adjust this based on your actual data structure

      if (age) {
        // Add to all users distribution
        distribution.allUsersAgeDistribution[age] = (distribution.allUsersAgeDistribution[age] || 0) + 1;

        // If user has brand in favorites, add to favorites distribution
        if (userIdsWithBrandInFavorites.has(answer.userId)) {
          distribution.favoriteUsersAgeDistribution[age] = (distribution.favoriteUsersAgeDistribution[age] || 0) + 1;
        }
      }
    });

    // Now that we have the distribution, we ask open ai to c

  } catch (error) {
    console.error('Error in handleAgeRatingDistributionIntent:', error);
    throw error;
  }
}

async function handleFeedbackAnalysisIntent(randId) {
  try {

    // Get users that have responded the pitch. Also get their feedback answer (with the question of the feedback)



  } catch (error) {
    throw error;
  }
}

async function handleBrandCollaborationIntent(randId) {
  try {

  } catch (error) {
    throw error;
  }
}

async function handleBrandPerformanceIntent(randId) {
  try {

  } catch (error) {
    throw error;
  }
}

async function handleAnswersAnalysisIntent(randId) {
  try {

  } catch (error) {
    throw error;
  }
}

module.exports = {
  handleAgeRatingDistributionIntent,
  handleFeedbackAnalysisIntent,
  handleBrandCollaborationIntent,
  handleBrandPerformanceIntent,
  handleAnswersAnalysisIntent
};

handleAgeRatingDistributionIntent("661fac0ceb3c5c594e3a1d41")
    .then(results => {
        console.log('Results', results);
    })
    .catch(error => {
        console.error('Error:', error);
    });
