const { ObjectId } = require('mongodb');

module.exports = {
  async up(db, client) {
    const collection = db.collection('questions');

    // Find the question with the specified options
    const question = await collection.findOne({
      options: [
        { id: "1", image: '603755f805208bc74a4c8dfa26cc577f.jpeg', title: "Aaaaa", value: "categoryA" },
        { id: "2", image: '603755f805208bc74a4c8dfa26cc577f.jpeg', title: "Bbbbbb", value: "categoryB" },
        { id: "3", image: '603755f805208bc74a4c8dfa26cc577f.jpeg', title: "Cccccc", value: "categoryC" },
        { id: "4", image: '603755f805208bc74a4c8dfa26cc577f.jpeg', title: "Dddddd", value: "categoryD" },
        { id: "5", image: '603755f805208bc74a4c8dfa26cc577f.jpeg', title: "Eeeeee", value: "categoryE" },
        { id: "6", image: '603755f805208bc74a4c8dfa26cc577f.jpeg', title: "Ffffff", value: "categoryF" },
        { id: "7", image: '603755f805208bc74a4c8dfa26cc577f.jpeg', title: "Gggggg", value: "categoryG" },
        { id: "8", image: '603755f805208bc74a4c8dfa26cc577f.jpeg', title: "Hhhhhh", value: "categoryH" },
        { id: "9", image: '603755f805208bc74a4c8dfa26cc577f.jpeg', title: "Iiiiii", value: "categoryI" },
        { id: "10", image: '603755f805208bc74a4c8dfa26cc577f.jpeg', title: "Jjjjjjj", value: "categoryJ" },
      ],
    });

    if (question) {
      const updatedOptions = question.options.map((option) => ({
        ...option,
        title: {
          en: option.title,
          de: translateToGerman(option.title),
        },
      }));

      // Update the options of the found question
      const updateResult = await collection.updateOne(
        { _id: question._id },
        { $set: { options: updatedOptions } }
      );

      console.log(`Updated ${updateResult.modifiedCount} document`);
    } else {
      console.log("Question not found");
    }
  },

  async down(db, client) {
    const collection = db.collection('questions');

    // Find the question with the specified options
    const question = await collection.findOne({
      options: [
        { id: "1", image: '603755f805208bc74a4c8dfa26cc577f.jpeg', title: { en: "Aaaaa", de: "Aaaaa" }, value: "categoryA" },
        { id: "2", image: '603755f805208bc74a4c8dfa26cc577f.jpeg', title: { en: "Bbbbbb", de: "Bbbbbb" }, value: "categoryB" },
        { id: "3", image: '603755f805208bc74a4c8dfa26cc577f.jpeg', title: { en: "Cccccc", de: "Cccccc" }, value: "categoryC" },
        { id: "4", image: '603755f805208bc74a4c8dfa26cc577f.jpeg', title: { en: "Dddddd", de: "Dddddd" }, value: "categoryD" },
        { id: "5", image: '603755f805208bc74a4c8dfa26cc577f.jpeg', title: { en: "Eeeeee", de: "Eeeeee" }, value: "categoryE" },
        { id: "6", image: '603755f805208bc74a4c8dfa26cc577f.jpeg', title: { en: "Ffffff", de: "Ffffff" }, value: "categoryF" },
        { id: "7", image: '603755f805208bc74a4c8dfa26cc577f.jpeg', title: { en: "Gggggg", de: "Gggggg" }, value: "categoryG" },
        { id: "8", image: '603755f805208bc74a4c8dfa26cc577f.jpeg', title: { en: "Hhhhhh", de: "Hhhhhh" }, value: "categoryH" },
        { id: "9", image: '603755f805208bc74a4c8dfa26cc577f.jpeg', title: { en: "Iiiiii", de: "Iiiiii" }, value: "categoryI" },
        { id: "10", image: '603755f805208bc74a4c8dfa26cc577f.jpeg', title: { en: "Jjjjjjj", de: "Jjjjjjj" }, value: "categoryJ" },
      ],
    });

    if (question) {
      const updatedOptions = question.options.map((option) => ({
        ...option,
        title: option.title.en,
      }));

      // Revert the options of the found question
      const updateResult = await collection.updateOne(
        { _id: question._id },
        { $set: { options: updatedOptions } }
      );

      console.log(`Reverted ${updateResult.modifiedCount} document`);
    } else {
      console.log("Question not found");
    }
  },
};

// Translation function
function translateToGerman(text) {
  const translations = {
    Aaaaa: "Aaaaa",
    Bbbbbb: "Bbbbbb",
    Cccccc: "Cccccc",
    Dddddd: "Dddddd",
    Eeeeee: "Eeeeee",
    Ffffff: "Ffffff",
    Gggggg: "Gggggg",
    Hhhhhh: "Hhhhhh",
    Iiiiii: "Iiiiii",
    Jjjjjjj: "Jjjjjjj",
  };

  return translations[text] || text;
}
