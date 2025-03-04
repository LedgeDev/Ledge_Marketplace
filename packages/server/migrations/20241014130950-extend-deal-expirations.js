module.exports = {
  async up(db, client) {
    try {
      const collection = db.collection('deal-codes');
      const result = await collection.updateMany(
        { userExpireDate: { $exists: true } },
        [
          {
            $set: {
              userExpireDate: {
                $add: ['$userExpireDate', 40 * 24 * 60 * 60 * 1000] // Add 40 days in milliseconds
              }
            }
          }
        ]
      );

      console.log(`Updated ${result.modifiedCount} documents`);
    } catch (error) {
      console.error('Error in migration:', error);
      throw error;
    }
  },

  async down(db, client) {
    try {
      const collection = db.collection('deal-codes');
      const result = await collection.updateMany(
        { userExpireDate: { $exists: true } },
        [
          {
            $set: {
              userExpireDate: {
                $subtract: ['$userExpireDate', 40 * 24 * 60 * 60 * 1000] // Subtract 40 days in milliseconds
              }
            }
          }
        ]
      );

      console.log(`Reverted ${result.modifiedCount} documents`);
    } catch (error) {
      console.error('Error in rollback:', error);
      throw error;
    }
  }
};