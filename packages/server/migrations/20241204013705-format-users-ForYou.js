const { ObjectId } = require('mongodb');

module.exports = {
  async up(db, client) {
    await db.collection('users').updateMany(
      {
        forYouBrandsIds: "674f1ca5cddc3e430dff38e5"
      },
      [{
        $set: {
          forYouBrandsIds: {
            $map: {
              input: "$forYouBrandsIds",
              as: "id",
              in: {
                $cond: {
                  if: { $eq: ["$$id", "674f1ca5cddc3e430dff38e5"] },
                  then: new ObjectId("674f1ca5cddc3e430dff38e5"),
                  else: "$$id"
                }
              }
            }
          }
        }
      }]
    );
  },

  async down(db, client) {
    await db.collection('users').updateMany(
      {
        forYouBrandsIds: new ObjectId("674f1ca5cddc3e430dff38e5")
      },
      [{
        $set: {
          forYouBrandsIds: {
            $map: {
              input: "$forYouBrandsIds",
              as: "id",
              in: {
                $cond: {
                  if: { $eq: ["$$id", new ObjectId("674f1ca5cddc3e430dff38e5")] },
                  then: "674f1ca5cddc3e430dff38e5",
                  else: "$$id"
                }
              }
            }
          }
        }
      }]
    );
  }
};
