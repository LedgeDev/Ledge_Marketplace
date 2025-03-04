module.exports = {
  async up(db) {
    // Using the 'users' collection
    const collection = db.collection('users');

    // Update all users to set 'forYouBrands' to []
    const updateResult = await collection.updateMany(
      {}, // Filter - Empty means it applies to all documents
      { $set: { forYouBrands: [] } }, // Set 'forYouBrands' to []
    );

    console.log(`Updated ${updateResult.matchedCount} documents`);
  },

  async down(db) {
    // Using the 'users' collection
    const collection = db.collection('users');

    // Remove the 'forYouBrands' from all users
    const updateResult = await collection.updateMany(
      {}, // Filter - Empty means it applies to all documents
      { $unset: { forYouBrands: '' } }, // Remove 'forYouBrands'
    );

    console.log(
      `Removed 'forYouBrands' from ${updateResult.modifiedCount} users.`,
    );
  },
};
