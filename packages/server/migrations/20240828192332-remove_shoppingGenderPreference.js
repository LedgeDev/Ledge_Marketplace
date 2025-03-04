module.exports = {
  async up(db, client) {
    const result = await db.collection('users').updateMany(
      {}, // This empty object matches all documents
      { $unset: { shoppingGenderPreference: "" } }
    );

    console.log(`Migration up: Removed shoppingGenderPreference from ${result.modifiedCount} documents in users collection`);
  },

  async down(db, client) {
    console.log('Migration down: Cannot restore removed shoppingGenderPreference attribute');
    console.log('Please note: This migration cannot be reverted as the original values are not stored.');
  }
};