// migration.js

module.exports = {
  async up(db, client) {
    const brandsCollection = db.collection('brands');

    // Check if migration has already been run
    const migrationCheck = await brandsCollection.findOne({ founders: { $exists: true } });
    if (migrationCheck) {
      throw new Error('Migration has already been applied. Aborting to prevent data loss.');
    }

    const result = await brandsCollection.updateMany(
      {
        founderImage: { $exists: true },
        founderDisplayedName: { $exists: true }
      },
      [
        {
          $set: {
            founders: [
              {
                name: "$founderDisplayedName",
                image: "$founderImage"
              }
            ]
          }
        },
        {
          $unset: ["founderImage", "founderDisplayedName", "founderCount"]
        }
      ]
    );

    console.log(`Migration applied to ${result.modifiedCount} documents.`);
  },

  async down(db, client) {
    const brandsCollection = db.collection('brands');

    const result = await brandsCollection.updateMany(
      { founders: { $exists: true, $ne: [] } },
      [
        {
          $set: {
            founderDisplayedName: { $arrayElemAt: ["$founders.name", 0] },
            founderImage: { $arrayElemAt: ["$founders.image", 0] },
            founderCount: { $size: "$founders" }
          }
        },
        {
          $unset: "founders"
        }
      ]
    );

    console.log(`Migration reverted for ${result.modifiedCount} documents.`);
  }
};
