module.exports = {
  async up(db) {
    // Update all brand documents
    const updateResult = await db.collection('brands').updateMany(
      {}, // This empty filter matches all documents
      [
        {
          $set: {
            shortDescription: {
              $cond: {
                if: { $eq: [{ $type: '$shortDescription' }, 'missing'] },
                then: '',
                else: '$shortDescription',
              },
            },
          },
        },
      ],
    );

    console.log(`Updated ${updateResult.modifiedCount} brands`);
  },

  async down(db) {
    // Remove the shortDescription field from all brand documents
    const updateResult = await db
      .collection('brands')
      .updateMany({}, { $unset: { shortDescription: '' } });

    console.log(
      `Removed shortDescription from ${updateResult.modifiedCount} brands`,
    );
  },
};
