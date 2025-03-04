module.exports = {
  async up(db, client) {
    try {
      const dealGroupsCollection = db.collection('deal-code-groups');
      const dealCodesCollection = db.collection('deal-codes');

      // Get all deal groups
      const dealGroups = await dealGroupsCollection.find({}).toArray();

      let updatedCount = 0;

      for (const dealGroup of dealGroups) {
        // Get a random sample of 50 deal codes for this group using aggregation pipeline
        const dealCodesSample = await dealCodesCollection.aggregate([
          { $match: { groupId: dealGroup._id } },
          { $sample: { size: 50 } }
        ]).toArray();

        if (!dealCodesSample.length) continue;

        let codesState;

        // Check if all sampled codes are empty strings
        const allEmpty = dealCodesSample.every(code => code.code === '');
        if (allEmpty) {
          codesState = 'emptyCodes';
        } else {
          // Get unique code values (excluding empty strings)
          const uniqueCodes = new Set(dealCodesSample.map(code => code.code).filter(code => code !== ''));

          // If there's only one unique code
          if (uniqueCodes.size === 1) {
            codesState = 'generalCodes';
          } else {
            codesState = 'shopifyCvsCodes';
          }
        }

        // Update the deal group
        const result = await dealGroupsCollection.updateOne(
          { _id: dealGroup._id },
          { $set: { codesState } }
        );

        if (result.modifiedCount > 0) {
          updatedCount++;
          console.log(`Updated group ${dealGroup._id} to state: ${codesState}`);
        }
      }

      console.log(`Updated ${updatedCount} deal groups`);
    } catch (error) {
      console.error('Error in migration:', error);
      throw error;
    }
  },

  async down(db, client) {
    try {
      const dealGroupsCollection = db.collection('deal-code-groups');

      // Remove the codesState field from all documents
      const result = await dealGroupsCollection.updateMany(
        {},
        { $unset: { codesState: "" } }
      );

      console.log(`Reverted ${result.modifiedCount} deal groups`);
    } catch (error) {
      console.error('Error in rollback:', error);
      throw error;
    }
  }
};
