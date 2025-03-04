const { ObjectId } = require('mongodb');

module.exports = {
  async up(db, client) {
    const users = db.collection('users');
    const currentDate = new Date().toISOString();

    await users.find({ myFavourites: { $type: 'array' } }).forEach(async (user) => {
      const newFavourites = user.myFavourites.map(item => ({
        addedAt: currentDate,
        brandId: item,
      }));

      await users.updateOne(
        { _id: user._id },
        { $set: { myFavourites: newFavourites } }
      );
    });
  },

  async down(db, client) {
    const users = db.collection('users');

    await users.find({ myFavourites: { $type: 'array', $elemMatch: { brandId: { $exists: true } } } }).forEach(async (user) => {
      const oldFavourites = user.myFavourites.map(item => item.brandId);

      await users.updateOne(
        { _id: user._id },
        { $set: { myFavourites: oldFavourites } }
      );
    });
  }
};
