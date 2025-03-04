module.exports = {
  async up(db) {
    await db.collection('brands').updateMany({}, { $set: { founderCount: 1 } });
  },

  async down(db) {
    await db.collection('brands').updateMany({}, { $unset: { founderCount: "" } });
  }
};
