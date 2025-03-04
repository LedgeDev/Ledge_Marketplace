module.exports = {
  async up(db, client) {
    // Add the "ledgeRating" attribute and set it to 0 for all documents in the brands collection
    await db.collection('brands').updateMany(
      {},
      { $set: { ledgeRating: 0 } }
    );
  },

  async down(db, client) {
    // Remove the "ledgeRating" attribute from all documents in the brands collection
    await db.collection('brands').updateMany(
      {},
      { $unset: { ledgeRating: "" } }
    );
  }
};