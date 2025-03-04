module.exports = {
  async up(db, client) {
    // Get all documents from products collection that have description as string
    const products = await db.collection('products').find({
      'description': { $type: 'string' }
    }).toArray();

    // Update each document
    for (const product of products) {
      if (typeof product.description === 'string') {
        await db.collection('products').updateOne(
          { _id: product._id },
          {
            $set: {
              description: {
                en: product.description,
                de: product.description
              }
            }
          }
        );
      }
    }
  },

  async down(db, client) {
    // Get all documents from products collection that have description as object
    const products = await db.collection('products').find({
      'description.en': { $exists: true },
      'description.de': { $exists: true }
    }).toArray();

    // Revert each document
    for (const product of products) {
      if (product.description && typeof product.description === 'object' && product.description.en) {
        await db.collection('products').updateOne(
          { _id: product._id },
          {
            $set: {
              description: product.description.en // Use English version as the original string
            }
          }
        );
      }
    }
  }
};