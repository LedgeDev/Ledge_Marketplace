const { ObjectId } = require('mongodb');

module.exports = {
  async up(db, client) {
    await db.collection('questions').insertOne({
      _id: new ObjectId("66ca5cce84372ef3340ad191"),
      position: 0,
      question: {
        en: "How do you rate this brand?",
        de: "Wie bewerten Sie diese Marke?",
        id: "0"
      },
      type: "scale",
      options: [],
      classId: null,
      onboarding: false,
      randomizeOptions: false,
      displayImage: null,
      footnote: {
        en: "",
        de: ""
      },
      subtitle: {
        en: "",
        de: ""
      },
      brandId: null,
      correctAnswerId: null,
      createdAt: new Date("2024-08-24T22:21:02.390Z"),
      updatedAt: new Date("2024-08-24T22:21:02.390Z")
    });
  },

  async down(db, client) {
    await db.collection('questions').deleteOne({ _id: new ObjectId("66ca5cce84372ef3340ad191") });
  }
};