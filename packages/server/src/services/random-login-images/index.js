const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getRandomBackgroundUrl = async () => {
  // Get all active background images
  const activeImages = await prisma.login_background_images.findMany({
    where: {
      isActive: true
    }
  });

  if (!activeImages || activeImages.length === 0) {
    throw new Error('No active background images found');
  }

  // Get a random image from the active ones
  const randomIndex = Math.floor(Math.random() * activeImages.length);
  return activeImages[randomIndex].imageUrl;
};

// Endpoint to get a random URL
router.get('/', async (req, res) => {
  try {
    const randomBackground = await getRandomBackgroundUrl();
    res.json(randomBackground);
  } catch (error) {
    console.error('Error getting background image:', error);
    res.status(500).json({
      error: 'Error getting background image',
      message: error.message
    });
  }
});

module.exports = {
  path: '/loginBackgroundImages',
  router,
};

