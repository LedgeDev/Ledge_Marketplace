module.exports = {
  async up(db, client) {
    const collections = [
      { name: 'benefits', fields: ['logo', 'image'] },
      { name: 'brands', fields: ['brandLogo', 'teamPicture', 'callerImage', 'pitchPreviewImage', 'feedbackImage', 'image', 'images', 'founderImage'] },
      { name: 'categories', fields: ['image'] },
      { name: 'products', fields: ['images'] },
      { name: 'questions', fields: ['displayImage'] }
    ];

    for (const collection of collections) {
      for (const field of collection.fields) {
        await db.collection(collection.name).updateMany(
          { [field]: { $exists: true, $ne: null } },
          [
            {
              $set: {
                [field]: {
                  $cond: {
                    if: { $isArray: `$${field}` },
                    then: {
                      $map: {
                        input: `$${field}`,
                        as: "img",
                        in: {
                          thumbnail: "$$img",
                          medium: "$$img",
                          original: "$$img"
                        }
                      }
                    },
                    else: {
                      thumbnail: `$${field}`,
                      medium: `$${field}`,
                      original: `$${field}`
                    }
                  }
                }
              }
            }
          ]
        );
      }
    }
  },

  async down(db, client) {
    const collections = [
      { name: 'benefits', fields: ['logo', 'image'] },
      { name: 'brands', fields: ['brandLogo', 'teamPicture', 'callerImage', 'pitchPreviewImage', 'feedbackImage', 'image', 'images', 'founderImage'] },
      { name: 'categories', fields: ['image'] },
      { name: 'products', fields: ['images'] },
      { name: 'questions', fields: ['displayImage'] }
    ];

    for (const collection of collections) {
      for (const field of collection.fields) {
        await db.collection(collection.name).updateMany(
          { [field]: { $exists: true, $ne: null } },
          [
            {
              $set: {
                [field]: {
                  $cond: {
                    if: { $isArray: `$${field}` },
                    then: {
                      $map: {
                        input: `$${field}`,
                        as: "img",
                        in: "$$img.original"
                      }
                    },
                    else: `$${field}.original`
                  }
                }
              }
            }
          ]
        );
      }
    }
  }
};
