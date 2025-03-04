const { ObjectId } = require('mongodb');

module.exports = {
  async up(db, client) {
    const questionsCollection = db.collection('questions');

    const questions = [
      {
        _id: new ObjectId("66fc10a39aec02b59ddaafe4"),
        position: 1,
        question: {
          en: "How often have you used our product since purchasing it?",
          de: "Wie oft haben Sie unser Produkt seit dem Kauf verwendet?"
        },
        type: "single-select",
        options: [
          { en: "All the time", de: "Die ganze Zeit", image: "", id: "0" },
          { en: "A few times a week", de: "Ein paar Mal pro Woche", image: "", id: "1" },
          { en: "Once a week", de: "Einmal pro Woche", image: "", id: "2" },
          { en: "Less than once a week", de: "Weniger als einmal pro Woche", image: "", id: "3" },
          { en: "I haven't used it yet", de: "Ich habe es noch nicht benutzt", image: "", id: "4" }
        ],
        classId: null,
        onboarding: false,
        randomizeOptions: false,
        displayImage: null,
        footnote: { en: "", de: "" },
        subtitle: {
          en: "Choose one of the options below",
          de: "Wählen Sie eine der folgenden Optionen"
        },
        brandId: null,
        correctAnswerId: null,
        createdAt: new Date("2024-10-01T15:09:23.019Z"),
        updatedAt: new Date("2024-10-01T15:10:18.891Z"),
        scaleTopLabel: {},
        scaleBottomLabel: {}
      },
      {
        _id: new ObjectId("66fc110b9aec02b59ddaafe5"),
        position: 0,
        question: {
          en: "On a scale of 1 to 5, how satisfied are you with the product's overall performance?",
          de: "Auf einer Skala von 1 bis 5, wie zufrieden sind Sie mit der Gesamtleistung des Produkts?"
        },
        type: "scale",
        options: [],
        classId: null,
        onboarding: false,
        randomizeOptions: false,
        displayImage: null,
        footnote: { en: "", de: "" },
        subtitle: { en: "", de: "" },
        brandId: null,
        correctAnswerId: null,
        createdAt: new Date("2024-10-01T15:11:07.732Z"),
        updatedAt: new Date("2024-10-01T15:11:07.732Z"),
        scaleTopLabel: {},
        scaleBottomLabel: {}
      },
      {
        _id: new ObjectId("66fc11579aec02b59ddaafe6"),
        position: 2,
        question: {
          en: "What aspect of the product do you value the most?",
          de: "Welchen Aspekt des Produkts schätzen Sie am meisten?"
        },
        type: "multi-select",
        options: [
          { en: "Quality", de: "Qualität", image: "", id: "0" },
          { en: "Price", de: "Preis", image: "", id: "1" },
          { en: "Design/appearance", de: "Design/Aussehen", image: "", id: "2" },
          { en: "Ease of use", de: "Benutzerfreundlichkeit", image: "", id: "3" },
          { en: "Durability", de: "Haltbarkeit", image: "", id: "4" },
          { en: "Other", de: "Sonstiges", image: "", id: "5" }
        ],
        classId: null,
        onboarding: false,
        randomizeOptions: false,
        displayImage: null,
        footnote: { en: "", de: "" },
        subtitle: { en: "", de: "" },
        brandId: null,
        correctAnswerId: null,
        createdAt: new Date("2024-10-01T15:12:23.980Z"),
        updatedAt: new Date("2024-10-01T15:12:34.270Z"),
        scaleTopLabel: {},
        scaleBottomLabel: {}
      },
      {
        _id: new ObjectId("66fc117b9aec02b59ddaafe7"),
        position: 3,
        question: {
          en: "If you could change one thing about this product, what would it be?",
          de: "Wenn Sie eine Sache an diesem Produkt ändern könnten, was wäre es?"
        },
        type: "text",
        options: [],
        classId: null,
        onboarding: false,
        randomizeOptions: false,
        displayImage: null,
        footnote: { en: "", de: "" },
        subtitle: { en: "", de: "" },
        brandId: null,
        correctAnswerId: null,
        createdAt: new Date("2024-10-01T15:12:59.990Z"),
        updatedAt: new Date("2024-10-01T15:12:59.990Z"),
        scaleTopLabel: {},
        scaleBottomLabel: {}
      }
    ];

    await questionsCollection.insertMany(questions);
  },

  async down(db, client) {
    const questionsCollection = db.collection('questions');

    const ids = [
      "66fc10a39aec02b59ddaafe4",
      "66fc110b9aec02b59ddaafe5",
      "66fc11579aec02b59ddaafe6",
      "66fc117b9aec02b59ddaafe7"
    ];

    await questionsCollection.deleteMany({
      _id: { $in: ids.map(id => new ObjectId(id)) }
    });
  }
};