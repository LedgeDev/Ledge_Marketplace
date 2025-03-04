module.exports = {
  async up(db, client) {
    // Add the 'code' attribute to all documents in the 'benefits' collection
    // that don't already have it
    await db.collection('benefits').updateMany(
      { code: { $exists: false } },
      { $set: { code: "" } }
    );
  },

  async down(db, client) {
    // Remove the 'code' attribute from all documents in the 'benefits' collection
    await db.collection('benefits').updateMany(
      {},
      { $unset: { code: "" } }
    );
  }
};