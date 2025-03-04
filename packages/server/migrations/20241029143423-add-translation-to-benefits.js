module.exports = {
  async up(db, client) {
    // Get all documents from benefits collection that have either tags as strings
    // or subtitle/description as strings
    const benefits = await db.collection('benefits').find({
      $or: [
        { 'tags': { $type: 'string' } },
        { 'subtitle': { $type: 'string' } },
        { 'description': { $type: 'string' } }
      ]
    }).toArray();

    // Update each document
    for (const benefit of benefits) {
      const updates = {};

      // Transform tags if they exist and are strings
      if (Array.isArray(benefit.tags)) {
        const transformedTags = benefit.tags.map(tag => {
          if (typeof tag === 'string') {
            return {
              en: tag,
              de: tag
            };
          }
          return tag; // If it's already an object, leave it unchanged
        });
        updates.tags = transformedTags;
      }

      // Transform subtitle if it exists and is a string
      if (benefit.subtitle && typeof benefit.subtitle === 'string') {
        updates.subtitle = {
          en: benefit.subtitle,
          de: benefit.subtitle
        };
      }

      // Transform description if it exists and is a string
      if (benefit.description && typeof benefit.description === 'string') {
        updates.description = {
          en: benefit.description,
          de: benefit.description
        };
      }

      // Only update if there are changes to make
      if (Object.keys(updates).length > 0) {
        await db.collection('benefits').updateOne(
          { _id: benefit._id },
          { $set: updates }
        );
      }
    }
  },

  async down(db, client) {
    // Get all documents from benefits collection that have object format in any field
    const benefits = await db.collection('benefits').find({
      $or: [
        { 'tags': { $elemMatch: { en: { $exists: true }, de: { $exists: true } } } },
        { 'subtitle.en': { $exists: true }, 'subtitle.de': { $exists: true } },
        { 'description.en': { $exists: true }, 'description.de': { $exists: true } }
      ]
    }).toArray();

    // Revert each document
    for (const benefit of benefits) {
      const updates = {};

      // Revert tags if they exist and are objects
      if (Array.isArray(benefit.tags)) {
        const revertedTags = benefit.tags.map(tag => {
          if (tag && typeof tag === 'object' && tag.en) {
            return tag.en; // Use English version as the original string
          }
          return tag; // If it's already a string, leave it unchanged
        });
        updates.tags = revertedTags;
      }

      // Revert subtitle if it exists and is an object
      if (benefit.subtitle && typeof benefit.subtitle === 'object' && benefit.subtitle.en) {
        updates.subtitle = benefit.subtitle.en;
      }

      // Revert description if it exists and is an object
      if (benefit.description && typeof benefit.description === 'object' && benefit.description.en) {
        updates.description = benefit.description.en;
      }

      // Only update if there are changes to make
      if (Object.keys(updates).length > 0) {
        await db.collection('benefits').updateOne(
          { _id: benefit._id },
          { $set: updates }
        );
      }
    }
  }
};