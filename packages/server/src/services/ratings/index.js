const prisma = require('../../prisma');
const express = require('express');
const { authenticate } = require('../../authentication');
const router = express.Router();

router.use(authenticate);

router.get('/', [], async (req, res) => {
  try {
    if (req.user?.isAdmin !== 'true') {
      res.status(403).send('User is not an admin');
      return;
    }
    const ratings = await prisma.ratings.findMany();
    res.status(201).json(ratings);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

router.post('/', [], async (req, res) => {
  try {
    const userId = req.headers.currentUserId;
    // check if brand of the rating is in user myFavourites
    const user = await prisma.users.findUnique({
      where: {
        id: userId,
      },
    });
    const brandInMyFavourites = user.myFavourites.find(
      (brand) => brand.brandId === req.body.brandId,
    );
    if (!brandInMyFavourites) {
      res.status(403).send('Brand is not in user week brands');
      return;
    }
    const ratingData = {
      user: {
        connect: {
          id: userId,
        },
      },
      brand: {
        connect: {
          id: req.body.brandId,
        },
      },
      rating: parseFloat(req.body.rating),
    };
    const rating = await prisma.ratings.create({
      data: ratingData,
    });
    res.json(rating);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

module.exports = {
  path: '/ratings',
  router,
};
