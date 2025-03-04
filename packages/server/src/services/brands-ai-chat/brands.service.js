const {
  handleAgeDistributionIntent,
  handleRatingIntent,
  handleBrandCollaborationIntent,
  handleBrandPerformanceIntent,
  handleAnswersAnalysisIntent
} = require('./brandsAi.service.js');

async function handleIntent(intent, enhancedQuery, brandId, retryCount = 0) {
  console.log("habdling Intent", intent);
  try {
    let result;

    switch (intent) {
      case 'AGE_DISTRIBUTION':
        result = await handleAgeDistributionIntent(brandId, enhancedQuery);
        break;

      case 'RATING_ANSWERS_ANALYSIS':
        result = await handleRatingIntent(brandId, enhancedQuery);
        break;

      case 'BRAND_COLLABORATION_OPPORTUNITIES':
        result = await handleBrandCollaborationIntent(brandId, enhancedQuery);
        break;

      case 'ANSWERS_ANALYSIS':
        result = await handleAnswersAnalysisIntent(brandId, enhancedQuery);
        break;

      case 'BRAND_PERFORMANCE':
        console.log("Brand Performance Intent", brandId, enhancedQuery);
        result = await handleBrandPerformanceIntent(brandId, enhancedQuery);
        break;

      case 'NOT_AVAILABLE':
        result = "I'm sorry, I don't have an answer for that right now. But I can help you with other things! 😊";
        break;
      default:
        logger.error('Invalid query intent received', { intent });
        throw new Error('Invalid query intent');
    }


    return result;

  } catch (error) {
    logger.error('Error handling intent', {
      error: error.message,
      intent,
      retryCount
    });

    // Handle retries for specific errors
    if (retryCount < 3) {
      return handleIntent(intent, enhancedQuery, brandId, retryCount + 1);
    }
    throw error;
  }
}

module.exports = {
  handleIntent
};
