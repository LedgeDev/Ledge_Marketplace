const prisma = require('../../prisma.js');
const OpenAIApi = require('openai');
const openai = new OpenAIApi({ key: process.env.OPENAI_API_KEY });

async function handleAgeDistributionIntent(brandId, userPrompt) {
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

    console.log("Distribution", distribution);

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

    const prompt = `The age distribution of users who interact with the brand is as follows: ${JSON.stringify(distribution)}. The user asks: ${userPrompt}. Considering this user prompt, just respond with what the user is asking. Also consider that the distribution only includes the users that responded the age question.`;
    // Ask OpenAI to analyze the distribution data
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini-2024-07-18",
      messages: [
        {
          role: "system",
          content: "You analyze data distributions."
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 300,
      temperature: 0
    });

    const response = completion.choices[0].message.content.trim();

    return response;
  } catch (error) {
    console.error('Error in handleAgeRatingDistributionIntent:', error);
    throw error;
  }
}

async function handleRatingIntent(brandId, userPrompt) {
  try {

    // Get all the users that gave a rating to the brand
    const ratings = await prisma.ratings.findMany({
      where: {
        brandId
      }
    });

    // Calculate total average rating
    const totalSum = ratings.reduce((sum, rating) => sum + rating.rating, 0);
    const totalAverageRating = ratings.length > 0 ? Number((totalSum / ratings.length).toFixed(2)) : 0;

    // Get the user ids of those users
    const userIds = ratings.map(rating => rating.userId);

    // First, get all age answers for the brand's users to get total distribution
    const allAgeAnswers = await prisma.answers.findMany({
      where: {
        questionId: "66bb764e0a7b3e2061d61bb4" // ID of the age question
      }
    });

    // Get age answers for users who rated
    const raterAgeAnswers = await prisma.answers.findMany({
      where: {
        userId: {
          in: userIds
        },
        questionId: "66bb764e0a7b3e2061d61bb4" // ID of the age question
      }
    });

    // Create maps to store user age intervals
    const userAgeMap = new Map(); // For users who rated
    const totalUsersPerInterval = new Map(); // For all users

    // Count total users per interval
    allAgeAnswers.forEach(answer => {
      const selectedInterval = answer.answer.value;
      if (selectedInterval) {
        totalUsersPerInterval.set(
          selectedInterval,
          (totalUsersPerInterval.get(selectedInterval) || 0) + 1
        );
      }
    });

    // Map ages for users who rated
    raterAgeAnswers.forEach(answer => {
      const selectedInterval = answer.answer.value;
      if (selectedInterval) {
        userAgeMap.set(answer.userId, selectedInterval);
      }
    });

    // Create a map to store sums and counts for each interval
    const intervalRatings = new Map(); // Map<interval, {sum: number, count: number}>

    // Process ratings and calculate sums for each interval
    ratings.forEach(rating => {
      const userInterval = userAgeMap.get(rating.userId);
      if (userInterval) {
        if (!intervalRatings.has(userInterval)) {
          intervalRatings.set(userInterval, { sum: 0, count: 0 });
        }
        const stats = intervalRatings.get(userInterval);
        stats.sum += rating.rating;
        stats.count++;
      }
    });

    // Prepare final result
    const result = {
      totalRatings: ratings.length,
      rating: totalAverageRating,
      usersWithAgeData: raterAgeAnswers.length,
      ratingsByAgeInterval: {}
    };

    // Calculate average for each interval and include total users
    totalUsersPerInterval.forEach((totalUsers, interval) => {
      const ratingStats = intervalRatings.get(interval) || { sum: 0, count: 0 };
      result.ratingsByAgeInterval[interval] = {
        averageRating: ratingStats.count > 0 ? Number((ratingStats.sum / ratingStats.count).toFixed(2)) : 0,
        numberOfRatings: ratingStats.count
      };
    });

    const prompt = `The data of atings given to the brand is the following: ${JSON.stringify(result)}. The user asks: ${userPrompt}. Considering this user prompt, respond with what the user is asking, not extra data that user not asked for. Consider that we dont have the age data of all users, so we will give him just that info for the intervals. Consider that the rating is from 1 to 5.

    For example, if the users asks 'Give me the ratings of my brand, just for users with more than 61 years'
    You respond something like 'Those users gave a average Rating of 5, with a total of 20 ratings.

    For example, if the users asks 'Give me the total rating of my brand'
    You respond something like 'The total rating of your brand is 4.5, with a total of 100 ratings.
    `;

    // Now that we have the distribution, we ask open ai to answer the user prompt considering the data we have
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini-2024-07-18",
      messages: [
        {
          role: "system",
          content: "You are a friendly AI assistant. Please provide a detailed explanation of the ratings given to the brand, considering the user prompt."
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0
    });

    const response = completion.choices[0].message.content.trim();

    console.log("Response", response);

    return response;

  } catch (error) {
    console.error('Error in handleRatingIntent:', error);
    throw error;
  }
}

async function handleBrandCollaborationIntent(brandId, userPrompt) {
  try {
    // Get the current brand's information
    const currentBrand = await prisma.brands.findUnique({
      where: {
        id: brandId
      },
      select: {
        id: true,
        name: true,
        description: true,
        shortDescription: true,
        categoryId: true
      }
    });

    if (!currentBrand) {
      throw new Error('Brand not found');
    }

    // Get all other brands' information
    const otherBrands = await prisma.brands.findMany({
      where: {
        id: {
          not: brandId
        },
        isVisible: true // Only consider visible brands
      },
      select: {
        id: true,
        name: true,
        description: true,
        shortDescription: true,
        categoryId: true
      }
    });

    const natural = require('natural');
    const tokenizer = new natural.WordTokenizer();
    const TfIdf = natural.TfIdf;
    const stemmer = natural.PorterStemmer;

    // Function to extract key terms from text using NLP techniques
    const extractKeyTerms = (text) => {
      if (!text) return [];

      // Convert the text to string if it's an object (JSON)
      const textString = typeof text === 'object' ? JSON.stringify(text) : text;

      // Create TF-IDF instance
      const tfidf = new TfIdf();

      // Tokenize and clean the text
      const tokens = tokenizer.tokenize(textString.toLowerCase());

      // Remove stopwords and short terms
      const cleanTokens = tokens.filter(token =>
        !natural.stopwords.includes(token) &&
        token.length > 2 &&
        !/^\d+$/.test(token)
      );

      // Stem the words to group similar terms
      const stemmedTokens = cleanTokens.map(token => stemmer.stem(token));

      // Add the document to TF-IDF
      tfidf.addDocument(stemmedTokens);

      // Get terms with their TF-IDF scores
      const termScores = [];
      tfidf.listTerms(0 /*document index*/).forEach(item => {
        // Find original terms for this stem
        const originalTerms = cleanTokens.filter(token =>
          stemmer.stem(token) === item.term
        );

        if (originalTerms.length > 0) {
          termScores.push({
            term: originalTerms[0], // Use the first original term
            score: item.tfidf
          });
        }
      });

      // Sort by TF-IDF score and get top terms
      const sortedTerms = termScores
        .sort((a, b) => b.score - a.score)
        .slice(0, 15)
        .map(item => item.term);

      return sortedTerms;
    };

    // Process current brand description
    const currentBrandTerms = {
      fromDescription: extractKeyTerms(currentBrand.description),
      fromShortDescription: extractKeyTerms(currentBrand.shortDescription)
    };

    // Process other brands' descriptions
    const processedOtherBrands = otherBrands.map(brand => ({
      name: brand.name,
      categoryId: brand.categoryId,
      keyTerms: {
        fromDescription: extractKeyTerms(brand.description),
        fromShortDescription: extractKeyTerms(brand.shortDescription)
      }
    }));

    // Prepare the data structure for the AI analysis
    const brandsData = {
      currentBrand: {
        name: currentBrand.name,
        categoryId: currentBrand.categoryId,
        keyTerms: currentBrandTerms
      },
      otherBrands: processedOtherBrands
    };

    const prompt = `You are a brand collaboration expert. Analyze the following brands and identify potential collaboration opportunities with the current brand.

Current brand: ${JSON.stringify(brandsData.currentBrand)}

Other brands: ${JSON.stringify(brandsData.otherBrands)}

Based on the descriptions, identify which brands would make good collaboration partners with the current brand. Consider factors like:
- Complementary products or services
- Similar target audiences
- Shared values or missions
- Non-competing but related market segments
- Potential for creative joint initiatives

The user asks: ${userPrompt}

Please provide recommendations for potential brand collaborations, explaining why they would be good matches.`;

    // Get AI analysis of potential collaborations
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini-2024-07-18",
      messages: [
        {
          role: "system",
          content: "You are a brand collaboration expert who helps identify synergistic partnership opportunities between brands."
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.7 // Slightly higher temperature for more creative recommendations
    });

    const response = completion.choices[0].message.content.trim();
    return response;

  } catch (error) {
    console.error('Error in handleBrandCollaborationIntent:', error);
    throw error;
  }
}

async function handleBrandPerformanceIntent(brandId, userPrompt) {
  try {

    // Get all the dealcode groups with counts for each brand, only counting codes with non-null userId
    const dealCodeGroups = await prisma.deal_code_groups.findMany({
      select: {
        brandId: true,
        brand: {
          select: {
            name: true,
            description: true
          }
        },
        _count: {
          select: {
            dealCodes: {
              where: {
                userId: {
                  not: null
                }
              }
            }
          }
        }
      }
    });

    // Create array of brands with their counts for ranking
    const brandStats = dealCodeGroups.reduce((acc, group) => {
      if (!acc[group.brandId]) {
        acc[group.brandId] = {
          count: 0,
          name: group.brand.name,
          description: group.brand.description
        };
      }
      acc[group.brandId].count += group._count.dealCodes;
      return acc;
    }, {});

    // Convert to array and sort by count
    const sortedBrands = Object.entries(brandStats)
      .map(([id, data]) => ({
        id,
        count: data.count,
        name: data.name,
        description: data.description
      }))
      .sort((a, b) => b.count - a.count);

    // Find current brand's position
    const currentBrandIndex = sortedBrands.findIndex(b => b.id === brandId);
    const totalBrands = sortedBrands.length;
    const percentileRank = ((totalBrands - currentBrandIndex - 1) / totalBrands) * 100;

    // Find brand immediately above
    const brandsAbove = currentBrandIndex > 0 ?
      sortedBrands.slice(Math.max(0, currentBrandIndex - 1), currentBrandIndex) :
      [];

    // Find brand immediately below
    const brandsBelow = currentBrandIndex < totalBrands - 1 ?
      sortedBrands.slice(currentBrandIndex + 1, Math.min(totalBrands, currentBrandIndex + 2)) :
      [];

    // Current brand name
    const currentBrandName = sortedBrands.find(b => b.id === brandId)?.name;

    // Prepare the performance data
    const performanceData = {
      currentBrandName: currentBrandName,
      totalUsersThatHaveSeenTheBrand: brandStats[brandId]?.count || 0,
      rankPercentage: 100 - Math.round(percentileRank),
      brandJustAbove: brandsAbove.map(brand => ({
        name: brand.name,
        description: brand.description,
        usedCodes: brand.count
      })),
      brandJustBelow: brandsBelow.map(brand => ({
        name: brand.name,
        description: brand.description,
        usedCodes: brand.count
      }))
    };

    // Create a prompt to answer the user prompt
    const prompt = `The performance data of the brand with id ${brandId} is the following: ${JSON.stringify(performanceData)}. The user asks: ${userPrompt}. Talk about the brands that are just below and above this brand, and talk very little about what they do. Tell the users that this brands have very similar performance to this brand.
    The rankPercentage means that this brand is in the top ${performanceData.rankPercentage}% of the brands in terms of performance.
    `;

    // Use ai to answer the user prompt
    const questionIdCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini-2024-07-18",
      messages: [
        { role: "user", content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0
    });

    const response = questionIdCompletion.choices[0].message.content.trim();

    return response;

  } catch (error) {
    console.error('Error in handleBrandPerformanceIntent:', error);
    throw error;
  }
}

async function handleAnswersAnalysisIntent(brandId, userPrompt) {
  try {
    // First get all questions for this brand
    const brandQuestions = await prisma.questions.findMany({
      where: {
        brandId: brandId
      },
      select: {
        id: true,
        question: true,
        type: true,
        options: true
      }
    });

    if (!brandQuestions || brandQuestions.length === 0) {
      return "No questions found for this brand.";
    }

    // Create a prompt to identify which question the user is interested in
    const questionsPrompt = `Here are all the questions for this brand:
${brandQuestions.map(q => `Question ID: ${q.id}
English: ${q.question.en}
German: ${q.question.de}
Type: ${q.type}
${q.options ? `Options: ${JSON.stringify(q.options)}` : ''}
---`).join('\n')}

The user asks: "${userPrompt}"

Please identify which question ID is most relevant to what the user is asking about. Just return the question ID, nothing else. If no question seems relevant, return "none".`;

    // Ask OpenAI to identify the relevant question
    const questionIdCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini-2024-07-18",
      messages: [
        {
          role: "system",
          content: "You are a helpful AI that identifies relevant questions based on user queries. Only respond with the question ID or 'none'."
        },
        { role: "user", content: questionsPrompt }
      ],
      max_tokens: 50,
      temperature: 0
    });

    const relevantQuestionId = questionIdCompletion.choices[0].message.content.trim();

    console.log("Relevant Question ID:", relevantQuestionId);

    if (relevantQuestionId === "none") {
      return "I couldn't find any relevant questions matching your query.";
    }

    // Get all answers for the identified question
    const answers = await prisma.answers.findMany({
      where: {
        questionId: relevantQuestionId
      },
      select: {
        answer: true,
        userId: true,
        createdAt: true
      }
    });

    if (!answers || answers.length === 0) {
      return "No answers found for this question.";
    }

    // Get the question details for context
    const questionDetails = brandQuestions.find(q => q.id === relevantQuestionId);

    console.log("Question Details:", questionDetails);

    // Prepare the data for analysis
    const analysisData = {
      question: questionDetails.question,
      questionType: questionDetails.type,
      options: questionDetails.options,
      totalResponses: answers.length,
      answers: answers.map(a => ({
        value: a.answer.value,
        timestamp: a.createdAt
      }))
    };

    // Create a prompt for analyzing the answers
    const analysisPrompt = `Here is the data for the question "${questionDetails.question.en}":

${JSON.stringify(analysisData, null, 2)}

The user asks: "${userPrompt}"

Please analyze this data and provide insights about the answers. Consider:
- Distribution of answers if it's a multiple choice question
- Common themes or patterns in text answers
- Any trends over time
- Notable statistics or findings

Focus specifically on what the user is asking about.`;

    // Get AI analysis of the answers
    const analysisCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini-2024-07-18",
      messages: [
        {
          role: "system",
          content: "You are a data analyst who helps interpret survey responses and questionnaire data."
        },
        { role: "user", content: analysisPrompt }
      ],
      max_tokens: 1000,
      temperature: 0.3
    });

    return analysisCompletion.choices[0].message.content.trim();

  } catch (error) {
    console.error('Error in handleAnswersAnalysisIntent:', error);
    throw error;
  }
}

module.exports = {
  handleAgeDistributionIntent,
  handleRatingIntent,
  handleBrandCollaborationIntent,
  handleBrandPerformanceIntent,
  handleAnswersAnalysisIntent
};
