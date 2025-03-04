// migration.js

module.exports = {
  async up(db, client) {
    const collections = await db.listCollections().toArray();

    for (const collection of collections) {
      const coll = db.collection(collection.name);
      await coll.updateMany(
        { questionaireId: { $exists: true } },
        { $rename: { "questionaireId": "questionnaireId" } }
      );
    }
  },

  async down(db, client) {
    const collections = await db.listCollections().toArray();

    for (const collection of collections) {
      const coll = db.collection(collection.name);
      await coll.updateMany(
        { questionnaireId: { $exists: true } },
        { $rename: { "questionnaireId": "questionaireId" } }
      );
    }
  }
};
