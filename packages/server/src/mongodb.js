const { MongoClient } = require('mongodb');

const mongodb = (app) => {
  if (process.env.DATABASE_URL) {
    // Use DATABASE_NAME if it exists, otherwise extract from DATABASE_URL
    const database =
      process.env.DATABASE_NAME ||
      new URL(process.env.DATABASE_URL).pathname.substring(1);
    const mongoClient = MongoClient.connect(process.env.DATABASE_URL)
      .then((client) => client.db(database))
      .catch((err) => {
        console.error('Failed to connect to MongoDB:', err);
        process.exit(1); // Exit the process with an error code
      });

    app.set('mongodbClient', mongoClient);
  } else {
    console.error('DATABASE_URL not found');
    process.exit(1); // Exit the process with an error code
  }
};

module.exports = mongodb;
