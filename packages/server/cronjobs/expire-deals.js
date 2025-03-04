const prisma = require('../src/prisma');
async function expireDeals() {
  // delete all deal codes that are expired, have been used, and are associated with a user
  await prisma.deal_codes.deleteMany({
    where: {
      userId: {
        not: null,
      },
      userExpireDate: {
        lte: new Date(),
      },
      isUsed: true,
    },
  });
  // disconnect from user all codes that are expired, have NOT been used, and are associated with a user
  await prisma.deal_codes.updateMany({
    where: {
      AND: {
        userId: {
          not: null,
        },
        userExpireDate: {
          lte: new Date(),
        },
        isUsed: false,
      }
    },
    data: {
      userId: null,
      unlockedAt: null,
      userExpireDate: null,
    }
  });
}
module.exports = expireDeals;
