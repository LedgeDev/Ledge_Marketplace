module.exports = {
  async up(db) {
    // Remove attributes from brands collection
    await db.collection('brands').updateMany(
      {},
      {
        $unset: {
          pitchVideoColors: '',
          managerImage: '',
          callerTitle: '',
          feedbackImage: '',
          pitchPreviewImage: '',
        },
        $rename: {
          callerImage: 'founderImage',
          callerName: 'founderDisplayedName',
        },
      },
    );

    // Remove attributes from products collection
    await db.collection('products').updateMany(
      {},
      {
        $unset: {
          productType: '',
          reviews: '',
        },
      },
    );

    // Remove attributes from questions collection
    await db.collection('questions').updateMany(
      {},
      {
        $unset: {
          allowNewOptions: '',
          maxNewOptionsAllowed: '',
          rejectedCallQuestion: '',
          fixedOptionSize: '',
          hideOptionText: '',
          categoryId: '',
        },
      },
    );

    // Remove attribute from users collection
    await db.collection('users').updateMany(
      {},
      {
        $unset: {
          lastOpened: '',
        },
      },
    );

    // Remove delete-user collection
    await db.dropCollection('delete-user');
  },

  async down(db) {
    // Note: This down migration is a best-effort to reverse changes.
    // Some data loss is unavoidable for deleted fields and collections.

    // Restore removed attributes to brands collection (with null values)
    await db.collection('brands').updateMany(
      {},
      {
        $set: {
          pitchVideoColors: null,
          managerImage: null,
          callerTitle: null,
          feedbackImage: null,
          pitchPreviewImage: null,
        },
        $rename: {
          founderImage: 'callerImage',
          founderDisplayedName: 'callerName',
        },
      },
    );

    // Restore removed attributes to products collection (with null values)
    await db.collection('products').updateMany(
      {},
      {
        $set: {
          productType: null,
          reviews: null,
        },
      },
    );

    // Restore removed attributes to questions collection (with null values)
    await db.collection('questions').updateMany(
      {},
      {
        $set: {
          allowNewOptions: null,
          maxNewOptionsAllowed: null,
          rejectedCallQuestion: null,
          fixedOptionSize: null,
          hideOptionText: null,
          categoryId: null,
        },
      },
    );

    // Restore removed attribute to users collection (with null value)
    await db.collection('users').updateMany(
      {},
      {
        $set: {
          lastOpened: null,
        },
      },
    );

    // Recreate delete-user collection
    await db.createCollection('delete-user');
  },
};
