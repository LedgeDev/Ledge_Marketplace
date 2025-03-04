const { ObjectId } = require('mongodb');

module.exports = {
  async up(db, client) {
    // Remove ObjectId("674dec248f929997ed3810f8") from each user's "forYouBrandsIds" array if it exists
    await db.collection('users').updateMany(
      {},
      {
        $pull: { forYouBrandsIds: new ObjectId("674dec248f929997ed3810f8") }
      }
    );

    // Add new ObjectIds in the specified order to each user's "forYouBrandsIds" array
    await db.collection('users').updateMany(
      {},
      {
        $push: {
          forYouBrandsIds: {
            $each: [
              new ObjectId("67484883cfb92b057cdd9cdc"),
              new ObjectId("67488c504877ae3cbdade69e"),
              new ObjectId("674dec248f929997ed3810f8")
            ]
          }
        }
      }
    );
  },

  async down(db, client) {
    // Remove the added ObjectIds from each user's "forYouBrandsIds" array
    await db.collection('users').updateMany(
      {},
      {
        $pull: {
          forYouBrandsIds: {
            $in: [
              new ObjectId("67484883cfb92b057cdd9cdc"),
              new ObjectId("67488c504877ae3cbdade69e"),
              new ObjectId("674dec248f929997ed3810f8")
            ]
          }
        }
      }
    );
  }
};
