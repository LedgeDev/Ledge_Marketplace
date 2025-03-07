const prisma = require("../../prisma");
const express = require("express");
const { authenticate } = require("../../authentication");
const router = express.Router();

router.use(authenticate);

router.post("/", [], async (req, res) => {
  try {
    const data = req.body;

    const offer = await prisma.offers.create({
      data,
    });
    res.status(201).json(offer);
  } catch (error) {
    console.error('Error creating offer', error);
    res.status(500).send(error.message);
  }
});

router.post("/accept/:id", [], async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await prisma.offers.update({
      where: { id },
      data: {
        status: 'accepted',
      },
      include: {
        user: true,
      },
    });
    
    res.status(200).json(offer);
  } catch (error) {
    console.error('Error accepting offer', error);
    res.status(500).send(error.message);
  }
});

module.exports = {
  path: "/offers",
  router,
};
