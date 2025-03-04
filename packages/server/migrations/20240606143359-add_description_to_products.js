module.exports = {
  async up(db, client) {
    // For each document in the "products" collection, if the "description" attribute doesn't exist,
    // set it to the property "content" of the first element of the "descriptions" attribute.
    await db.collection('products').updateMany(
      { description: { $exists: false } },
      [
        {
          $set: {
            description: { $arrayElemAt: ["$descriptions.content", 0] }
          }
        }
      ]
    );
  },

  async down(db, client) {
    // Rollback the migration by removing the "description" attribute if it matches the first element's "content" in the "descriptions" attribute.
    await db.collection('products').updateMany(
      {},
      {
        $unset: { description: "" }
      }
    );
  }
};
