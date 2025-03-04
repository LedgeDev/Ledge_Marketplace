module.exports = {
  async up(db, client) {
    await db.collection('products').updateMany(
      { productType: { $exists: true, $ne: "" }, tags: { $exists: false } },
      [
        { 
          $set: { 
            tags: ["$productType"] 
          } 
        }
      ]
    );
  },

  async down(db, client) {
    await db.collection('products').updateMany(
      { tags: { $exists: true } },
      { $unset: { tags: "" } }
    );
  }
};
