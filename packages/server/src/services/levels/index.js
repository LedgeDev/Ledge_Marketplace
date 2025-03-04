const prisma = require("../../prisma");
const express = require("express");
const { authenticate } = require("../../authentication");
const router = express.Router();

router.use(authenticate);

router.get("/", [], async (req, res) => {
  try {
    if (req.user?.isAdmin !== "true") {
      res.status(403).send("User is not an admin");
      return;
    }
    let levels = await prisma.levels.findMany({
      include: {
        benefits: true,
      },
    });
    res.json(levels);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

router.patch("/:id", [], async (req, res) => {
  try {
    if (req.user?.isAdmin !== "true") {
      res.status(403).send("User is not an admin");
      return;
    }
    const levelId = req.params.id;
    let level = await prisma.levels.update({
      where: {
        id: levelId,
      },
      data: req.body,
    });
    res.json(level);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

module.exports = {
  path: "/levels",
  router,
};
