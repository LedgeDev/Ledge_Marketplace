const prisma = require("../../prisma");
const express = require("express");
const { authenticate } = require("../../authentication");
const router = express.Router();

router.use(authenticate);

router.post("/", [], async (req, res) => {
  try {
    const userId = req.headers.currentUserId;
    const events = req.body;
    if (!events || !events.length) {
      return res.status(200).send({ message: "No events to create" });
    }

    // we filter the props to avoid errors due to posthog specific props
    const parsedEvents = events.map((event) => ({
      userId,
      type: event.type,
      details: event.details,
      brandId: event.brandId,
      productId: event.productId,
      benefitId: event.benefitId,
    }));

    const createdEvents = await prisma.events.createMany({
      data: parsedEvents
    });
    res.status(201).json(createdEvents);
  } catch (error) {
    console.error('Error creating events:', error);
    res.status(500).send(error.message);
  }
});

module.exports = {
  path: "/events",
  router,
};
