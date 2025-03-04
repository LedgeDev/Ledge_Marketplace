const prisma = require('../../prisma');
const express = require('express');
const { authenticate } = require('../../authentication');
const router = express.Router();

router.use(authenticate);

router.get('/', [], async (req, res) => {
  try {
    const products = await prisma.products.findMany({
      where: req.query,
    });
    res.status(201).json(products);
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

module.exports = {
  path: '/products',
  router,
};
