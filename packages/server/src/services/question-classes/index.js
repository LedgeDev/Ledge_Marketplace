const prisma = require('../../prisma');
const express = require('express');
const { authenticate } = require('../../authentication');
const router = express.Router();
router.use(authenticate);

router.get('/', [], async (req, res) => {
  try {
    const questionClasses = await prisma.question_classes.findMany({});
    res.json(questionClasses);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

router.post('/', [], async (req, res) => {
  try {
    if (req.user?.isAdmin !== 'true') {
      res.status(403).send('User is not an admin');
      return;
    }
    const classData = req.body;
    const questionClass = await prisma.question_classes.create({
      data: classData,
    });
    res.json(questionClass);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

module.exports = {
  path: '/question-classes',
  router,
};
