const prisma = require("../../prisma");
const express = require("express");
const { authenticate } = require("../../authentication");
const router = express.Router();
const OpenAIApi = require('openai');
const openai = new OpenAIApi({ key: process.env.OPENAI_API_KEY });
const { analyzeImage, extractTags, extractPrice } = require('./utils');

// Set higher limit for this router specifically
router.use(express.json({ limit: '50mb' }));
router.use(express.urlencoded({ limit: '50mb', extended: true }));

router.use(authenticate);

router.get('/', [], async (req, res) => {
  try {
    if (req.user?.isAdmin === "true") {
      let posts = await prisma.posts.findMany({
        include: {
          brand: true,
        },
      });
      res.json(posts);
      return;
    }
    const userId = req.headers.currentUserId;
    const user = await prisma.users.findUnique({
      where: {
        id: userId,
      }
    });
    const posts = await prisma.posts.findMany({
      where: {
        OR: [
          {
            brandId: {
              in: user.myFavourites ? user.myFavourites.map((entry) => entry.brandId) : [],
            },
          },
          {
            brandId: null,
          }
        ]
      },
      include: {
        brand: true,
        userLikes: {
          select: {
            id: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(posts);
  } catch (error) {
    console.error('Error getting posts:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/", [], async (req, res) => {
  try {
    if (req.user?.isAdmin !== "true") {
      res.status(403).send("User is not an admin");
      return;
    }
    const data = req.body;
    const media = data.media[0];

    // Formating
    if (media && media.original) {
      data.image = media;
    } else if ( media && typeof media === "string" ) {
      data.video = media;
    }

    delete data.media;

    const post = await prisma.posts.create({
      data: {
        ...data,
      },
    });
    res.status(201).json(post);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

router.post("/:id/like", [], async (req, res) => {
  try {
    const userId = req.headers.currentUserId;
    const { like } = req.body;
    let post;
    if (like === true) {
      post = await prisma.posts.update({
        where: {
          id: req.params.id,
        },
        data: {
          userLikes: {
            connect: {
              id: userId,
            }
          }
        },
        include: {
          brand: true,
          userLikes: {
            select: {
              id: true,
            }
          }
        },
      });
    } else {
      post = await prisma.posts.update({
        where: {
          id: req.params.id,
        },
        data: {
          userLikes: {
            disconnect: {
              id: userId,
            }
          }
        },
        include: {
          brand: true,
          userLikes: {
            select: {
              id: true,
            }
          }
        },
      });
    }
    res.status(200).json(post);
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
    const media = data.media?.[0];

    // Formatting media with exclusive handling
    if (media && media.original) {
      data.image = media;
      data.video = null; // Remove video when image is uploaded
    } else if (media && typeof media === "string") {
      data.video = media;
      data.image = null; // Remove image when video is uploaded
    }

    delete data.media;

    const post = await prisma.posts.update({
      where: {
        id: req.params.id,
      },
      data: {
        ...data,
      },
    });
    res.status(200).json(post);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

router.delete("/:id", [], async (req, res) => {
  try {
    if (req.user?.isAdmin !== "true") {
      res.status(403).send("User is not an admin");
      return;
    }
    await prisma.posts.delete({
      where: {
        id: req.params.id,
      }
    });
    res.status(200).send("Deleted");
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

router.post("/analyze-single-image", [], async (req, res) => {
  try {
    const { image } = req.body;
    
    if (!image || !image.base64) {
      return res.status(400).json({ error: "No image provided" });
    }
    
    // Process the single image with OpenAI
    try {
      const result = await analyzeImage(image.base64);
      res.json(result);
    } catch (error) {
      console.error("Error analyzing image:", error);
      res.json({
        tags: ["Error analyzing image"],
        price: "Unknown"
      });
    }
    
  } catch (error) {
    console.error('Error analyzing image:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/analyze-images", [], async (req, res) => {
  try {
    const { images } = req.body;
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: "No images provided" });
    }
    
    // Process each image with OpenAI
    const analysisPromises = images.map(async (image) => {
      try {
        return await analyzeImage(image.base64);
      } catch (error) {
        console.error("Error analyzing image:", error);
        return {
          tags: ["Error analyzing image"],
          price: "Unknown"
        };
      }
    });
    
    const results = await Promise.all(analysisPromises);

    console.log(results);
    res.json(results);
    
  } catch (error) {
    console.error('Error analyzing images:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = {
  path: "/posts",
  router,
};
