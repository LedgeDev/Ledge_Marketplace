const { exec } = require('child_process');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: `.env.test` });

// Function to generate Prisma client
function generatePrismaClient() {
  return new Promise((resolve, reject) => {
    exec('npx prisma generate', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error generating Prisma client: ${error}`);
        reject(error);
        return;
      }
      console.log('Prisma client generated:', stdout);
      if (stderr) {
        console.log('Prisma generation stderr:', stderr);
      }
      resolve();
    });
  });
}

// Function to clear the database
async function clearDatabase() {
  const client = new MongoClient(process.env.DATABASE_URL);
  try {
    await client.connect();
    const db = client.db();

    // Check if not a test database
    if (!db.databaseName.includes('test')) {
      // Raise a error, saying that the database is not a test database
      throw new Error('Database is not a test database. Modify the database name from the DATABASE_URL in the .env.test to include the word "test".');
    }

    await db.dropDatabase();
    console.log('Database cleared');
  } catch (error) {
    console.error('Failed to clear the database:', error);
    throw error; // Ensure this error is thrown to halt the setup if necessary
  } finally {
    await client.close();
  }
}

// Exported global setup function for Jest
module.exports = async () => {
  await generatePrismaClient();
  // await clearDatabase();
};
