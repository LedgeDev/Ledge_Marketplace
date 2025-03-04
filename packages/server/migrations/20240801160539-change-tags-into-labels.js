module.exports = {
  async up(db) {

    if (process.env.INTEGRATION_TEST_MODE === 'true') {
      return;
    }
    
    // 1. Rename the 'tags' collection to 'labels'
    await db.renameCollection('tags', 'labels');

    // 2. Update the 'brands' collection to rename 'tagIds' to 'labelIds'
    await db
      .collection('brands')
      .updateMany({}, { $rename: { tagIds: 'labelIds' } });

    console.log('Migration completed successfully.');
  },

  async down(db) {
    // Revert the changes
    // 1. Rename 'labels' collection back to 'tags'
    await db.renameCollection('labels', 'tags');

    // 2. Update the 'brands' collection to rename 'labelIds' back to 'tagIds'
    await db
      .collection('brands')
      .updateMany({}, { $rename: { labelIds: 'tagIds' } });

    console.log('Rollback completed successfully.');
  },
};
