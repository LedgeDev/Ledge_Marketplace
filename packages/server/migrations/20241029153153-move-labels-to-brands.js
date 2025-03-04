const { ObjectId } = require('mongodb');

module.exports = {
  async up(db, client) {
    // Get all brands
    const brands = await db.collection('brands').find({}).toArray();
    
    // Process each brand
    for (const brand of brands) {
      const labelIds = brand.labelIds || [];
      const labels = [];
      
      // Look up each label
      for (const labelId of labelIds) {
        // Convert string ID to ObjectId if needed
        const searchId = typeof labelId === 'string' ? new ObjectId(labelId) : labelId;
        
        const label = await db.collection('labels').findOne({ _id: searchId });
        if (label) {
          labels.push({
            en: label.name,
            de: label.name
          });
        }
      }
      
      // Update the brand with the new labels array
      await db.collection('brands').updateOne(
        { _id: brand._id },
        { $set: { labels: labels } }
      );
    }
  },

  async down(db, client) {
    // Remove the labels field from all brands
    await db.collection('brands').updateMany(
      {},
      { $unset: { labels: "" } }
    );
  }
};