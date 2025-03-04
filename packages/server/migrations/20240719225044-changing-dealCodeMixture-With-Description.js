module.exports = {
  async up(db, client) {

    if (process.env.INTEGRATION_TEST_MODE === 'true') {
      return;
    }

    // Get all documents from the brands collection
    const brands = await db.collection('brands').find().toArray();

    for (const brand of brands) {
      // Determine the description to use
      let description = '';
      if (Array.isArray(brand.dealDescription)) {
        description = brand.dealDescription[0] || '';
      } else if (typeof brand.dealDescription === 'string') {
        description = brand.dealDescription;
      }

      // Transform dealCodes
      const newDealCodes = brand.dealCodes.map(code => {
        return {
          code: code,
          description: description
        };
      });

      // Update the document
      await db.collection('brands').updateOne(
        { _id: brand._id },
        { $set: { dealCodes: newDealCodes } }
      );
    }
  },

  async down(db, client) {
    // Get all documents from the brands collection
    const brands = await db.collection('brands').find().toArray();

    for (const brand of brands) {
      // Transform dealCodes back to an array of strings
      const oldDealCodes = brand.dealCodes.map(deal => deal.code);

      // Update the document
      await db.collection('brands').updateOne(
        { _id: brand._id },
        { $set: { dealCodes: oldDealCodes } }
      );
    }
  }
};
