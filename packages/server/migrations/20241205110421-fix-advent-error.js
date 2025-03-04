const { ObjectId } = require('mongodb');

module.exports = {
  async up(db) {
    // Using the 'users' collection
    const collection = db.collection('users');

    // Update documents where the old ObjectId exists in forYouBrandsIds
    const updateResult = await collection.updateMany(
      {
        forYouBrandsIds: new ObjectId('6621512c105ecd9cb5d21a9f')
      },
      {
        $set: {
          'forYouBrandsIds.$[elem]': new ObjectId('67502d99cddc3e430dff3ce4')
        }
      },
      {
        arrayFilters: [{ elem: new ObjectId('6621512c105ecd9cb5d21a9f') }]
      }
    );

    console.log(`Updated ${updateResult.matchedCount} documents`);
  },

  async down(db) {
    // Using the 'users' collection
    const collection = db.collection('users');

    // Revert the changes by replacing back the ObjectId
    const updateResult = await collection.updateMany(
      {
        forYouBrandsIds: new ObjectId('67502d99cddc3e430dff3ce4')
      },
      {
        $set: {
          'forYouBrandsIds.$[elem]': new ObjectId('6621512c105ecd9cb5d21a9f')
        }
      },
      {
        arrayFilters: [{ elem: new ObjectId('67502d99cddc3e430dff3ce4') }]
      }
    );

    console.log(`Reverted ${updateResult.matchedCount} documents`);
  },
};
