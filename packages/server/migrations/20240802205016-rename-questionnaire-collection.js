module.exports = {
  async up(db, client) {
    // Rename collection "questionaire" to "questionnaire" if it exists
    const collections = await db.listCollections().toArray();
    const collectionExists = collections.some(col => col.name === 'questionaires');
    
    if (collectionExists) {
      await db.collection('questionaires').rename('questionnaires');
    }
  },

  async down(db, client) {
    // Rename collection "questionnaire" back to "questionaire" if it exists
    const collections = await db.listCollections().toArray();
    const collectionExists = collections.some(col => col.name === 'questionnaires');
    
    if (collectionExists) {
      await db.collection('questionnaires').rename('questionaires');
    }
  }
};
