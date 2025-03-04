const prisma = require('../../prisma');
const config = require('config');
// Import removeBrandFromForYou from brandFeeds
const {
  removeBrandFromForYou,
  addBrandToDeletedBrands,
  addBrandToNotInterestedBrands,
  restoreBrandFromDeleted,
  addBrandToMyDeals
} = require('../../utils/brandFeeds');

/**
 * Sorts answers by class
 * @param {Array} answers - Array of answers with class
 * @returns {Array} - Array of classes with their answers
 */
async function sortAnswersByClass(answers, userId = null) {
  let answersByClass = [];
  // add all question classes except the product feedback class
  const allQuestionClasses = await prisma.question_classes.findMany({
    where: {
      id: {
        notIn: [config.get('productFeedbackClassId')],
      }
    }
  });
  answersByClass = answersByClass.concat(allQuestionClasses.map(qc => ({ id: qc.id, name: qc.name, answers: [] })));
  answers.forEach((answer) => {
    const questionClass = answer.question.questionClass;
    if (!questionClass) {
      return;
    }
    // get the index of the class in the resulting array
    const questionClassIndex = answersByClass.findIndex(
      (sortedQuestionClass) => sortedQuestionClass.id === questionClass.id,
    );
    // if the class has not been added yet, add it. Else, add the answer to the class
    if (questionClassIndex === -1) {
      answersByClass.push({
        id: questionClass.id,
        name: answer.question.questionClass.name,
        answers: [answer],
        pendingQuestions: [],
      });
    } else {
      answersByClass[questionClassIndex].answers.push(answer);
    }
  });
  // sort answersByClass showing first the ones with answers
  answersByClass = answersByClass.sort((a, b) => {
    if (a.answers.length > 0 && b.answers.length === 0) {
      return -1;
    } else if (a.answers.length === 0 && b.answers.length > 0) {
      return 1;
    } else {
      return 0;
    }
  });
  // add questionnaire questions of the same class that are not answered (pendingQuestions)
  let sortedQuestionClassesIds = answersByClass.map(
    (sortedQuestionClass) => sortedQuestionClass.id,
  );
  if (sortedQuestionClassesIds.length === 0) {
    return answersByClass;
  }
  // now we add the questionnaire's unanswered questions for each class
  // get question classes with their questions, including only the questions of the user's level questionnaire
  const questionClasses = await prisma.question_classes.findMany({
    where: {
      id: {
        in: sortedQuestionClassesIds,
      },
    },
    include: {
      questions: {
        where: {
          questionnaire: {
            level: {
              users: {
                some: {
                  id: userId,
                },
              },
            },
          },
        },
      },
    },
  });
  if (!questionClasses) {
    return answersByClass;
  }
  answersByClass.forEach((sortedQuestionClass) => {
    const questionClass = questionClasses.find(
      (qc) => qc.id === sortedQuestionClass.id,
    );
    if (!questionClass) {
      return;
    }
    const questionClassQuestions = questionClass.questions;
    const notAnsweredQuestions = questionClassQuestions.filter(
      (question) =>
        !answers.some((answer) => answer.questionId === question.id),
    );
    sortedQuestionClass.pendingQuestions = notAnsweredQuestions;
  });
  return answersByClass;
}

/**
 * Sorts answers by questionnaire
 * @param {Array} answers - Array of answers incuding questions, including questionnaires
 * @returns {Array} - Array of questionnaires with their answers
 */
async function sortAnswersByQuestionnaire(answers, userId = null) {
  let answersByQuestionnaire = [
    {
      id: 'no-questionnaire',
      name: 'Onboarding questions',
      answers: [],
    },
  ];
  // add the user's level questionnaire
  const userQuestionnaire = await prisma.questionnaires.findFirst({
    where: {
      level: {
        users: {
          some: {
            id: userId,
          },
        },
      },
    },
  });
  if (userQuestionnaire) {
    answersByQuestionnaire.push({
      id: userQuestionnaire.id,
      name: userQuestionnaire.name,
      answers: [],
      pendingQuestions: [],
    });
  }
  // assign each answer to its questionnaire
  answers.forEach((answer) => {
    const questionnaire = answer.question.questionnaire;
    if (!questionnaire) {
      answersByQuestionnaire[0].answers.push(answer);
      return;
    }
    // get the index of the questionnaire in the resulting array
    const questionnaireIndex = answersByQuestionnaire.findIndex(
      (sortedQuestionnaire) => sortedQuestionnaire.id === questionnaire.id,
    );
    // if the questionnaire has not been added yet, add it. Else, add the answer to the questionnaire
    if (questionnaireIndex === -1) {
      answersByQuestionnaire.push({
        id: questionnaire.id,
        name: answer.question.questionnaire.name,
        answers: [answer],
        pendingQuestions: [],
      });
    } else {
      answersByQuestionnaire[questionnaireIndex].answers.push(answer);
    }
  });
  // add questionnaire questions that are not answered (pendingQuestions)
  let sortedQuestionnairesIds = answersByQuestionnaire.map(
    (questionnaire) => questionnaire.id,
  );
  sortedQuestionnairesIds = sortedQuestionnairesIds.filter(
    (id) => id !== 'no-questionnaire',
  );
  if (sortedQuestionnairesIds.length === 0) {
    return answersByQuestionnaire;
  }
  const questionnaires = await prisma.questionnaires.findMany({
    where: {
      id: {
        in: sortedQuestionnairesIds,
      },
    },
    include: {
      questions: true,
    },
  });
  if (!questionnaires) {
    return answersByQuestionnaire;
  }
  answersByQuestionnaire.forEach((sortedQuestionnaire) => {
    const questionnaire = questionnaires.find(
      (q) => q.id === sortedQuestionnaire.id,
    );
    if (!questionnaire) {
      return;
    }
    const questionnaireQuestions = questionnaire.questions;
    const notAnsweredQuestions = questionnaireQuestions.filter(
      (question) =>
        !answers.some((answer) => answer.questionId === question.id),
    );
    sortedQuestionnaire.pendingQuestions = notAnsweredQuestions;
  });
  // filter out questionnaires with no answers
  return answersByQuestionnaire;
}

async function saveUsername(userId, username) {
  return await prisma.users.update({
    where: {
      id: userId,
    },
    data: {
      name: username,
    },
  });
}

// Helper functions for pitch answers
async function handleRatingAnswer(userId, brandId, ratingValue) {
  await prisma.ratings.upsert({
    where: {
      userId_brandId: {
        userId: userId,
        brandId: brandId,
      },
    },
    update: {
      rating: ratingValue,
    },
    create: {
      rating: ratingValue,
      user: {
        connect: { id: userId },
      },
      brand: {
        connect: { id: brandId },
      },
    },
  });
}

async function createAnswerDocument(userId, brandId, questionId, answerData) {
  const question = await prisma.questions.findUnique({
    where: { id: questionId },
    select: { question: true },
  });

  if (!question) {
    console.warn(`Question with ID ${questionId} not found`);
    return null;
  }

  return await prisma.answers.create({
    data: {
      user: {
        connect: { id: userId },
      },
      question: {
        connect: { id: questionId },
      },
      pitchExitBrand: {
        connect: { id: brandId },
      },
      questionText: question.question,
      answer: answerData,
    },
  });
}

async function handleForYouBrandExit(brandId, userId, answer) {
  if (answer && answer.optionId === '1') {
    // Move brand to discovery
    await restoreBrandFromDeleted(brandId, userId);
    await removeBrandFromForYou(brandId, userId);
  } else if (answer && answer.optionId === '2') {
    // Remove the brand completely
    await removeBrandFromForYou(brandId, userId);
    await addBrandToDeletedBrands(brandId, userId);
  } else if (answer && answer.optionId === '3') {
    // Keep it in the For You section
    await restoreBrandFromDeleted(brandId, userId);
  }
}

async function handleDiscoveryBrandExit(brandId, userId, answer) {
  if (answer && answer.optionId === '1') {
    // Remove the brand completely
    await addBrandToDeletedBrands(brandId, userId);
  } else if (answer && answer.optionId === '2') {
    // Keep it in the Discovery section
    await restoreBrandFromDeleted(brandId, userId);
  }
}

async function handlePitchExit(brandId, userId, answers, user) {
  await addBrandToNotInterestedBrands(brandId, userId);

  if (user.forYouBrandsIds.includes(brandId)) {
    const answer = answers[config.get('removeBrandFromForYou')];
    await handleForYouBrandExit(brandId, userId, answer);
  } else {
    const answer = answers[config.get('removeBrandFromDiscovery')];
    await handleDiscoveryBrandExit(brandId, userId, answer);
  }
}

async function handleSuccessfulPitch(brandId, userId) {
  await removeBrandFromForYou(brandId, userId);
  await addBrandToMyDeals(brandId, userId);

  await prisma.unlocked_brands_history.create({
    data: {
      user: {
        connect: { id: userId },
      },
      brand: {
        connect: { id: brandId },
      },
    },
  });
}

// Export the modified function
module.exports = {
  sortAnswersByQuestionnaire,
  sortAnswersByClass,
  saveUsername,
  handleRatingAnswer,
  createAnswerDocument,
  handlePitchExit,
  handleSuccessfulPitch
};
