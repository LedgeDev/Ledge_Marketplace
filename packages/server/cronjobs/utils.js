const prisma = require('../src/prisma');

async function getQuestionnaireAnswerCount(userId) {
  // Get the user object with level and its questionnaire with questions
  const user = await prisma.users.findUnique({
    where: {
      id: userId,
    },
    include: {
      level: {
        include: {
          questionnaire: {
            include: {
              questions: true,
            },
          },
        },
      },
    },
  });
  if (!user) {
    return null;
  }

  const questionnaireQuestions = user.level?.questionnaire?.questions;

  if (!questionnaireQuestions) {
    return null;
  }

  // check how many questions of the questionnaire the user has answered
  const questionnaireAnswers = await prisma.answers.findMany({
    where: {
      userId: userId,
      questionId: {
        in: questionnaireQuestions.map((question) => question.id),
      },
    },
    select: {
      questionId: true,
    },
  });
  return questionnaireAnswers.length;
}

module.exports = {
  getQuestionnaireAnswerCount
};
