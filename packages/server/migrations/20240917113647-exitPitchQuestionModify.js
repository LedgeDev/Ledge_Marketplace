const { ObjectId } = require('mongodb');

module.exports = {
  async up(db, client) {
    const collection = db.collection('questions');

    const questions = [
      {
        _id: new ObjectId('659011ba6e2df4aade7820d8'),
        id: '659011ba6e2df4aade7820d8',
        schemaVersion: 1,
        position: 1,
        type: "single-select",
        question: {
          en: "Do you want to get rid of this brand?",
          de: "Möchten Sie diese Marke entfernen?"
        },
        footnote: {
          en: "Please select only one option.",
          de: "Bitte wählen Sie nur eine Option aus."
        },
        subtitle: {
          en: "This will remove the brand from your list, you can always add it back later from your settings page.",
          de: "Dies wird die Marke aus Ihrer Liste entfernen, Sie können sie später jederzeit über Ihre Einstellungen wieder hinzufügen."
        },
        options: [
          { id: "1", en: "Yes", de: "Ja" },
          { id: "2", en: "No", de: "Nein" },
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
      _id: { $in: [new ObjectId('659011ba6e2df4aade7820d8')] },
    });

    console.log(`Deleted ${deleteResult.deletedCount} documents`);
  }
};
