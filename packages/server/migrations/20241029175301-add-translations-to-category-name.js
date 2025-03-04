module.exports = {
  async up(db, client) {
    // Get all documents that need updating
    const categories = await db.collection('categories').find({
      $or: [
        { 'name': { $type: 'string' } },
        { 'displayName': { $exists: true } }
      ]
    }).toArray();

    // Update each document
    for (const category of categories) {
      const updates = {};
      const unsets = {};

      // Transform name if it's a string
      if (typeof category.name === 'string') {
        updates.name = {
          en: category.name,
          de: category.name
        };
      }

      // Remove displayName
      if (category.displayName !== undefined) {
        unsets.displayName = "";
      }

      // Perform updates
      const updateOperations = {};
      if (Object.keys(updates).length > 0) {
        updateOperations.$set = updates;
      }
      if (Object.keys(unsets).length > 0) {
        updateOperations.$unset = unsets;
      }

      if (Object.keys(updateOperations).length > 0) {
        await db.collection('categories').updateOne(
          { _id: category._id },
          updateOperations
        );
      }
    }
  },

  async down(db, client) {
    // Get all documents from categories collection that have name as object
    const categories = await db.collection('categories').find({
      'name.en': { $exists: true },
      'name.de': { $exists: true }
    }).toArray();

    // Revert each document
    for (const category of categories) {
      if (category.name && typeof category.name === 'object' && category.name.en) {
        const updates = {
          name: category.name.en, // Use English version as the original string
          displayName: {
            en: category.name.en,
            de: category.name.de
          }
        };

        await db.collection('categories').updateOne(
          { _id: category._id },
          { $set: updates }
        );
      }
    }
  }
};