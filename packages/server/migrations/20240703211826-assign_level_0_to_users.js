

module.exports = {
  async up(db, client) {
    // Find the level document with order equal to 0

    if (process.env.INTEGRATION_TEST_MODE === 'true') {
      return;
    }

    const level = await db.collection('levels').findOne({ order: 0 });

    if (level) {
      // Update all users to set the levelId to the found level's _id
      await db.collection('users').updateMany({}, { $set: { levelId: level._id } });
    } else {
      throw new Error("No level found with order 0");
    }
  },

  async down(db, client) {
    // Remove the levelId attribute from all users
    await db.collection('users').updateMany({}, { $unset: { levelId: "" } });
  }
};
