const prisma = require("../../prisma");
const express = require("express");
const { authenticate } = require("../../authentication");
const { addQuestionsStatistics } = require("../questions/utils");
const router = express.Router();

router.use(authenticate);

router.get("/", [], async (req, res) => {
  try {
    if (req.user?.isAdmin !== "true") {
      res.status(403).send("User is not an admin");
      return;
    }
    let questionnaires = await prisma.questionnaires.findMany({
      include: {
        questions: true,
        level: true,
      },
    });
    res.json(questionnaires);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

router.get("/myQuestionnaire", [], async (req, res) => {
  try {

    const userId = req.headers.currentUserId;

    // find questionnaire whose level has user with id, including questions
    let questionnaire = await prisma.questionnaires.findFirst({
      where: {
        level: {
          users: {
            some: {
              id: userId,
            },
          },
        }
      },
      include: {
        questions: {
          include: {
            answers: {
              where: {
                userId: userId,
              },
            },
            questionClass: true,
          }
        },
        level: true,
      }
    });

    res.status(200).json(questionnaire);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

router.patch("/:id", [], async (req, res) => {
  try {
    if (req.user?.isAdmin !== "true") {
      res.status(403).send("User is not an admin");
      return;
    }
    const data = req.body;
    const questionnaire = await prisma.questionnaires.update({
      where: {
        id: req.params.id,
      },
      data: {
        ...data,
      },
      include: {
        questions: true,
        level: true,
      },
    });
    res.status(201).json(questionnaire);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

router.post("/:id/assignQuestions", [], async (req, res) => {
  try {
    if (req.user?.isAdmin !== "true") {
      res.status(403).send("User is not an admin");
      return;
    }
    const { questions } = req.body;
    for (const question of questions) {
      await prisma.questions.update({
        where: { id: question.id },
        data: { questionnaireSubCategory: question.questionnaireSubCategory },
      });
    };
    const questionnaire = await prisma.questionnaires.update({
      where: {
        id: req.params.id,
      },
      data: {
        questions: {
          set: questions.map((question) => ({
            id: question.id,
          })),
        },
      },
      include: {
        questions: true,
        level: true,
      }
    });
    res.status(201).json(questionnaire);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

module.exports = {
  path: "/questionnaires",
  router,
};
