module.exports = {
  async up(db, client) {
    const updates = [
      { from: "Men's", to: "men" },
      { from: "Women's", to: "women" },
      { from: "Both", to: "both" },
      { from: "Other", to: "other" }
    ];

    for (const update of updates) {
      await db.collection('brands').updateMany(
        { targetGender: update.from },
        { $set: { targetGender: update.to } }
      );
    }

    console.log('Migration up: Updated targetGender values in brands collection');
  },

  async down(db, client) {
    const rollbacks = [
      { from: "men", to: "Men's" },
      { from: "women", to: "Women's" },
      { from: "both", to: "Both" },
      { from: "other", to: "Other" }
    ];

    for (const rollback of rollbacks) {
      await db.collection('brands').updateMany(
        { targetGender: rollback.from },
        { $set: { targetGender: rollback.to } }
      );
    }

    console.log('Migration down: Reverted targetGender values in brands collection');
  }
};