const prisma = require("../../prisma");
const express = require("express");
const { authenticate } = require("../../authentication");
const router = express.Router();
const config = require('config');
const OpenAIApi = require('openai');
const openai = new OpenAIApi({ key: process.env.OPENAI_API_KEY });
const { processTextQuestion, processSelectQuestion, processRankingQuestion } = require('./utils');

router.use(authenticate);

const round = (value) => Math.round(value * 10) / 10; // round to 1 decimal place

const getAnswersTokenLength = (answers) => answers.reduce((acc, answer) => acc + answer.answer.length, 0);

const makeAIQuery = async (prompt) => {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini-2024-07-18",
    messages: [
      {
        role: "system",
        content: "Provide the requested answer directly"
      },
      { role: "user", content: prompt }
    ],
    max_tokens: 600,
    temperature: 0.7,
  });

  const response = completion.choices[0].message.content.trim();
  return response;
}


router.get("/ages", [], async (req, res) => {
  try {
    const ageQuestionId = config.get('ageQuestionId');
    const users = await prisma.users.findMany({
      where: {
        answers: {
          some: {
            questionId: ageQuestionId,
          },
        },
      },
      include: {
        answers: {
          where: {
            questionId: ageQuestionId,
          },
        },
      },
    });

    const ageQuestion = await prisma.questions.findUnique({
      where: {
        id: ageQuestionId,
      },
    });
    if (!ageQuestion) {
      res.status(404).send("Age question not found");
      return;
    }
    const ageGroups = ageQuestion.options.map((option) => {
      const ageGroup = {
        id: option.id,
        name: option.en,
        count: 0,
      };
      users.forEach((user) => {
        if (user.answers.find((answer) => answer.questionId === ageQuestionId && answer.answer.optionId === option.id)) {
          ageGroup.count++;
        }
      });
      return ageGroup;
    });

    res.json({
      total: users.length,
      data: ageGroups,
    });

  } catch (error) {
    console.error('Error fetching age insights:', error);
    res.status(500).send(error.message);
  }
});

router.get("/genders", [], async (req, res) => {
  try {
    const genderQuestionId = config.get('levelGenderQuestionId');
    const users = await prisma.users.findMany({
      where: {
        answers: {
          some: {
            questionId: genderQuestionId,
          },
        },
      },
      include: {
        answers: {
          where: {
            questionId: genderQuestionId,
          },
        },
      },
    });

    const genderQuestion = await prisma.questions.findUnique({
      where: {
        id: genderQuestionId,
      },
    });
    if (!genderQuestion) {
      res.status(404).send("Gender question not found");
      return;
    }
    const genderGroups = genderQuestion.options.map((option => {
      const genderGroup = {
        id: option.id,
        name: option.en,
        count: 0,
      };
      users.forEach((user) => {
        if (user.answers.find((answer) => answer.questionId === genderQuestionId && answer.answer.optionId === option.id)) {
          genderGroup.count++;
        }
      });
      return genderGroup;
    }));

    res.json({
      total: users.length,
      data: genderGroups,
    });

  } catch (error) {
    console.error('Error fetching gender insights:', error);
    res.status(500).send(error.message);
  }
});

router.get("/target-genders", [], async (req, res) => {
  try {
    const genderQuestionId = config.get('targetGenderQuestionId');
    const users = await prisma.users.findMany({
      where: {
        answers: {
          some: {
            questionId: genderQuestionId,
          },
        },
      },
      include: {
        answers: {
          where: {
            questionId: genderQuestionId,
          },
        },
      },
    });

    const genderQuestion = await prisma.questions.findUnique({
      where: {
        id: genderQuestionId,
      },
    });
    if (!genderQuestion) {
      res.status(404).send("Gender question not found");
      return;
    }
    const genderGroups = genderQuestion.options.map((option => {
      const genderGroup = {
        id: option.id,
        name: option.en,
        count: 0,
      };
      users.forEach((user) => {
        if (user.answers.find((answer) => answer.questionId === genderQuestionId && answer.answer.optionId === option.id)) {
          genderGroup.count++;
        }
      });
      return genderGroup;
    }));

    res.json({
      total: users.length,
      data: genderGroups,
    });

  } catch (error) {
    console.error('Error fetching gender insights:', error);
    res.status(500).send(error.message);
  }
});

router.get("/social-media", [], async (req, res) => {
  try {
    const questionId = config.get('favouriteSocialMediaQuestion');

    const answers = await prisma.answers.findMany({
      where: {
        questionId: questionId,
      },
    });

    const question = await prisma.questions.findUnique({
      where: {
        id: questionId,
      },
    });

    if (!question) {
      res.status(404).send("Social media question not found");
      return;
    }

    const groups = question.options.map(option => {
      const group = {
        id: option.id,
        name: option.en,
        count: 0,
      };
      answers.forEach((answer) => {
        const position = answer.answer.value?.indexOf(option.id) + 1;
        group.count += position;
      });
      return group;
    });
    const averageGroups = groups.map(group => {
      return {
        ...group,
        count: group.count / answers.length,
      };
    });
    averageGroups.sort((a, b) => a.count - b.count);

    res.json({
      total: answers.length,
      data: averageGroups,
    });

  } catch (error) {
    console.error('Error fetching gender insights:', error);
    res.status(500).send(error.message);
  }
});

router.get("/home-insights", [], async (req, res) => {
  try {
    const interactionsCompleted = await prisma.deal_codes.count({
      where: {
        userId: {
          not: null,
        }
      },
    });

    const brandsCount = await prisma.brands.count();
    const questionsCount = await prisma.questions.count();
    const usersCount = await prisma.users.count();
    const benefitsCount = await prisma.benefits.count();
    const postsCount = await prisma.posts.count();

    res.json({
      interactions: interactionsCompleted,
      brands: brandsCount,
      questions: questionsCount,
      users: usersCount,
      benefits: benefitsCount,
      posts: postsCount,
    });

  } catch (error) {
    console.error('Error fetching interactions insights:', error);
    res.status(500).send(error.message);
  }
});

router.get("/brands/:id", [], async (req, res) => {
  try {
    const brandId = req.params.id;
    const results = {};
    // 1. amount of pitch views
    // 2. perc of users that gave feedback over the ones that viewed the pitch
    // 3. top perc of the brand in terms of pitch views, over all brands

    // 4. amount and perc of users that liked the brand, over all that unlocked the brand
    const unlockedDealCodes = await prisma.deal_codes.findMany({
      where: {
        group: {
          brandId: brandId,
        },
        userId: {
          not: null,
        },
      },
    });
    // count unique userIds
    const usersIdsUnlocked = new Set(unlockedDealCodes.map(dealCode => dealCode.userId));
    const usersUnlocked = await prisma.users.findMany({
      where: {
        id: {
          in: Array.from(usersIdsUnlocked),
        },
      },
    });
    const usersLiked = usersUnlocked.filter(user => user.myFavourites.some(favourite => favourite.brandId === brandId));
    results.usersLikedAmount = usersLiked.length;
    results.usersUnlockedAmount = usersUnlocked.length;
    // round to 1 decimal places
    results.usersLikedPerc = round((usersLiked.length / usersUnlocked.length) * 100);

    // 5. amount and perc of users that visited the website, over all that visited the brand profile
    const usersVisitedBrandProfile = await prisma.users.findMany({
      where: {
        brandScreenTimes: {
          some: {
            brandId: brandId,
          },
        }
      },
    });
    const usersVisitedWebsite = await prisma.users.findMany({
      where: {
        linkVisits: {
          some: {
            brandId: brandId,
          },
        }
      }
    });
    results.usersVisitedWebsiteAmount = usersVisitedWebsite.length;
    results.usersVisitedWebsitePerc = round((usersVisitedWebsite.length / usersVisitedBrandProfile.length) * 100);

    // 6. perc distribution (pie chart) of age groups, of users that unlocked the brand and answered the question
    const ageQuestionId = config.get('ageQuestionId');
    const usersWithAge = await prisma.users.findMany({
      where: {
        id: {
          in: Array.from(usersIdsUnlocked),
        },
        answers: {
          some: {
            questionId: ageQuestionId,
          },
        },
      },
      include: {
        answers: {
          where: {
            questionId: ageQuestionId,
          },
        },
      },
    })
    const ageQuestion = await prisma.questions.findUnique({
      where: {
        id: ageQuestionId,
      },
    });
    if (!ageQuestion) {
      res.status(404).send("Age question not found");
      return;
    }
    const ageGroups = ageQuestion.options.map((option) => {
      const ageGroup = {
        id: option.id,
        name: option.en,
        count: 0,
      };
      usersWithAge.forEach((user) => {
        if (user.answers.find((answer) => answer.questionId === ageQuestionId && answer.answer.optionId === option.id)) {
          ageGroup.count++;
        }
      });
      return ageGroup;
    });
    ageGroups.forEach(group => {
      group.perc = round((group.count / usersWithAge.length) * 100);
    });
    results.ageGroupsDistribution = ageGroups;

    // 7. rating
    const ratings = await prisma.ratings.findMany({
      where: {
        brandId: brandId,
      }
    });
    const ratingsCount = ratings.length;
    const ratingsSum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
    results.ratingsAverage = round(ratingsSum / ratingsCount);
    results.ratingsAmount = ratingsCount;
    res.json(results);

  } catch (error) {
    console.error('Error fetching brand insights:', error);
    res.status(500).send(error.message);
  }
});

router.get("/brands/:id/pitch-answers", [], async (req, res) => {
  try {
    const brandId = req.params.id;
    const brand = await prisma.brands.findUnique({
      where: {
        id: brandId,
      }
    });

    const pitchQuestionsWithAnswers = await prisma.questions.findMany({
      where: {
        brandId: brandId,
        correctAnswerId: null,
      },
      include: {
        answers: true,
      },
    });
    const results = []
    for (let i = 0; i < pitchQuestionsWithAnswers.length; i++) {
      const question = pitchQuestionsWithAnswers[i];
      const type = question.type;
      if (type === 'text') {
        // add ai summary
        const answersExtract = [];
        // extract the last answers until the token limit is reached
        for (let j = question.answers.length - 1; j >= 0; j--) {
          if (getAnswersTokenLength(answersExtract) > 3500) {
            break;
          }
          answersExtract.push(question.answers[j]);
        }
        const answersText = answersExtract.map(answer => answer.answer).join('\n');
        const query = `
          Here are the answers of some users to the question: ${question.en}\n
          answers:\n
          ${answersText};\n
          the answers constitute a feedback to a brand. This is the brand's description: ${brand.description.en}\n
          Provide a summary of the answers, focusing on the most common themes and sentiments, in no more than 600 characters.
        `;
        const summary = await makeAIQuery(query);
        results.push({ ...question, summary });
      } else if (type === 'single-select') {
        // answers are in format { answer: { optionId: int } }
        const optionIds = question.options.map(option => option.id);
        const answers = question.answers.map(answer => answer.answer.optionId);
        const answersCount = answers.length;
        const percentages = optionIds.map(optionId => {
          const option = question.options.find(option => option.id === optionId);
          const count = answers.filter(answer => answer === optionId).length;
          return {...option, percentage: round(count / answersCount * 100) };
        });
        results.push({ ...question, percentages });
      } else if (type === 'multi-select') {
        // answer is { answer: { value: { optionIds: [1, 2, 3,...] } } }
        const optionIds = question.options.map(option => option.id);
        const answers = question.answers.map(answer => answer.answer.optionIds);
        const answersCount = answers.length;
        const percentages = optionIds.map(optionId => {
          const option = question.options.find(option => option.id === optionId);
          const count = answers.filter(answer => answer.includes(optionId)).length;
          return { ...option, percentage: round(count / answersCount * 100) };
        });
        // sort by percentage
        percentages.sort((a, b) => b.percentage - a.percentage);
        results.push({ ...question, percentages });
      } else if (type === 'ranking') {
        // // answer is { answer: { value: [1, 2, 3,...] } } with the numbers being the optionIds in the
        // order selected by the user.
        // here, we will assign a score to each option, based on the position it was selected in, where the
        // first option gets 5 points, the second 4, and so on.
        const optionIds = question.options.map(option => option.id);
        const answers = question.answers.map(answer => answer.answer.value);
        const scores = optionIds.map(optionId => {
          const option = question.options.find(option => option.id === optionId);
          const score = answers.reduce((acc, answer) => {
            const position = answer.indexOf(optionId) + 1;
            if (!position) {
              return acc;
            }
            return acc + (6 - position);
          }, 0);
          return { ...option, score };
        });
        // sort by score
        scores.sort((a, b) => b.score - a.score);
        results.push({ ...question, scores });
      } else if (type === 'visual-ranking') {
        // answer is { answer: { 1: id, 2: id, 3: id } }, with the ids being the optionIds
        // in the order selected by the user.
        // here, we will assign a score to each option, based on the position it was selected in, where the
        // first option gets 3 points, the second 2, and the first 1.
        const optionIds = question.options.map(option => option.id);
        const answers = question.answers.map(answer => answer.answer);
        const scores = optionIds.map(optionId => {
          const option = question.options.find(option => option.id === optionId);
          const score = answers.reduce((acc, answer) => {
            const position = Object.keys(answer).find(key => answer[key] === optionId);
            if (!position) {
              return acc;
            }
            return acc + (4 - parseInt(position));
          }, 0);
          return { ...option, score };
        });
        // sort by score
        scores.sort((a, b) => b.score - a.score);
        results.push({ ...question, scores });
      } else if (type === 'scale' || type === 'pricing-feedback') {
        // answer is { answer: { value: 1 } } with the number being the value chosen
        const answers = question.answers.map(answer => answer.answer.value);
        const answersCount = answers.length;
        const percentages = [1, 2, 3, 4, 5].map(value => {
          const count = answers.filter(answer => answer === value).length;
          return { id: value, en: value, percentage: round(count / answersCount * 100) };
        });
        results.push({ ...question, percentages });
      }
    };
    res.json(results);

  } catch (error) {
    console.error('Error fetching brand pitch answers insights:', error);
    res.status(500).send(error.message);
  }
});

router.get("/brands/:id/product-feedback-answers", [], async (req, res) => {
  try {
    const brandId = req.params.id;
    const brand = await prisma.brands.findUnique({
      where: { id: brandId }
    });

    const questionsWithAnswers = await prisma.questions.findMany({
      where: {
        id: { in: config.get('productFeedbackQuestionIds') },
      },
      include: {
        answers: {
          where: { productFeedbackBrandId: brandId },
        },
      },
    });

    const results = await Promise.all(questionsWithAnswers.map(async (question) => {
      const { type, answers } = question;

      if (type === 'text') {
        const answersExtract = [];
        for (let j = answers.length - 1; j >= 0; j--) {
          if (getAnswersTokenLength(answersExtract) > 3500) break;
          answersExtract.push(answers[j]);
        }
        return await processTextQuestion(question, brand, answersExtract);
      }

      if (type === 'single-select') {
        return processSelectQuestion(question, answers.map(a => a.answer.optionId));
      }

      if (type === 'multi-select') {
        return processSelectQuestion(question, answers.map(a => a.answer.optionIds), true);
      }

      if (type === 'ranking') {
        return processRankingQuestion(question, answers.map(a => a.answer.value));
      }

      if (type === 'visual-ranking') {
        return processRankingQuestion(question, answers.map(a => a.answer), true);
      }

      if (type === 'scale' || type === 'pricing-feedback') {
        const values = answers.map(a => a.answer.value);
        const answersCount = values.length;
        const percentages = [1, 2, 3, 4, 5].map(value => ({
          id: value,
          en: value,
          percentage: round(values.filter(v => v === value).length / answersCount * 100)
        }));
        return { ...question, percentages };
      }

      return question;
    }));

    res.json(results);
  } catch (error) {
    console.error('Error fetching brand product feedback insights:', error);
    res.status(500).send(error.message);
  }
});

module.exports = {
  path: "/insights",
  router,
};
