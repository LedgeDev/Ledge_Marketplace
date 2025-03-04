const { ObjectId } = require('mongodb');

module.exports = {
  async up(db) {
    // Update all deal-codes documents with specific groupId
    const updateResult = await db.collection('deal-codes').updateMany(
      {
        groupId: new ObjectId('67579723b9589c8aa7461c0e')
      },
      {
        $set: {
          code: 'Ledge20'
        }
      }
    );

    console.log(`Updated ${updateResult.modifiedCount} deal codes`);
  },

  async down(db) {
    // Note: Since we don't know the original values, we can't truly restore them
    // This is a placeholder down migration that would need to be modified based on your needs
    console.log('Warning: down migration is not implemented. Previous values cannot be restored.');
  },
};
