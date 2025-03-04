module.exports = {
  async up(db, client) {
    // Removes the "labelIds" attribute from every document in the "brands" collection
    await db.collection('brands').updateMany({}, { $unset: { labelIds: "" } });
  },

  async down(db, client) {
    // Restores the "labelIds" attribute to an empty array (adjust if the default value should be different)
    await db.collection('brands').updateMany({}, { $set: { labelIds: [] } });
  }
};
