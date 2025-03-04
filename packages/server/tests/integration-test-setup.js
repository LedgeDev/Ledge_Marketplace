#!/usr/bin/env node
require('dotenv').config({ path: `.env.test` });
const fs = require('fs');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');
const { exec } = require('child_process');
const util = require('util');

const { createUser } = require('./utils');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// MongoDB connection string
const mongoUri = process.env.DATABASE_URL;

async function connectToMongoDB() {
  const client = new MongoClient(mongoUri);
  await client.connect();
  return client.db();
}

function parseObjectIds(obj) {
  if (Array.isArray(obj)) {
    return obj.map(parseObjectIds);
  } else if (typeof obj === 'object' && obj !== null) {
    if (obj.$oid) {
      return new ObjectId(obj.$oid);
    }
    if (obj.$numberLong) {
      return parseInt(obj.$numberLong, 10);
    }
    for (const key in obj) {
      obj[key] = parseObjectIds(obj[key]);
    }
  }
  return obj;
}

function loadJsonFile(filename) {
  const filePath = path.join(__dirname, filename);
  const fileContent = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(fileContent);
}

async function uploadFileIntoCollection(db, collectionName, fileName) {
  try {
    let jsonContent = loadJsonFile(fileName);
    jsonContent = parseObjectIds(jsonContent);
    const dataToInsert = Array.isArray(jsonContent) ? jsonContent : [jsonContent];
    const collection = db.collection(collectionName);
    const result = await collection.insertMany(dataToInsert);
    console.log(`Uploaded ${result.insertedCount} records from ${fileName} to collection ${collectionName}`);
    return result.insertedCount;
  } catch (error) {
    console.error(`Error uploading file content: ${error.message}`);
    throw error;
  }
}

async function integrationTestDbSetup() {
  try {

    // Create a user
    const userId = await createUser({
      userData: {
        id: "664a28c6ab587d72477e8b96", // This is the user ID that will be used in the integration tests
        forYouBrandsIds: ["6616c4130895cb717624767f"]
    }});

    // Connect to MongoDB
    const db = await connectToMongoDB();

    // Create app-versions
    const appVersionsResult = await uploadFileIntoCollection(db, 'app-versions', './testData/dev.app-versions.json');

    // Create the benefits
    const benefitsResult = await uploadFileIntoCollection(db, 'benefits', './testData/dev.benefits.json');

    // Create the brands
    const brandResult = await uploadFileIntoCollection(db, 'brands', './testData/dev.brands.json');

    // Create the categories
    const categoriesResult = await uploadFileIntoCollection(db, 'categories', './testData/dev.categories.json');

    // Create levels
    const levelsResult = await uploadFileIntoCollection(db, 'levels', './testData/dev.levels.json');

    // Create the products
    const productsResult = await uploadFileIntoCollection(db, 'products', './testData/dev.products.json');

    // Create question-classes
    const questionClassesResult = await uploadFileIntoCollection(db, 'question-classes', './testData/dev.question-classes.json');

    // Create questionnaires
    const questionnairesResult = await uploadFileIntoCollection(db, 'questionnaires', './testData/dev.questionnaires.json');

    // Create the questions
    const questionsResult = await uploadFileIntoCollection(db, 'questions', './testData/dev.questions.json');

    // Create the deal code groups
    const dealCodesGroupsResult = await uploadFileIntoCollection(db, 'deal-code-groups', './testData/dev.deal-code-groups.json');

    // Create the deal codes
    const dealCodesResult = await uploadFileIntoCollection(db, 'deal-codes', './testData/dev.deal-codes.json');


    // Execute migrations with npx migrate-mongo up
    await runMigrations();

    // Disconnect from MongoDB
    await db.client.close();

    console.log('Data migration completed');

    console.log('Test data setup completed');
  } catch (error) {
    console.error('Error setting up test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function clearDatabase() {
  try {
    // Check if we're using a test database
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl.includes('test')) {
      throw new Error('Not a test database. Please use a database with "test" in its name.');
    }

    // Clear all tables
    await prisma.$transaction([
      prisma.answers.deleteMany(),
      prisma.app_versions.deleteMany(),
      prisma.benefits.deleteMany(),
      prisma.brands.deleteMany(),
      prisma.brand_screen_times.deleteMany(),
      prisma.categories.deleteMany(),
      prisma.foundersReachedLeaderboard.deleteMany(),
      prisma.link_visits.deleteMany(),
      prisma.production_submissions.deleteMany(),
      prisma.products.deleteMany(),
      prisma.questionnaires.deleteMany(),
      prisma.question_classes.deleteMany(),
      prisma.questions.deleteMany(),
      prisma.ratings.deleteMany(),
      prisma.terms_and_conditions.deleteMany(),
      prisma.feedback.deleteMany(),
      prisma.levels.deleteMany(),
      prisma.users.deleteMany(),
      prisma.deal_codes.deleteMany(),
      prisma.deal_code_groups.deleteMany(),
    ]);

    console.log('Database cleared');
  } catch (error) {
    console.error('Failed to clear the database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

function runMigrations() {
  return new Promise((resolve, reject) => {
    exec('INTEGRATION_TEST_MODE=true npx migrate-mongo up', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error running migrations: ${error.message}`);
        reject(error);
        return;
      }
      resolve();
    });
  });
}

async function integrationTestModeSetup() {
  try {
    await clearDatabase();
    await integrationTestDbSetup();
    console.log('Integration test mode setup completed successfully');
  } catch (error) {
    console.error('Error during integration test mode setup:', error);
  }
}

integrationTestModeSetup();
