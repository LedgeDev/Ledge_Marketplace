const prisma = require("../../prisma");
const express = require("express");
const { authenticate } = require("../../authentication");
const { getLevelBenefits, getNextLevelBenefits } = require("./utils");
const router = express.Router();

router.use(authenticate);

router.get("/myBenefits", [], async (req, res) => {
  try {
    const userId = req.headers.currentUserId;
    const user = await prisma.users.findUnique({
      where: {
        id: userId,
      },
      include: {
        level: true,
      },
    });
    if (!user.level) {
      res.json([]);
      return;
    }
    const levelBenefits = await getLevelBenefits(user.level.id);
    const nextLevelBenefits = await getNextLevelBenefits(user.level.id);
    res.json({ levelBenefits, nextLevelBenefits });
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

router.get("/", [], async (req, res) => {
  try {
    if (req.user?.isAdmin !== "true") {
      res.status(403).send("User is not an admin");
      return;
    }
    let benefits = await prisma.benefits.findMany({
      include: {
        level: true,
      },
    });
    res.json(benefits);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

router.post("/", [], async (req, res) => {
  try {
    if (req.user?.isAdmin !== "true") {
      res.status(403).send("User is not an admin");
      return;
    } 
    const data = req.body;
    const benefit = await prisma.benefits.create({
      data: {
        ...data,
      },
    });
    res.status(201).json(benefit);
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

router.patch("/:id", [], async (req, res) => {
  try {
    if (req.user?.isAdmin !== "true") {
      res.status(403).send("User is not an admin");
      return;
    } 
    const data = req.body;
    const benefit = await prisma.benefits.update({
      where: {
        id: req.params.id,
      },
      data: {
        ...data,
      },
    });
    res.status(201).json(benefit);
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

router.delete("/:id", [], async (req, res) => {
  try {
    if (req.user?.isAdmin !== "true") {
      res.status(403).send("User is not an admin");
      return;
    }
    await prisma.benefits.delete({
      where: {
        id: req.params.id,
      }
    });
    res.status(200).send("Deleted");
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

module.exports = {
  path: "/benefits",
  router,
};
