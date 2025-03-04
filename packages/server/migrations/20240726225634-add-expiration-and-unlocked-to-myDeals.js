module.exports = {
  async up(db) {
    const today = new Date();
    const expirationDate = new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000); // 10 days from today

    const users = await db.collection('users').find({}).toArray();

    for (const user of users) {
      if (Array.isArray(user.myDeals)) {
        const newMyDeals = user.myDeals.map((brandId) => ({
          brandId: brandId,
          expirationDate: expirationDate.toISOString(),
          unlockedAt: today.toISOString(),
        }));

        await db
          .collection('users')
          .updateOne({ _id: user._id }, { $set: { myDeals: newMyDeals } });
      }
    }

    console.log('Migration completed: myDeals transformed to array of objects');
  },

  async down(db) {
    const users = await db.collection('users').find({}).toArray();

    for (const user of users) {
      if (Array.isArray(user.myDeals)) {
        const oldMyDeals = user.myDeals.map((deal) => deal.brandId);

        await db
          .collection('users')
          .updateOne({ _id: user._id }, { $set: { myDeals: oldMyDeals } });
      }
    }

    console.log(
      'Rollback completed: myDeals transformed back to array of strings',
    );
  },
};
