module.exports = {
  async up(db, client) {
    // Update all users to set the new attribute brandsExplored to 0
    await db.collection('users').updateMany({}, { $set: { brandsExplored: 0 } });
  },

  async down(db, client) {
    // Remove the brandsExplored attribute from all users
    await db.collection('users').updateMany({}, { $unset: { brandsExplored: "" } });
  }
};
