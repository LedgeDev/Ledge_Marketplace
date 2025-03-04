module.exports = {
  async up(db, client) {
    // Remove the "classId" field from all documents in the "answers" collection
    await db.collection('answers').updateMany(
      {},
      { $unset: { classId: "" } }
    );
  },

  async down(db, client) {
    // Rollback is not possible without the original data
    // We can only add the field back with a null value
    await db.collection('answers').updateMany(
      {},
      { $set: { classId: null } }
    );
  }
};