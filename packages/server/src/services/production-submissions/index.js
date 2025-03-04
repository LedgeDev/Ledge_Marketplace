const prisma = require("../../prisma");
const express = require("express");
const { authenticate } = require("../../authentication");
const router = express.Router();

router.use(authenticate);

router.post("/", async (req, res) => {
  try {
    const userId = req.headers.currentUserId;
    if (req.user?.isBrand !== "true") {
      res.status(403).send("User is not brand owner");
      return;
    }
    const user = await prisma.users.findUnique({
      where: {
        id: userId,
      },
    });
    const submission = await prisma.production_submissions.create({
      data: {
        ...req.body,
        status: "pending",
        brand: {
          connect: {
            id: user.ownedBrandId,
          },
        },
        user: {
          connect: {
            id: userId,
          },
        },
      },
    });
    res.status(201).json(submission);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

module.exports = {
  path: "/production-submissions",
  router,
};
