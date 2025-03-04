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
                          $cond: {
                            if: { $eq: [{ $type: "$$img" }, "string"] },
                            then: {
                              thumbnail: "$$img",
                              medium: "$$img",
                              original: "$$img",
                              high: "$$img"
                            },
                            else: {
                              $mergeObjects: [
                                "$$img",
                                { high: { $ifNull: ["$$img.original", "$$img"] } }
                              ]
                            }
                          }
                        }
                      }
                    },
                    else: {
                      $cond: {
                        if: { $eq: [{ $type: `$${field}` }, "string"] },
                        then: {
                          thumbnail: `$${field}`,
                          medium: `$${field}`,
                          original: `$${field}`,
                          high: `$${field}`
                        },
                        else: {
                          $mergeObjects: [
                            `$${field}`,
                            { high: { $ifNull: [`$${field}.original`, `$${field}`] } }
                          ]
                        }
                      }
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
                        in: {
                          $cond: {
                            if: { $eq: [{ $type: "$$img" }, "string"] },
                            then: "$$img",
                            else: {
                              $arrayToObject: {
                                $filter: {
                                  input: { $objectToArray: "$$img" },
                                  as: "kvPair",
                                  cond: { $ne: ["$$kvPair.k", "high"] }
                                }
                              }
                            }
                          }
                        }
                      }
                    },
                    else: {
                      $cond: {
                        if: { $eq: [{ $type: `$${field}` }, "string"] },
                        then: `$${field}`,
                        else: {
                          $arrayToObject: {
                            $filter: {
                              input: { $objectToArray: `$${field}` },
                              as: "kvPair",
                              cond: { $ne: ["$$kvPair.k", "high"] }
                            }
                          }
                        }
                      }
                    }
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
