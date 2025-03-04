module.exports = {
  async up(db, client) {
    const collection = db.collection('deal-codes');

    // Predefined translations
    const translations = {
      "20% discount code on all items": "20% Rabattcode auf alle Artikel",
      "30% discount on all products": "30% Rabatt auf alle Produkte",
      "10% discount on all our products": "10% Rabatt auf alle unsere Produkte",
      "Starter package discount": "Rabatt auf Starterpaket",
      "Get 2 free products if you buy a cream": "Erhalten Sie 2 kostenlose Produkte beim Kauf einer Creme",
      "15% discount on any of our products!": "15% Rabatt auf eines unserer Produkte!",
      "Discount coming soon": "Rabatt kommt bald",
      "25% discount on all products": "25% Rabatt auf alle Produkte",
      "10% discount on all products": "10% Rabatt auf alle Produkte",
      "test description": "Testbeschreibung"
    };

    const cursor = collection.find({});
    let count = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      const englishDescription = doc.description;
      const germanDescription = translations[englishDescription] || englishDescription;

      await collection.updateOne(
        { _id: doc._id },
        {
          $set: {
            description: {
              en: englishDescription,
              ge: germanDescription
            }
          }
        }
      );

      count++;
      if (count % 1000 === 0) {
        console.log(`Processed ${count} documents`);
      }
    }

    console.log(`Migration completed. Total documents processed: ${count}`);
  },

  async down(db, client) {
    const collection = db.collection('deal-codes');

    const cursor = collection.find({ 'description.en': { $exists: true } });
    let count = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      await collection.updateOne(
        { _id: doc._id },
        {
          $set: {
            description: doc.description.en
          }
        }
      );

      count++;
      if (count % 1000 === 0) {
        console.log(`Reverted ${count} documents`);
      }
    }

    console.log(`Reversion completed. Total documents processed: ${count}`);
  }
};
