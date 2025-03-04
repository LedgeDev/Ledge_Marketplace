module.exports = {
  async up(db, client) {
    const brandsCollection = db.collection('brands');

    // Check if migration has already been run
    const migrationCheck = await brandsCollection.findOne({
      isVisible: { $exists: true }
    });
    if (migrationCheck) {
      throw new Error('Migration has already been applied. Aborting to prevent data loss.');
    }

    const result = await brandsCollection.updateMany(
      {}, // Match all documents
      {
        $set: {
          isVisible: true
        }
      }
    );

    console.log(`Migration applied to ${result.modifiedCount} documents.`);
  },

  async down(db, client) {
    const brandsCollection = db.collection('brands');

    const result = await brandsCollection.updateMany(
      {
        isVisible: { $exists: true }
      },
      {
        $unset: {
          isVisible: ""
        }
      }
    );

    console.log(`Migration reverted for ${result.modifiedCount} documents.`);
  }
};
