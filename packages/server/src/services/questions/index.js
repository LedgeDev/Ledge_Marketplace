const prisma = require('../../prisma');
const express = require('express');
const { randomizeOptionsIfNeeded, getSortedPitchQuestions } = require('./utils');
const { authenticate } = require('../../authentication');
const router = express.Router();
const config = require('config');

router.use(authenticate);

router.get('/onboarding', [], async (req, res) => {
  // find all the questions that has the attribute 'onboarding' set to true
  try {
    let onboardingQuestions = await prisma.questions.findMany({
      where: {
        onboarding: true,
      },
      orderBy: {
        position: 'asc',
      },
    });

    if (onboardingQuestions) {
      onboardingQuestions = await randomizeOptionsIfNeeded(onboardingQuestions);
    }

    res.json(onboardingQuestions);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

router.get('/', [], async (req, res) => {
  try {
    if (req.user?.isAdmin !== 'true') {
      res.status(403).send('User is not an admin');
      return;
    } else {
      const { randomizeOptions } = req.query;
      const { id } = req.query;
      let questions = await prisma.questions.findMany({
        where: { id: id },
        orderBy: {
          position: 'asc',
        },
        include: {
          questionClass: true,
          brand: true,
          questionnaire: true,
        },
      });
      if (randomizeOptions) {
        questions = await randomizeOptionsIfNeeded(questions);
      }
      res.json(questions);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

router.get('/productFeedbackQuestions', [], async (req, res) => {
  try {
    let productFeedbackQuestions = await prisma.questions.findMany({
      where: {
        id: {
          in: config.get('productFeedbackQuestionIds')
        }
      },
      orderBy: {
        position: 'asc',
      },
    });

    if (productFeedbackQuestions) {
      productFeedbackQuestions = await randomizeOptionsIfNeeded(productFeedbackQuestions);
    }

    res.json(productFeedbackQuestions);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

router.get('/pitchQuestions/:brandId', [], async (req, res) => {
  try {
    const { brandId } = req.params;
    if (!brandId) {
      res.status(400).send('brandId is required');
      return;
    }
    let questions = await getSortedPitchQuestions(brandId);
    if (!questions?.length) {
      console.error('Pitch questions not found');
      res.status(404).send('Pitch questions not found');
      return;
    }
    res.json(questions);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

router.get('/ExitQuestion/:brandId', [], async (req, res) => {

  // Get the user
  const userId = req.headers.currentUserId;
  const brandId = req.params.brandId;

  // find the exit from pitch question
  try {
    const brand = await prisma.brands.findFirst({
      where: {
        id: brandId,
        isVisible: true,
      },
    });

    const user = await prisma.users.findFirst({
      where: {
        id: userId,
      },
    });

    const userForYouBrands = user.forYouBrandsIds || [];

    let ExitQuestion = await prisma.questions.findFirst({
      where: {
        id: config.get('exitQuestion'),
      },
    });

    let removeQuestion;

    if(userForYouBrands.includes(brandId)){
      removeQuestion = await prisma.questions.findFirst({
        where: {
          id: config.get('removeBrandFromForYou'),
        },
      });
    } else {
      removeQuestion = await prisma.questions.findFirst({
        where: {
          id: config.get('removeBrandFromDiscovery'),
        },
      });
    }

    // replace displayImage with teamPicture
    ExitQuestion.displayImage = brand.teamPicture;
    removeQuestion.displayImage = brand.teamPicture;
    
    res.json([ExitQuestion,removeQuestion]);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

router.get('/:id', [], async (req, res) => {
  try {
    const { id } = req.params;
    const { randomizeOptions } = req.query;
    let question = await prisma.questions.findFirst({
      where: {
        id: id,
      },
      include: {
        questionClass: true,
      },
    });
    if (!question) {
      res.status(404).send('Question not found');
      return;
    }
    if (randomizeOptions) {
      await randomizeOptionsIfNeeded([question])[0];
    }
    res.json(question);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

router.post('/', [], async (req, res) => {
  try {
    if (req.user?.isAdmin !== 'true' && req.user?.isBrand !== 'true') {
      res.status(403).send('User is not an admin or brand');
      return;
    } else {
      const data = req.body;

      // Validate products for pricing-feedback questions
      if (data.type === 'pricing-feedback' && (!data.products || data.products.length === 0)) {
        res.status(400).send('Pricing feedback questions must include at least one product');
        return;
      }

      const question = await prisma.questions.create({
        data: {
          ...data,
          footnote: req.body.footnote || { en: '', de: '' },
          subtitle: req.body.subtitle || { en: '', de: '' },
        },
      });
      res.status(201).json(question);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

router.patch('/:id', [], async (req, res) => {
  try {
    if (req.user?.isAdmin !== 'true' && req.user?.isBrand !== 'true') {
      res.status(403).send('User is not an admin');
      return;
    } else {
      const { id } = req.params;
      const prevQuestion = await prisma.questions.findFirst({
        where: {
          id: id,
        },
      });
      const question = await prisma.questions.update({
        where: {
          id: id,
        },
        data: {
          ...req.body,
          footnote: req.body.footnote || { en: '', de: '' },
          subtitle: req.body.subtitle || { en: '', de: '' },
        },
      });
      // delete questionClass if it's not used by any other question
      const classQuestions = await prisma.questions.count({
        where: {
          classId: prevQuestion.classId,
        },
      });
      if (classQuestions === 0) {
        await prisma.question_classes.delete({
          where: {
            id: prevQuestion.classId,
          },
        });
      };
      res.json(question);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

router.delete('/:id', [], async (req, res) => {
  try {
    if (req.user?.isAdmin !== 'true') {
      res.status(403).send('User is not an admin');
      return;
    }
    // check if question is used in business logic (id is in config)
    const deleteForbiddenIds = config.get('deleteForbiddenIds');
    const { id } = req.params;
    if (deleteForbiddenIds.includes(id)) {
      res.status(403).send('Question is used in business logic and cannot be deleted');
      return;
    }
    const question = await prisma.questions.delete({
      where: {
        id: id,
      },
    });
    // delete questionClass if it's not used by any other question
    const classQuestions = await prisma.questions.count({
      where: {
        classId: question.classId,
      },
    });
    if (classQuestions === 0) {
      await prisma.question_classes.delete({
        where: {
          id: question.classId,
        },
      });
    };
    res.json(question);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

module.exports = {
  path: '/questions',
  router,
};
