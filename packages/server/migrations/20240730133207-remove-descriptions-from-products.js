module.exports = {
  async up(db) {
    // Remove the 'descriptions' field from every document in the 'products' collection
    await db.collection('products').updateMany({}, {
      $unset: { descriptions: "" }
    });
  },

  async down(db) {
    // Restore the 'descriptions' field with an empty array
    await db.collection('products').updateMany({}, {
      $set: { descriptions: [] }
    });
  }
};
