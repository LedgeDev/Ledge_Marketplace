module.exports = {
  async up(db, client) {
    // Get all documents from brands collection that have either field as string
    const brands = await db.collection('brands').find({
      $or: [
        { 'shortDescription': { $type: 'string' } },
        { 'description': { $type: 'string' } }
      ]
    }).toArray();

    // Update each document
    for (const brand of brands) {
      const updates = {};

      // Transform shortDescription if it's a string
      if (typeof brand.shortDescription === 'string') {
        updates.shortDescription = {
          en: brand.shortDescription,
          de: brand.shortDescription
        };
      }

      // Transform description if it's a string
      if (typeof brand.description === 'string') {
        updates.description = {
          en: brand.description,
          de: brand.description
        };
      }

      // Only update if there are changes to make
      if (Object.keys(updates).length > 0) {
        await db.collection('brands').updateOne(
          { _id: brand._id },
          { $set: updates }
        );
      }
    }
  },

  async down(db, client) {
    // Get all documents from brands collection that have either field as object
    const brands = await db.collection('brands').find({
      $or: [
        {
          'shortDescription.en': { $exists: true },
          'shortDescription.de': { $exists: true }
        },
        {
          'description.en': { $exists: true },
          'description.de': { $exists: true }
        }
      ]
    }).toArray();

    // Revert each document
    for (const brand of brands) {
      const updates = {};

      // Revert shortDescription if it's an object
      if (brand.shortDescription && 
          typeof brand.shortDescription === 'object' && 
          brand.shortDescription.en) {
        updates.shortDescription = brand.shortDescription.en;
      }

      // Revert description if it's an object
      if (brand.description && 
          typeof brand.description === 'object' && 
          brand.description.en) {
        updates.description = brand.description.en;
      }

      // Only update if there are changes to make
      if (Object.keys(updates).length > 0) {
        await db.collection('brands').updateOne(
          { _id: brand._id },
          { $set: updates }
        );
      }
    }
  }
};