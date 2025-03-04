const prisma = require('../../prisma');
const express = require('express');
const { authenticate } = require('../../authentication');
const router = express.Router();

router.use(authenticate);

const includeUserSelectedInfo = {
  user: {
    select: {
      name: true,
    }
  }
}

router.get('/examples', async (req, res) => {
  try {
    const userId = req.headers.currentUserId;
    const allFeedbackWithoutUser = await prisma.feedback.findMany({
      where: {
        userId: {
          not: {
            equals: userId,
          },
        }
      },
      include: includeUserSelectedInfo,
    });
    // include the one of the user
    const userFeedback = await prisma.feedback.findFirst({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: includeUserSelectedInfo,
    });
    // get 15 max random feedbacks
    const randomFeedback = allFeedbackWithoutUser.sort(() => Math.random() - Math.random()).slice(0, 15);
    res.json([userFeedback, ...randomFeedback]);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

router.get('/', async (req, res) => {
  try {
    if (req.user?.isAdmin !== 'true') {
      res.status(403).send('User is not an admin');
      return;
    }
    const feedback = await prisma.feedback.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      },
    });
    res.json(feedback);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});


router.post('/', [], async (req, res) => {
  try {
    const userId = req.headers.currentUserId;
    const user = await prisma.users.findUnique({
      where: {
        id: userId,
      },
    });

    const data = {
      text: req.body.text,
      email: req.body.email,
    };

    const result = await prisma.feedback.create({
      data: {
        ...data,
        user: {
          connect: {
            id: userId,
          },
        },
      },
      include: includeUserSelectedInfo,
    });
    res.status(201).json(result);
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
    await prisma.feedback.delete({
      where: {
        id: req.params.id,
      },
      include: includeUserSelectedInfo,
    });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

module.exports = {
  path: '/feedback',
  router,
};
