const prisma = require('../../prisma');
const express = require('express');
const { authenticate } = require('../../authentication');
const multer = require('multer');
const crypto = require('crypto');
const {
  uploadCsvCodes,
  uploadGeneralCodes
} = require('./utils');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.delete('/delete-unused/:brandId/:groupId', [authenticate], async (req, res) => {
  try {
    if (req.user?.isAdmin !== 'true') {
      res.status(403).send('User is not an admin');
      return;
    }

    const { brandId, groupId } = req.params;

    if (!brandId || !groupId) {
      res.status(400).send('Brand ID and Group ID are required');
      return;
    }

    // Start a transaction to ensure all operations are atomic
    const result = await prisma.$transaction(async (prisma) => {
      // Delete unused deal codes for the specific group
      const deleteCodesResult = await prisma.deal_codes.deleteMany({
        where: {
          groupId: groupId,
          userId: null
        }
      });

      // Check if the group is now empty
      const group = await prisma.deal_code_groups.findUnique({
        where: { id: groupId },
        include: { dealCodes: { select: { id: true } } }
      });

      let deletedGroup = false;
      if (group && group.dealCodes.length === 0) {
        await prisma.deal_code_groups.delete({
          where: { id: groupId }
        });
        deletedGroup = true;
      }

      return {
        deletedCodes: deleteCodesResult.count,
        deletedGroup: deletedGroup
      };
    });

    res.status(200).json({
      message: `${result.deletedCodes} unused deal codes deleted successfully`,
      groupDeleted: result.deletedGroup
    });
  } catch (error) {
    console.error('Error deleting unused deal codes:', error);
    res.status(500).send('Server error while deleting unused deal codes');
  }
});

router.delete('/delete-all/:brandId/:groupId', [authenticate], async (req, res) => {
  try {
    if (req.user?.isAdmin !== 'true') {
      res.status(403).send('User is not an admin');
      return;
    }

    const { brandId, groupId } = req.params;

    if (!brandId || !groupId) {
      res.status(400).send('Brand ID and Group ID are required');
      return;
    }

    // Start a transaction to ensure all operations are atomic
    const result = await prisma.$transaction(async (prisma) => {
      // Delete unused deal codes for the specific group
      const deleteCodesResult = await prisma.deal_codes.deleteMany({
        where: {
          groupId: groupId,
        }
      });

      // Delete the group
      const deletedGroup = await prisma.deal_code_groups.delete({
        where: { id: groupId }
      });

      return {
        deletedCodes: deleteCodesResult.count,
        deletedGroup: deletedGroup
      };
    });

    res.status(200).json({
      message: `${result.deletedCodes} deal codes deleted successfully`,
      groupDeleted: result.deletedGroup
    });
  } catch (error) {
    console.error('Error deleting unused deal codes:', error);
    res.status(500).send('Server error while deleting unused deal codes');
  }
});

router.post('/upload', [authenticate, upload.single('file')], async (req, res) => {

  try {
    if (req.user?.isAdmin !== 'true') {
      res.status(403).send('User is not an admin');
      return;
    }

    const { brandId, description, shortDescription, expirationDate, code } = req.body;

    if (!brandId) {
      res.status(400).send('Brand ID is required');
      return;
    }

    let parsedDescription, parsedShortDescription = null;

    try {
      parsedDescription = JSON.parse(description);
      if (shortDescription) {
        parsedShortDescription = JSON.parse(shortDescription);
      }
    } catch (error) {
      res.status(400).send('Invalid description or shortDescription format. Must be valid JSON strings.');
      return;
    }

    // Extract optional parameters with defaults
    const startXCoordinate = req.body.startXCoordinate ? parseInt(req.body.startXCoordinate, 10) : 2;
    const startYCoordinate = req.body.startYCoordinate ? parseInt(req.body.startYCoordinate, 10) : 2;
    const numberOfCodes = req.body.numberOfCodes ? parseInt(req.body.numberOfCodes, 10) : null;

    // Determine upload type and handle accordingly
    try {
      let result;

      if (req.file) {
        // CSV upload
        result = await uploadCsvCodes(
          req.file,
          brandId,
          parsedDescription,
          parsedShortDescription,
          expirationDate,
          startXCoordinate,
          startYCoordinate,
          numberOfCodes
        );
      } else {
        // Individual code upload
        const numCodes = parseInt(numberOfCodes) || 1;
        result = await uploadGeneralCodes(
          code,
          numCodes,
          brandId,
          parsedDescription,
          parsedShortDescription,
          expirationDate
        );
      }

      res.status(200).json(result);
    } catch (error) {
      console.error('Error processing deal codes:', error);
      res.status(400).json(error.message || 'Error processing deal codes');
    }
  } catch (error) {
    console.error('Error uploading deal codes:', error);
    res.status(500).send('Server error while uploading deal codes');
  }
});

router.get('/brands', [authenticate], async (req, res) => {
  try {
    if (req.user?.isAdmin !== 'true') {
      res.status(403).send('User is not an admin');
      return;
    }

    const brandsWithGroups = await prisma.brands.findMany({
      include: {
        dealCodeGroups: {
          include: {
            _count: {
              select: {
                dealCodes: true
              }
            },
            dealCodes: {
              select: {
                userId: true
              }
            }
          }
        }
      }
    });

    const formattedBrands = brandsWithGroups.map(brand => ({
      id: brand.id,
      name: brand.name,
      groups: brand.dealCodeGroups.map(group => ({
        id: group.id,
        description: group.description,
        shortDescription: group.shortDescription,
        generalExpireDate: group.generalExpireDate,
        codesState: group.codesState,
        totalDealcodes: group._count.dealCodes,
        assignedDealcodes: group.dealCodes.filter(code => code.userId !== null).length,
        notAssignedDealcodes: group.dealCodes.filter(code => code.userId === null).length,
        usedDealcodes: group.dealCodes.filter(code => code.isUsed == true).length
      }))
    }));

    res.status(200).json(formattedBrands);
  } catch (error) {
    console.error('Error fetching brands and deal code groups:', error);
    res.status(500).send('Server error while fetching brands and deal code groups');
  }
});

router.post('/shopify-webhook', async (req, res) => {
  try {
    const shopDomain = req.get('X-Shopify-Shop-Domain');

    // Fetch the brand from the database based on the shopDomain
    const brand = await prisma.brands.findFirst({
      where: {
        shopifyDomain: shopDomain
      },
      select: {
        id: true,
        shopifyKeyName: true,
        name: true
      }
    });

    if (!brand || !brand.shopifyKeyName) {
      res.status(403).send('Invalid shop domain or missing secret key');
      return;
    }

    const shopifyApiSecret = process.env[`SHOPIFY_API_SECRET_${brand.shopifyKeyName}`];
    if (!shopifyApiSecret) {
      res.status(500).send('Configuration error: API secret not found');
      return;
    }

    // Verify Shopify webhook
    const hmac = req.get('X-Shopify-Hmac-Sha256');
    const body = req.body;
    const hash = crypto
      .createHmac('sha256', shopifyApiSecret)
      .update(body)
      .digest('base64');

    if (hash !== hmac) {
      res.status(403).send('Invalid webhook signature');
      return;
    }

    const data = JSON.parse(body);
    const discountCodes = data.discount_codes || [];
    const usedDealCodes = [];

    // Process discount codes and collect used ones
    for (const discount of discountCodes) {
      const dealCode = await prisma.deal_codes.findFirst({
        where: {
          code: discount.code,
          isUsed: false,
          brandId: brand.id
        }
      });

      if (dealCode) {
        await prisma.deal_codes.update({
          where: { id: dealCode.id },
          data: { isUsed: true }
        });
        usedDealCodes.push(discount.code);
      }
    }

    // Create order history record
    await prisma.order_history.create({
      data: {
        brandId: brand.id,
        brandName: brand.name,
        dealCodes: usedDealCodes,
        orderJson: data
      }
    });

    res.status(200).send('Shopify webhook processed successfully');
  } catch (error) {
    console.error('Error processing Shopify webhook:', error);
    res.status(500).send('Server error while processing webhook');
  }
});


router.put('/groups/:groupId', [authenticate], async (req, res) => {
  try {
    if (req.user?.isAdmin !== 'true') {
      res.status(403).send('User is not an admin');
      return;
    }

    const { groupId } = req.params;
    const { description, shortDescription } = req.body;

    if (!groupId) {
      res.status(400).send('Group ID is required');
      return;
    }

    let parsedDescription, parsedShortDescription;

    try {
      parsedDescription = JSON.parse(description);
      if (shortDescription) {
        parsedShortDescription = JSON.parse(shortDescription);
      }
    } catch (error) {
      console.log('Error parsing JSON:', error);
      res.status(400).send('Invalid description or shortDescription format. Must be valid JSON strings.');
      return;
    }

    const updatedGroup = await prisma.deal_code_groups.update({
      where: { id: groupId },
      data: {
        description: parsedDescription,
        shortDescription: parsedShortDescription || null,
      },
    });

    res.status(200).json({
      message: 'Group details updated successfully',
      group: updatedGroup,
    });
  } catch (error) {
    console.error('Error updating group details:', error);
    res.status(500).send('Server error while updating group details');
  }
});

router.delete('/groups/:groupId', [authenticate], async (req, res) => {
  try {
    if (req.user?.isAdmin !== 'true') {
      res.status(403).send('User is not an admin');
      return;
    }

    const { groupId } = req.params;

    if (!groupId) {
      res.status(400).send('Group ID is required');
      return;
    }

    // Start a transaction to ensure all operations are atomic
    const result = await prisma.$transaction(async (prisma) => {
      // Delete all deal codes associated with the group
      await prisma.deal_codes.deleteMany({
        where: {
          groupId: groupId
        }
      });

      // Delete the group itself
      const deletedGroup = await prisma.deal_code_groups.delete({
        where: { id: groupId }
      });

      return deletedGroup;
    });

    if (!result) {
      res.status(404).json({ message: 'Group not found' });
      return;
    }

    res.status(200).json({
      message: 'Dealcode group and associated codes deleted successfully',
      deletedGroup: result
    });
  } catch (error) {
    console.error('Error deleting dealcode group:', error);
    res.status(500).send('Server error while deleting dealcode group');
  }
});

module.exports = {
  path: '/deal-codes',
  router,
};
