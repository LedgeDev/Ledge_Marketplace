const prisma = require('../src/prisma');
const crypto = require('crypto');
const config = require('config');

function generateRandomUserId() {
  const uuid = crypto.randomUUID();
  const formattedUuid = uuid.replace(/-/g, '');
  return `auth0|${formattedUuid}`;
}

function generateRandomEmail() {
  const randomEmail = crypto.randomBytes(20).toString('hex') + '@example.com';
  return randomEmail;
}

function generateRandomId() {
  const randomBytes = crypto.randomBytes(12);
  return randomBytes.toString('hex');
}

async function createAppVersion(data) {
  try {
    const appVersionData = {
      id: generateRandomId(),
      version: '1.1.1',
      critical: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    };

    const appVersion = await prisma.app_versions.create({
      data: appVersionData,
    });

    return appVersion.id;
  } catch (error) {
    console.error(error);
    return error;
  }
}

async function createQuestionsClass(data) {
  try {
    const questionClassData = {
      id: generateRandomId(),
      name: data.name,
      editable: data.editable !== undefined ? data.editable : true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    };

    const questionClass = await prisma.question_classes.create({
      data: questionClassData,
    });

    return questionClass.id;
  } catch (error) {
    console.error(error);
    return error;
  }
}

async function createPitchQuestions(data) {
  try {
    const pitchQuestionData = {
      id: generateRandomId(),
      questions: JSON.stringify(data.questions || {}), // Ensures that questions are stored as a JSON string
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    };

    const pitchQuestion = await prisma.pitch_questions.create({
      data: pitchQuestionData,
    });

    return pitchQuestion.id;
  } catch (error) {
    console.error(error);
    return error;
  }
}

async function createUser({ userData = {} } = {}) {
  try {
    let userId;
    if (userData.id) {
      userId = userData.id;
    } else {
      userId = generateRandomUserId();
    }

    const userEmail = generateRandomEmail();

    // Combine user-provided data with defaults
    const data = {
      id: userId,
      email: userEmail,
      createdAt: new Date(),
      updatedAt: new Date(),
      myFavourites: [],
      notificationsToken: '541FD768FA3A3BBE6A6D78049CD60896036E919ADCF4D3827C55F64BBDCE39BB',
      brandsExplored: 0,
      ...userData,
      id: userId, // Ensure the ID is set to the determined userIdr

    };

    const user = await prisma.users.create({
      data: data,
    });

    return user.id;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

async function createQuestion(data) {
  try {
    const questionData = {
      id: generateRandomId(),
      onboarding: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    };

    const question = await prisma.questions.create({
      data: questionData,
    });

    return question.id;
  } catch (error) {
    console.error(error);
    return error;
  }
}

async function createBrand(data) {
  try {
    const brandData = {
      id: generateRandomId(),
      description: 'Brand description',
      name: 'Brand name',
      brandLogo: 'https://example.com/logo.png',
      email: 'example@example.com',
      managerEmail: 'manager@gmail.com',
      managerName: 'Manager name',
      managerPhone: '123456789',
      products: {
        connect: [],
      },
      labels: {
        connect: [],
      },
      website: 'https://example.com',
      categoryId: '1',
      teaser: 'Teaser',
      chatLink: 'https://example.com/chat',
      phrases: ['Phrase 1', 'Phrase 2'],
      mainPhrase: 'Main phrase',
      founders: [
        {
          name: 'Founder name',
          image: 'https://example.com/caller.png',
        },
      ],
      image: 'https://example.com/image.png',
      dealDescription: 'Deal description',
      dealExpiration: new Date(),
      usersNotifiedIds: [],
      ...data,
    };

    const brand = await prisma.brands.create({
      data: brandData,
    });

    return brand.id;
  } catch (error) {
    return error;
  }
}

async function createCategory(data) {
  try {
    const categoryData = {
      id: generateRandomId(),
      name: 'Default Category Name',
      image_url: 'https://example.com/default.jpg',
      ...data,
    };

    const category = await prisma.categories.create({
      data: categoryData,
    });

    return category.id;
  } catch (error) {
    console.error(error);
    return error;
  }
}

module.exports = {
  createUser,
  createBrand,
  createCategory,
  createQuestion,
  createPitchQuestions,
  createQuestionsClass,
  createAppVersion,
};
