
const processTextQuestion = async (question, brand, answersExtract) => {
  let summary = '';
  if (answersExtract.length > 0) {
    const answersText = answersExtract.map(answer => answer.answer).join('\n');
    const query = `
      Here are the answers of some users to the question: ${question.en}\n
      answers:\n
      ${answersText};\n
      the answers constitute a feedback to a brand. This is the brand's description: ${brand.description.en}\n
      Provide a summary of the answers, focusing on the most common themes and sentiments, in no more than 600 characters.
      Please take into account the amount of answers. If there is a lot of data, please don't assume things and only
      provide a summary of the answers, using only the information of the answers.
    `;
    summary = await makeAIQuery(query);
  }
  return { ...question, summary };
};

const processSelectQuestion = (question, answers, isMulti = false) => {
  const optionIds = question.options.map(option => option.id);
  const answersCount = answers.length;
  const percentages = optionIds.map(optionId => {
    const option = question.options.find(option => option.id === optionId);
    const count = isMulti
      ? answers.filter(answer => answer.includes(optionId)).length
      : answers.filter(answer => answer === optionId).length;
    return { ...option, percentage: round(count / answersCount * 100) };
  });

  if (isMulti) {
    percentages.sort((a, b) => b.percentage - a.percentage);
  }
  return { ...question, percentages };
};

const processRankingQuestion = (question, answers, isVisual = false) => {
  const optionIds = question.options.map(option => option.id);
  const scores = optionIds.map(optionId => {
    const option = question.options.find(option => option.id === optionId);
    const score = answers.reduce((acc, answer) => {
      if (isVisual) {
        const position = Object.keys(answer).find(key => answer[key] === optionId);
        return position ? acc + (4 - parseInt(position)) : acc;
      } else {
        const position = answer.indexOf(optionId) + 1;
        return position ? acc + (6 - position) : acc;
      }
    }, 0);
    return { ...option, score };
  });
  scores.sort((a, b) => b.score - a.score);
  return { ...question, scores };
};

module.exports = {
  processTextQuestion,
  processSelectQuestion,
  processRankingQuestion
};
