const { ObjectId } = require('mongodb');

module.exports = {
  async up(db) {
    const brandIds = [
      '661941550895cb71762477d4',
      '661fac0ceb3c5c594e3a1d41',
      '661808200895cb7176247764',
      '6616c4130895cb717624767f',
      '662eaa59fe9521f1dabc10e1',
      '6621512c105ecd9cb5d21a9f',
      '6617cf750895cb7176247711'
    ];

    const documents = Array.from({ length: 25 }, (_, index) => {
      const day = index + 1;
      // Use modulo to cycle through brand IDs in order
      const brandId = brandIds[index % brandIds.length];

      return {
        _id: new ObjectId(),
        brandId: new ObjectId(brandId),
        day,
        alrreadyShowed: false,
        p: 0.8,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });

    await db.collection('advent-calendar-brands').insertMany(documents);
  },

  async down(db) {
    await db.collection('advent-calendar-brands').deleteMany({});
  }
};
