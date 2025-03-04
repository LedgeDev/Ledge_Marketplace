const { ObjectId } = require('mongodb');

const brandIds = [
  '661941550895cb71762477d4', '661fac0ceb3c5c594e3a1d41', '661808200895cb7176247764',
  '6616c4130895cb717624767f', '662eaa59fe9521f1dabc10e1', '6621512c105ecd9cb5d21a9f',
  '6617cf750895cb7176247711', '66196c9e0895cb717624780b', '66215858105ecd9cb5d21aa9',
  '6618e6fc0895cb71762477a4', '6610f4725ad53bea1b991a2b', '661542f75ad53bea1b991b3f',
  '661131ad5ad53bea1b991a62', '661565bd5ad53bea1b991b84', '6613fc925ad53bea1b991aab',
  '6615782d0895cb7176247622', '656f49bbaa83137450122146', '663ccf15be63082ea1aeb769',
  '6669b5ba831928119f7619ba', '66d1bbec34497918f95eb2ce'
].map(id => new ObjectId(id));

module.exports = {
  async up(db, client) {
    // TODO write your migration here.
    // See https://github.com/seppevs/migrate-mongo/#creating-a-new-migration-script
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, { updatedCount = 0
const dealCodesCollection = db.collection('deal-codes');
    const updateResult = await dealCodesCollection.updateMany(
      {},
      [
        { $set: {
          brandId: { $arrayElemAt: [brandIds, { $floor: { $multiply: [{ $rand: {} }, brandIds.length] } }] },
          userId: null,
          description: "test description",
          isUsed: false
        } }
      ]
    );
    console.log(`Updated ${updateResult.modifiedCount} deal codes`);
  },

  async down(db) {
    console.log("This migration cannot be reverted automatically. Please restore from a backup if needed.");
  }
};
