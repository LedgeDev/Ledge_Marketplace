module.exports = {
  async up(db) {
    // Using the 'brands' collection
    const collection = db.collection('brands');

    // Remove the 'pitchQuestionsId' field from all brand documents
    const updateResult = await collection.updateMany(
      {}, // Filter - Empty means it applies to all documents
      { $unset: { pitchQuestionsId: '' } }, // Remove 'pitchQuestionsId'
    );

    console.log(
      `Removed 'pitchQuestionsId' from ${updateResult.modifiedCount} brands.`,
    );
  },

  async down(db) {
    // Using the 'brands' collection
    const collection = db.collection('brands');

    // Note: We can't restore the exact 'pitchQuestionsId' values as they were removed.
    // Instead, we'll add the field back with a null value to all documents.
    const updateResult = await collection.updateMany(
      {}, // Filter - Empty means it applies to all documents
      { $set: { pitchQuestionsId: null } }, // Add 'pitchQuestionsId' back with null value
    );

    console.log(
      `Added 'pitchQuestionsId' (null) to ${updateResult.modifiedCount} brands.`,
    );
  },
};
