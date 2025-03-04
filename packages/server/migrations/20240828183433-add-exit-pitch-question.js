const { ObjectId } = require('mongodb');

module.exports = {
  async up(db, client) {
    const collection = db.collection('questions');

    const questions = [
      {
        _id:new ObjectId('669011ba6e2df4aade6820d8'),
        id: '669011ba6e2df4aade6820d8',
        schemaVersion: 1,
        position: 1,
        type: "single-select",
        question: {
          en: "Why did you decide to quit the pitch?",
          de: "Warum haben Sie sich entschieden, das Video zu schließen?"
        },
        footnote: {
          en: "Please select only one option.",
          de: "Bitte wählen Sie nur eine Option aus."
        },
        subtitle: {
          en: "No pressure, you can change this later.",
          de: "Kein Druck, Sie können dies später ändern."
        },
        options: [
          { id: "1", en: "Technical Issues", de: "Technische Probleme" },
          { id: "2", en: "Video Too Boring", de: "Video zu langweilig" },
          { id: "3", en: "Video Too Long", de: "Video zu lang" },
          { id: "4", en: "Other", de: "Andere" }
        ],
        displayImage: "603755f805208bc74a4c8dfa26cc577f.jpeg",
        classId: null,
        categoryId: null,
        allowNewOptions: false,
        maxNewOptionsAllowed: 0,
        onboarding: false,
        rejectedCallQuestion: false,
        answers: [],
        randomizeOptions: false,
        fixedOptionSize: false,
        hideOptionText: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
    ];

    // Insert the questions into the collection
    const insertResult = await collection.insertMany(questions);

    console.log(`Inserted ${insertResult.insertedCount} documents`);
  },

  async down(db, client) {
    const collection = db.collection('questions');

    // Remove the questions with the specific _id used in the 'up' method
    const deleteResult = await collection.deleteMany({
      _id: { $in: [ObjectId('669011ba6e2df4aade6820d8')] },
    });

    console.log(`Deleted ${deleteResult.deletedCount} documents`);
  }
};
