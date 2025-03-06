const prisma = require('../../prisma');
const express = require('express');
const { authenticate } = require('../../authentication');
const router = express.Router();
const { analyzeImage } = require('./utils');

// Set higher limit for this router specifically
router.use(express.json({ limit: '50mb' }));
router.use(express.urlencoded({ limit: '50mb', extended: true }));

router.use(authenticate);

router.get('/', [], async (req, res) => {
  try {
    // Get all products with user information, without brand details
    const products = await prisma.products.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
            location: true
          }
        },
        offers: true,
      },
    });
    res.status(200).json(products);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

router.get('/ownedProducts', [], async (req, res) => {
  const userId = req.headers.currentUserId;
  if (req.user?.isBrand !== 'true') {
    res.status(403).send('User is not brand owner');
    return;
  }
  try {
    const products = await prisma.products.findMany({
      include: {
        brand: true,
      },
      where: {
        brand: {
          is: {
            owner: {
              is: {
                id: userId,
              },
            },
          },
        },
      },
    });
    res.status(200).json(products);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

router.get('/:id', [], async (req, res) => {
  const userId = req.headers.currentUserId;
  const productId = req.params.id;
  if (req.user?.isBrand === 'true') {
    try {
      const ownedProducts = await prisma.products.findMany({
        include: {
          brand: true,
        },
        where: {
          brand: {
            is: {
              owner: {
                is: {
                  id: userId,
                },
              },
            },
          },
        },
      });
      const product = ownedProducts.find((p) => p.id === productId);
      if (!product) {
        res.status(403).send('User is not brand owner of product');
        return;
      }
      res.status(200).json(product);
    } catch (error) {
      console.error(error);
      res.status(500).send(error.message);
    }
  } else if (req.user?.isAdmin === 'true') {
    try {
      const product = await prisma.products.findUnique({
        where: {
          id: productId,
        },
      });
      res.status(200).json(product);
    } catch (error) {
      console.error(error);
      res.status(500).send(error.message);
    }
  } else {
    res.status(403).send('User is not brand owner nor admin');
    return;
  }
});

router.post('/', [], async (req, res) => {
  const userId = req.headers.currentUserId;
  if (req.user?.isBrand !== 'true') {
    res.status(403).send('User is not brand owner');
    return;
  }
  try {
    const ownedBrand = await prisma.brands.findFirst({
      where: {
        owner: {
          id: userId,
        },
      },
    });
    const product = await prisma.products.create({
      data: {
        ...req.body,
        brand: {
          connect: {
            id: ownedBrand.id,
          },
        },
      },
    });
    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

router.patch('/:id', [], async (req, res) => {
  const userId = req.headers.currentUserId;
  const productId = req.params.id;
  if (req.user?.isBrand !== 'true') {
    res.status(403).send('User is not brand owner');
    return;
  }
  try {
    const product = await prisma.products.update({
      where: {
        id: productId,
        brand: {
          owner: {
            id: userId,
          },
        },
      },
      data: {
        ...req.body,
      },
    });
    res.status(200).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

// Add new routes for image analysis and product creation
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
    res.json(results);
    
  } catch (error) {
    console.error('Error analyzing images:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/create-products", [], async (req, res) => {
  try {
    const { products } = req.body;
    
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "No products provided" });
    }
    
    const userId = req.headers.currentUserId;
    
    // Create each product in the database with user association
    const createdProducts = await Promise.all(
      products.map(async (product) => {
        // Process the image if available
        let imageData = null;
        if (product.base64) {
          imageData = {
            original: `data:image/jpeg;base64,${product.base64}`,
          };
        } else if (product.imageUri) {
          // If we only have URI but no base64, we'll use a placeholder
          imageData = {
            original: product.imageUri,
          };
        }
        
        // Create the product with user association only
        return await prisma.products.create({
          data: {
            name: product.productName,
            description: { text: product.description },
            regularPrice: product.price?.toString() || "0",
            images: imageData ? [imageData] : [],
            userId: userId // Associate with the current user
          }
        });
      })
    );
    
    res.status(201).json(createdProducts);
  } catch (error) {
    console.error('Error creating products:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = {
  path: '/products',
  router,
};
