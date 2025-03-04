const prisma = require('../../prisma');
const express = require('express');
const { authenticate } = require('../../authentication');
const router = express.Router();

router.use(authenticate);

router.get('/', [], async (req, res) => {
  try {
    const categories = await prisma.categories.findMany({
      include: {
        brands: true,
      },
    });
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

router.patch('/:id', [], async (req, res) => {
  try {
    if (req.user?.isAdmin !== 'true') {
      res.status(403).send('User is not an admin');
      return;
    } else {
      const categoryId = req.params.id;
      const categoryData = req.body;
      const data = {
        name: categoryData.name,
        image: categoryData.image,
      };
      // create object to associate brands with category, if provided
      if (categoryData.brands?.length) {
        data.brands = {
          set: [], // first disconnect everything and then connect new brands
          connect: categoryData.brands.map((brand) => {
            return {
              id: brand,
            };
          }),
        };
      } else {
        data.brands = {
          set: [], // if no brands where provided, disconnect everything
        };
      }
      const updatedCategory = await prisma.categories.update({
        where: {
          id: categoryId,
        },
        data: data,
      });
      res.json(updatedCategory);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

router.post('/', [], async (req, res) => {
  try {
    if (req.user?.isAdmin !== 'true') {
      res.status(403).send('User is not an admin');
      return;
    } else {
      const newCategory = req.body;
      const data = {
        name: newCategory.name,
        image: newCategory.image,
      };
      // create object to associate brands with category, if provided
      if (newCategory.brands?.length) {
        data.brands = {
          connect: newCategory.brands.map((brand) => {
            return {
              id: brand,
            };
          }),
        };
      }
      const category = await prisma.categories.create({
        data: data,
      });
      res.status(201).json(category);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

router.delete('/:id', [], async (req, res) => {
  try {
    if (req.user?.isAdmin !== 'true') {
      res.status(403).send('User is not an admin');
      return;
    } else {
      const categoryId = req.params.id;
      await prisma.categories.delete({
        where: {
          id: categoryId,
        },
      });
      res.status(200).send('Category deleted');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

module.exports = {
  path: '/categories',
  router,
};
