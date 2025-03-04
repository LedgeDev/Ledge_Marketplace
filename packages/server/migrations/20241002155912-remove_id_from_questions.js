module.exports = {
  async up(db, client) {
    // Remove the "id" field from all documents in the "questions" collection
    await db.collection('questions').updateMany(
      {}, // Match all documents
      { $unset: { id: "" } } // Remove the "id" field
    );
  },

  async down(db, client) {
    // Since we can't restore the original "id" values, we'll add a new "id" field
    // with a placeholder value. You may need to adjust this based on your needs.
    await db.collection('questions').updateMany(
      { id: { $exists: false } }, // Match documents without an "id" field
      { $set: { id: "placeholder_id" } } // Add a placeholder "id" field
    );
  }
};