module.exports = {
  async up(db, client) {
    // Remove schemaVersion from all collections
    const collections = await db.listCollections().toArray();
    for (const collection of collections) {
      await db
        .collection(collection.name)
        .updateMany({}, { $unset: { schemaVersion: '' } });
    }

    // Update users collection
    await db.collection('users').updateMany(
      {},
      {
        $unset: {
          weekBrands: '',
          brandsUnlocked: '',
          categoryPicks: '',
          requestedDeals: '',
          pitchAnswers: '',
          answeredExtraSurvey: '',
          questions: '',
          passedTutorial: '',
          notInterestedBrands: '',
          deletedBrands: '',
          waitingLedgeCap: '',
          brandsFeedbackSent: '',
          randomCategoriesOfToday: '',
          categoryChoices: '',
          emailForFeedback: '',
        },
        $rename: {
          myBrands: 'myFavourites',
          dealsUnlocked: 'myDeals',
        },
      },
    );

    // Remove specified collections
    await db.dropCollection('pitch-answers');
    await db.dropCollection('pitch-questions');
    await db.dropCollection('category-choices');
    await db.dropCollection('ledge-cap-list');
    await db.dropCollection('early-signup-list');

    // Update categories collection
    await db.collection('categories').updateMany(
      {},
      {
        $unset: {
          categoryChoicesSelected: '',
          categoryChoicesOptionIds: '',
          categoryChoicesOption: '',
        },
      },
    );
  },

  async down(db, client) {
    // Note: This down migration is a best-effort to reverse changes.
    // Some data loss is unavoidable, especially for deleted fields and collections.

    // Restore schemaVersion to all collections (with a default value)
    const collections = await db.listCollections().toArray();
    for (const collection of collections) {
      await db.collection(collection.name).updateMany(
        {},
        { $set: { schemaVersion: 1 } },
      );
    }

    // Revert changes in users collection
    await db.collection('users').updateMany(
      {},
      {
        $set: {
          weekBrands: [],
          brandsUnlocked: [],
          categoryPicks: [],
          requestedDeals: [],
          pitchAnswers: [],
          answeredExtraSurvey: [],
          questions: [],
          passedTutorial: false,
          notInterestedBrands: [],
          deletedBrands: [],
          waitingLedgeCap: false,
          brandsFeedbackSent: [],
          randomCategoriesOfToday: [],
          categoryChoices: [],
          emailForFeedback: '',
        },
        $rename: {
          myFavourites: 'myBrands',
          myDeals: 'dealsUnlocked',
        },
      },
    );

    // Recreate deleted collections (they will be empty)
    await db.createCollection('pitch-answers');
    await db.createCollection('pitch-questions');
    await db.createCollection('category-choices');
    await db.createCollection('ledge-cap-list');
    await db.createCollection('early-signup-list');
  },
};
