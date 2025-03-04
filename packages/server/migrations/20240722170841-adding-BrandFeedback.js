module.exports = {
  async up(db, client) {
    // Adding the 'usersFeedback' parameter to documents that do not have it
    await db.collection('brands').updateMany(
      { usersFeedback: { $exists: false } },
      { $set: { usersFeedback: [] } }
    );
  },

  async down(db, client) {
    // Removing the 'usersFeedback' parameter from all documents
    await db.collection('brands').updateMany(
      {},
      { $unset: { usersFeedback: "" } }
    );
  }
};
