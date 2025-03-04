const { ObjectId } = require('mongodb');

module.exports = {
  async up(db, client) {
    const brandsCollection = db.collection('brands');
    const dealCodesCollection = db.collection('deal-codes');
    const dealCodeGroupsCollection = db.collection('deal-code-groups');

    // Find all brands with deal codes
    const brandsWithDealCodes = await brandsCollection.find({
      _id: { $in: await dealCodesCollection.distinct('brandId') }
    }).toArray();

    console.log(`Found ${brandsWithDealCodes.length} brands with deal codes.`);

    for (const brand of brandsWithDealCodes) {
      console.log(`Processing brand: ${brand.name}`);

      // Get deal codes for this brand
      const dealCodes = await dealCodesCollection.find({ brandId: brand._id }).toArray();

      if (dealCodes.length > 0) {
        // Create a new deal code group for the brand
        const newGroup = {
          description: dealCodes[0].description, // Assuming all deal codes have the same description
          brandId: brand._id,
          generalExpireDate: dealCodes[0].generalExpireDate, // Assuming all deal codes have the same expiration date
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const result = await dealCodeGroupsCollection.insertOne(newGroup);
        const groupId = result.insertedId;

        console.log(`Created new deal code group for brand: ${brand.name}`);

        // Update all deal codes for this brand to be associated with the new group
        await dealCodesCollection.updateMany(
          { brandId: brand._id },
          { 
            $set: { groupId: groupId },
            $unset: { brandId: "", description: "", generalExpireDate: "" }
          }
        );

        console.log(`Updated deal codes for brand: ${brand.name}`);

        // Update the brand to reference the new deal code group
        await brandsCollection.updateOne(
          { _id: brand._id },
          { 
            $set: { dealCodeGroupIds: [groupId] },
            $unset: { dealCodes: "" }
          }
        );

        console.log(`Updated brand: ${brand.name}`);
      }
    }

    console.log('Migration completed successfully.');
  },

  async down(db, client) {
    // Get all documents from the deal-code-groups collection
    const dealCodeGroups = await db.collection('deal-code-groups').find({}).toArray();

    // Create an index on groupId to improve performance
    await db.collection('deal-codes').createIndex({ groupId: 1 });

    // Create a map of groupId to group attributes for faster lookup
    const groupMap = new Map(dealCodeGroups.map(group => [group._id.toString(), group]));

    // Update all documents in the deal-codes collection
    const cursor = db.collection('deal-codes').find({});
    
    let batch = [];
    const batchSize = 1000; // Adjust this value based on your performance needs

    while (await cursor.hasNext()) {
      const dealCode = await cursor.next();
      const groupId = dealCode.groupId instanceof ObjectId ? dealCode.groupId.toString() : dealCode.groupId;
      const group = groupMap.get(groupId);

      if (group) {
        batch.push({
          updateOne: {
            filter: { _id: dealCode._id },
            update: {
              $set: {
                brandId: group.brandId,
                generalExpireDate: group.generalExpireDate,
                description: group.description
              },
              $unset: { groupId: "" }
            }
          }
        });
      }

      if (batch.length === batchSize) {
        await db.collection('deal-codes').bulkWrite(batch);
        batch = [];
      }
    }

    // Write any remaining documents in the batch
    if (batch.length > 0) {
      await db.collection('deal-codes').bulkWrite(batch);
    }

    // Remove the temporary index
    await db.collection('deal-codes').dropIndex({ groupId: 1 });
  }
};
