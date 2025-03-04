const prisma = require('../../prisma');
const config = require('config');

function randomizeOptionsIfNeeded(questions) {
  questions.forEach((question) => {
    if (
      question.randomizeOptions === true &&
      question.options &&
      question.options.length > 1
    ) {
      const newOptions = [...question.options];
      newOptions.sort(() => Math.random() - 0.5);
      question.options = newOptions;
    }
  });
  return questions;
}

/*
  * Add statistics to the options of the questions passed
  * @param {Array} questions - Array of questions
*/
async function addQuestionsStatistics(questions) {
  const questionsWithAnswers = await prisma.questions.findMany({
    where: {
      id: {
        in: questions.map((question) => question.id),
      },
    },
    include: {
      answers: true,
    },
  });
  // calculare statistics for each question
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    if (question.type !== 'single-select') {
      continue;
    }
    const questionWithAnswers = questionsWithAnswers.find(
      (q) => q.id === question.id,
    );
    if (!questionWithAnswers) {
      continue;
    }
    const answers = questionWithAnswers.answers;
    // for each question option, see how many people selected it
    for (let j = 0; j < question.options.length; j++) {
      const option = question.options[j];
      const optionAnswers = answers.filter(
        (answer) => answer.answer.optionId === option.id,
      );
      question.options[j].selectedBy = optionAnswers.length;
    }
  }
}

async function getSortedPitchQuestions(brandId) {
  const brand = await prisma.brands.findFirst({
    where: {
      id: brandId,
    },
  });
  if (!brand) {
    throw new Error('Brand not found');
  }
  const questions = await prisma.questions.findMany({
    where: {
      brandId: brandId,
    },
    orderBy: {
      position: 'asc',
    },
  });
  const [attentionQuestions, feedbackQuestions] = questions.reduce(
    (acc, question) => {
      if (question.correctAnswerId) {
        acc[0].push(question);
      } else {
        acc[1].push(question);
      }
      return acc;
    },
    [[], []],
  );

  let allQuestions = [...attentionQuestions];

  // Only include rating question if brand is not a charity
  if (!brand.isCharity) {
    let ratingQuestion = await prisma.questions.findFirst({
      where: {
        id: config.get('ratingQuestionId'),
      },
    });
    // replace rating question displayImage if requested
    if (brand.showTeamPictureInRating) {
      ratingQuestion.displayImage = brand.teamPicture;
    }
    allQuestions.push(ratingQuestion);
  }

  allQuestions = [...allQuestions, ...feedbackQuestions];
  allQuestions = randomizeOptionsIfNeeded(allQuestions);
  return allQuestions;
};
module.exports = {
  randomizeOptionsIfNeeded,
  addQuestionsStatistics,
  getSortedPitchQuestions
};
