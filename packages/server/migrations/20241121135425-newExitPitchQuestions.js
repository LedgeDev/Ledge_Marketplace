const { ObjectId } = require('mongodb');

module.exports = {
  async up(db) {
    // First, delete the specified question
    await db.collection('questions').deleteOne({
      _id: new ObjectId("659011ba6e2df4aade7820d8")
    });

    const questions = [
      {
        "_id": new ObjectId("65e325789d254f982b121c01"),
        "schemaVersion": 1,
        "position": 1,
        "type": "single-select",
        "question": {
          "en": "What should we do with this brand?",
          "de": "Was sollen wir mit dieser Brand machen?"
        },
        "footnote": {
          "en": "Please select only one option.",
          "de": "Bitte wählen Sie nur eine Option aus."
        },
        "subtitle": {
          "en": "",
          "de": ""
        },
        "options": [
          {
            "id": "1",
            "en": "Move this brand to discovery. It is not a perfect match.",
            "de": "Schiebe diese Brand zu Discovery - ist kein perfekter Fit für mich."
          },
          {
            "id": "2",
            "en": "Remove the brand completely. It is not at all for me.",
            "de": "Lösch diese Marke bitte - ist nichts für mich."
          },
          {
            "id": "3",
            "en": "Keep it in my 'For You' section. I want to watch it later.",
            "de": "Behalte die Marke bitte. Ich will sie mir später anschauen."
          }
        ],
        "displayImage": "603755f805208bc74a4c8dfa26cc577f.jpeg",
        "classId": null,
        "categoryId": null,
        "allowNewOptions": false,
        "maxNewOptionsAllowed": 0,
        "onboarding": false,
        "rejectedCallQuestion": false,
        "answers": [],
        "randomizeOptions": false,
        "fixedOptionSize": false,
        "hideOptionText": false,
        "createdAt": new Date("2024-09-23T22:32:56.073Z"),
        "updatedAt": new Date("2024-09-23T22:32:56.073Z")
      },
      {
        "_id": new ObjectId("65e325789d254f982b121c02"),
        "schemaVersion": 1,
        "position": 1,
        "type": "single-select",
        "question": {
          "en": "What should we do with this brand?",
          "de": "Was sollen wir mit dieser Brand machen?"
        },
        "footnote": {
          "en": "Please select only one option.",
          "de": "Bitte wählen Sie nur eine Option aus."
        },
        "subtitle": {
          "en": "",
          "de": ""
        },
        "options": [
          {
            "id": "1",
            "en": "Remove the brand completely. It is not at all for me.",
            "de": "Lösch diese Marke bitte - ist nichts für mich."
          },
          {
            "id": "2",
            "en": "Keep it in my 'Discovery' section. Maybe I want to watch it later.",
            "de": "Behalte die Marke bitte. Ich will sie mir vielleicht später anschauen."
          }
        ],
        "displayImage": "603755f805208bc74a4c8dfa26cc577f.jpeg",
        "classId": null,
        "categoryId": null,
        "allowNewOptions": false,
        "maxNewOptionsAllowed": 0,
        "onboarding": false,
        "rejectedCallQuestion": false,
        "answers": [],
        "randomizeOptions": false,
        "fixedOptionSize": false,
        "hideOptionText": false,
        "createdAt": new Date("2024-09-23T22:32:56.073Z"),
        "updatedAt": new Date("2024-09-23T22:32:56.073Z")
      }
    ];

    // Check for existing questions
    const questionIds = questions.map(q => q._id);
    const existingQuestions = await db.collection('questions')
      .find({ _id: { $in: questionIds } })
      .toArray();

    // Filter out questions that already exist
    const questionsToInsert = questions.filter(question =>
      !existingQuestions.some(eq => eq._id.toString() === question._id.toString())
    );

    // Only insert if there are new questions
    if (questionsToInsert.length > 0) {
      await db.collection('questions').insertMany(questionsToInsert);
    }
  },

  async down(db) {
    // Remove the questions we added
    await db.collection('questions').deleteMany({
      _id: {
        $in: [
          new ObjectId("65e325789d254f982b121c01"),
          new ObjectId("65e325789d254f982b121c02")
        ]
      }
    });

    // Restore the question we deleted (if it existed)
    // You might want to backup this data before deleting in the up() function
    // This is just a placeholder structure
    const questionToRestore = {
      _id: new ObjectId("659011ba6e2df4aade7820d8"),
      // Add the rest of the question fields here if you want to restore it
      // For now, this down migration won't restore the deleted question
    };

    // Uncomment the following line if you want to restore the deleted question
    // await db.collection('questions').insertOne(questionToRestore);
  }
};
