const { ObjectId } = require('mongodb');

module.exports = {
  async up(db, client) {
    const collection = db.collection('questions');

    const questions = [
      {
        id: new ObjectId().toHexString(),
        schemaVersion: 1,
        position: 1,
        type: "single-select",
        question: {
          en: "Who are you shopping for?",
          de: "Für wen machen Sie Einkäufe?"
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
          { id: "1", en: "Men", de: "Männer" },
          { id: "2", en: "Women", de: "Frauen" },
          { id: "3", en: "Both", de: "Beide" },
          { id: "4", en: "Other", de: "Andere" }
        ],
        displayImage: "603755f805208bc74a4c8dfa26cc577f.jpeg",
        classId: null,
        categoryId: null,
        allowNewOptions: false,
        maxNewOptionsAllowed: 0,
        onboarding: true,
        rejectedCallQuestion: false,
        answers: [],
        randomizeOptions: false,
        fixedOptionSize: false,
        hideOptionText: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: new ObjectId().toHexString(),
        schemaVersion: 1,
        position: 2,
        type: "single-select",
        question: {
          en: "What's your budget for this purchase?",
          de: "Wie hoch ist Ihr Budget für diesen Einkauf?"
        },
        footnote: {
          en: "Choose the range that best fits your planned expenditure.",
          de: "Wählen Sie den Bereich, der am besten zu Ihren geplanten Ausgaben passt."
        },
        subtitle: {
          en: "Feel free to adjust your budget at any time.",
          de: "Sie können Ihr Budget jederzeit anpassen."
        },
        options: [
          { id: "1", en: "Under $50", de: "Unter 50 $" },
          { id: "2", en: "$50 to $100", de: "50 $ bis 100 $" },
          { id: "3", en: "$100 to $500", de: "100 $ bis 500 $" },
          { id: "4", en: "Over $500", de: "Über 500 $" }
        ],
        displayImage: "603755f805208bc74a4c8dfa26cc577f.jpeg",
        classId: null,
        categoryId: null,
        allowNewOptions: false,
        maxNewOptionsAllowed: 0,
        onboarding: true,
        rejectedCallQuestion: false,
        answers: [],
        randomizeOptions: false,
        fixedOptionSize: false,
        hideOptionText: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: new ObjectId().toHexString(),
        schemaVersion: 1,
        position: 3,
        type: "this-or-that",
        question: {
          en: "LEDGE",
          de: "Was ist deine Lieblingsfarbe?"
        },
        footnote: {
          en: "LEDGE",
          de: "Sie dürfen nur eine Farbe auswählen."
        },
        subtitle: {
          en: "LEDGE.",
          de: "Sie dürfen mehrere Farben auswählen."
        },
        options: [
          { id: "1", image: '603755f805208bc74a4c8dfa26cc577f.jpeg', title: "Aaaaa", value: "categoryA"},
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
        classId: null,
        categoryId: null,
        allowNewOptions: false,
        maxNewOptionsAllowed: 0,
        onboarding: true,
        rejectedCallQuestion: false,
        answers: [],
        randomizeOptions: false,
        fixedOptionSize: false,
        hideOptionText: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Insert the questions into the collection
    const insertResult = await collection.insertMany(questions);

    console.log(`Inserted ${insertResult.insertedCount} documents`);
  },

  async down(db, client) {
    const collection = db.collection('questions');

    // Remove the questions with the texts defined at the top
    const deleteResult = await collection.deleteMany({
      $or: [
        { "question.en": "Who are you shopping for?" },
        { "question.en": "What's your budget for this purchase?" },
        { "question.en": "LEDGE" },
      ],
    });

    console.log(`Deleted ${deleteResult.deletedCount} documents`);
  }
};
