const prisma = require('../../prisma');
const express = require('express');
const { authenticate } = require('../../authentication');
const router = express.Router();
const {
  sortAnswersByQuestionnaire,
  sortAnswersByClass,
  handleRatingAnswer,
  createAnswerDocument,
  handlePitchExit,
  handleSuccessfulPitch
} = require('./utils');

const {
  refillUserForYouBrandsFromPool,
  getUserMayBeInterestedBrands,
} = require('../../utils/brandFeeds');

const config = require('config');
router.use(authenticate);

router.get('/sorted', [], async (req, res) => {
  try {
    const userId = req.headers.currentUserId;
    const idsToExclude = [
      config.get('ratingQuestionId'),
      config.get('targetGenderQuestionId'),
      config.get('budgetQuestionId'),
      config.get('interestsQuestionId'),
      config.get('exitQuestion'),
      config.get('removeBrand'),
      config.get('removeBrandFromForYou'),
      config.get('removeBrandFromDiscovery'),
      ...config.get('productFeedbackQuestionIds')
    ];
    const rawAnswers = await prisma.answers.findMany({
      where: {
        userId: userId,
        questionId: {
          not: null,
          notIn: idsToExclude,
        },
        question: {
          brand: {
            is: null,
          }
        },
      },
      include: {
        question: {
          include: {
            questionnaire: true,
            questionClass: true,
          },
        },
      },
    });
    const sortedAnswers = {
      questionClass: await sortAnswersByClass(rawAnswers, userId),
      questionnaire: await sortAnswersByQuestionnaire(rawAnswers, userId),
    };
    res.status(200).json(sortedAnswers);
  } catch (error) {
    console.error('Error getting answers', error);
    res.status(500).send(error.message);
  }
});

router.patch('/:id', [], async (req, res) => {
  try {
    const userId = req.headers.currentUserId;
    const answerId = req.params.id;
    const answer = req.body;
    // check if the answer belongs to the user
    const answerToPatch = await prisma.answers.findFirst({
      where: {
        id: answerId,
        userId: userId,
      },
    });
    if (!answerToPatch) {
      res.status(403).send('You are not authorized to update this answer');
      return;
    }
    const updatedAnswer = await prisma.answers.update({
      where: {
        id: answerId,
      },
      data: {
        answer: answer.answer,
      },
    });
    res.json(updatedAnswer);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.post('/productFeedback', [], async (req, res) => {
  try {
    const userId = req.headers.currentUserId;
    const newAnswers = req.body;
    let resultingAnswers = [];
    // create each answer
    await Promise.all(
      newAnswers.map(async (answer) => {
        const resultingAnswer = await prisma.answers.create({
          data: {
            answer: answer.answer,
            productFeedbackBrand: {
              connect: { id: answer.productFeedbackBrandId },
            },
            user: {
              connect: { id: userId },
            },
            question: {
              connect: { id: answer.questionId },
            },
            questionText: answer.questionText,
          },
        });
        resultingAnswers.push(resultingAnswer);
      }),
    );
    res.json(resultingAnswers);
  } catch (error) {
    console.error('error', error);
    res.status(500).send(error.message);
  }
});

router.post('/', [], async (req, res) => {
  try {
    const userId = req.headers.currentUserId;
    const newAnswers = req.body;
    let resultingAnswers = [];
    // create or update each answer
    // if upsert where condition finds a match, it will update the answer
    // if not, it will create a new answer
    await Promise.all(
      newAnswers.map(async (answer) => {
        const resultingAnswer = await prisma.answers.upsert({
          where: {
            userId_questionId: {
              userId: userId,
              questionId: answer.questionId,
            },
          },
          update: {
            answer: answer.answer,
          },
          create: {
            answer: answer.answer,
            user: {
              connect: { id: userId },
            },
            question: {
              connect: { id: answer.questionId },
            },
            questionText: answer.questionText,
          },
        });
        resultingAnswers.push(resultingAnswer);
      }),
    );
    res.json(resultingAnswers);
  } catch (error) {
    console.error('error', error);
    res.status(500).send(error.message);
  }
});

// Create pitch answer object
router.post('/pitchAnswers/:id', [], async (req, res) => {
  try {
    const userId = req.headers.currentUserId;
    const answers = req.body.answers;
    const brandId = req.params.id;
    const pitch = req.body.pitch;
    const savedAnswers = [];

    // Process answers
    for (const [questionId, answerData] of Object.entries(answers)) {
      if (questionId === config.get('ratingQuestionId')) {
        await handleRatingAnswer(userId, brandId, answerData.value);
        continue;
      }

      const answerDocument = await createAnswerDocument(userId, brandId, questionId, answerData);
      if (answerDocument) {
        savedAnswers.push(answerDocument);
      }
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    // Handle pitch exit or success
    if (pitch === 'exit') {
      await handlePitchExit(brandId, userId, answers, user);
    }

    await refillUserForYouBrandsFromPool(userId);

    if (pitch === 'pitch') {
      await handleSuccessfulPitch(brandId, userId);
    }

    // Prepare response
    const interestedBrands = await getUserMayBeInterestedBrands(userId);
    user.brandsAvailableForPool = interestedBrands.length > 0;
    res.status(200).json(user);
  } catch (error) {
    console.error('error', error);
    res.status(500).send(error.message);
  }
});

// Route to delete answers
router.delete('/', [], async (req, res) => {
  // ids must be sent in the body, so that they are not affected by url length limits
  try {
    const userId = req.headers.currentUserId;
    const reqAnswerIdsToDelete = [...req.body];
    // check if the answers belong to the user
    const answers = await prisma.answers.findMany({
      where: {
        id: {
          in: reqAnswerIdsToDelete,
        },
        userId: userId,
      },
    });
    if (answers.length !== reqAnswerIdsToDelete.length) {
      res.status(403).send('You are not authorized to delete these answers');
      return;
    }
    await prisma.answers.deleteMany({
      where: {
        id: {
          in: reqAnswerIdsToDelete,
        },
      },
    });
    res.status(200).send('Answers deleted');
  } catch (error) {
    res.status(500).send(error.message);
  }
});

module.exports = {
  path: '/answers',
  router,
};
