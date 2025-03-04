const prisma = require('../../prisma');

/**
 * Get the benefits of all the levels lower than the provided one
 * @param {Number} levelId - The level id
 * @returns {Array} The array of benefits
 */
async function getLevelBenefits(levelId) {
  let benefits = [];
  const levels = await prisma.levels.findMany({
    include: {
      benefits: {
        include: {
          level: true,
        }
      },
    },
  });
  const currentLevel = levels.find((level) => level.id === levelId);
  if (currentLevel) {
    benefits = levels.reduce((acc, level) => {
      if (currentLevel.order >= level.order) {
        return acc.concat(level.benefits);
      }
      return acc;
    }, []);
  }
  return benefits;
}

/**
 * Get the benefits of the next level
 * @param {Number} levelId - The current level id
 * @returns {Array} The array of benefits
 */
async function getNextLevelBenefits(levelId) {
  const levels = await prisma.levels.findMany({
    include: {
      benefits: {
        include: {
          level: true,
        }
      },
    },
  });
  const currentLevel = levels.find((level) => level.id === levelId);
  if (currentLevel) {
    const nextLevel = levels.find(
      (level) => level.order === currentLevel.order + 1,
    );
    if (nextLevel) {
      return nextLevel.benefits;
    }
  }
  return [];
}

module.exports = {
  getLevelBenefits,
  getNextLevelBenefits,
};