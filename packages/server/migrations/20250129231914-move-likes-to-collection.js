module.exports = {
  async up(db, client) {
    // Fetch all users with 'myFavourites'
    const users = await db.collection('users').find({ myFavourites: { $exists: true, $not: { $size: 0 } } }).toArray();

    // Prepare the brand-likes data from the users' favourites
    const brandLikes = users.flatMap(user => {
      return user.myFavourites.map(fav => ({
        userId: user._id.toString(),          // Convert userId to string format
        brandId: fav.brandId,                 // ObjectId from favourite entry
        createdAt: new Date(fav.addedAt),     // Convert the addedAt string to a Date object
        updatedAt: new Date(fav.addedAt)      // Same as createdAt for initial migration
      }));
    });

    // Insert the likes into the new 'brand-likes' collection
    if (brandLikes.length > 0) {
      await db.collection('brands-likes').insertMany(brandLikes);
    }
  },

  async down(db, client) {
    // Rollback: remove all entries from 'brand-likes'
    await db.collection('brands-likes').deleteMany({});
  }
};
