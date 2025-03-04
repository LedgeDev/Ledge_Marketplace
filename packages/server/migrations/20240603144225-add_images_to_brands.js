module.exports = {
  async up(db, client) {
    // Iterate through the "brands" collection and update documents
    await db.collection('brands').updateMany(
      { images: { $exists: false } }, // Condition to check if "images" attribute does not exist
      [
        {
          $set: {
            images: { $cond: { if: { $ne: ["$image", null] }, then: ["$image"], else: [] } }
          }
        }
      ]
    );
  },

  async down(db, client) {
    // Revert the changes made in the up function
    await db.collection('brands').updateMany(
      { images: { $exists: true } }, // Condition to check if "images" attribute exists
      {
        $unset: { images: "" }
      }
    );
  }
};
