const prisma = require('../../prisma');
const config = require('config');

let srtParser2;

const srtTimeToSeconds = (srtTime) => {
  const time = srtTime.split(':');
  const hours = parseInt(time[0]);
  const minutes = parseInt(time[1]);
  const seconds = parseFloat(time[2].replace(',', '.'));
  return hours * 3600 + minutes * 60 + seconds;
};

const secondsToSrtTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  // make hours string with 2 digits
  const hoursStr = hours.toString().padStart(2, '0');
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);
  // make minutes string with 2 digits
  const minutesStr = minutes.toString().padStart(2, '0');
  seconds %= 60;
  // make seconds string with 2 digits and 3 decimal places, separated by comma
  const secondsStr = seconds.toFixed(3).padStart(6, '0').replace('.', ',');
  return `${hoursStr}:${minutesStr}:${secondsStr}`;
};

/**
 * Converts an array of caption objects to an srt string
 * @param {Array} captions - array of caption objects with start, end and text properties
 * @returns {string} - the srt string
 */
const captionsToSrt = async (captions) => {
  const module = await import('srt-parser-2');
  srtParser2 = module.default;
  const parser = new srtParser2();
  const srtArray = captions.map((caption, index) => {
    return {
      id: index + 1,
      startTime: secondsToSrtTime(caption.start),
      endTime: secondsToSrtTime(caption.end),
      text: caption.text,
    };
  });
  let parsed = parser.toSrt(srtArray);
  return parsed;
};

/**
 * Converts an srt string to an array of caption objects
 * @param {string} srt - the srt string to convert
 * @returns {Array} - an array of caption objects with start, end and text properties
 */
const srtToCaptions = async (srt) => {
  const module = await import('srt-parser-2');
  srtParser2 = module.default;
  const parser = new srtParser2();
  let parsed = parser.fromSrt(srt);
  parsed = parsed.map((caption) => {
    return {
      start: srtTimeToSeconds(caption.startTime),
      end: srtTimeToSeconds(caption.endTime),
      text: caption.text,
    };
  });
  return parsed;
};

/**
 * Sorts the brands of a week so that the brands that the user has unlocked are at the end
 * @param {Object} user - user object
 * @returns {Array} - array of brand objects sorted by locked and unlocked brands
 */

/**
 * updates the products of a brand with the same id, or creates them if they don't exist
 * @param {Array} products - array of product objects, sent in the request body
 * @param {String} brandId - id of the brand to which the products belong
 */
const updateProducts = async (products, brandId) => {
  await Promise.all(
    products.map((product) => {
      // remove id and brandId from product object since they shouldn't be directly modified
      const productId = product.id ? product.id : '000000000000000000000000';
      delete product.id;
      delete product.brandId;
      return prisma.products.upsert({
        where: {
          id: productId,
        },
        create: {
          ...product,
          brand: {
            connect: {
              id: brandId,
            },
          },
        },
        update: {
          ...product,
        },
      });
    }),
  );
};

/**
 * deletes all products that are not in the new list
 * @param {Array} newProducts - array of product objects, sent in the request body
 * @param {String} brandId - id of the brand to which the products belong
 * @returns {Object} - object containing the result of the delete query
 */
const deleteNonExistentProducts = async (newProducts, brandId) => {
  // get the id's of the new products, only the ones that have an id
  const newProductsIds = newProducts
    .filter((product) => product.id)
    .map((product) => product.id);
  const deletedProducts = await prisma.products.deleteMany({
    where: {
      brandId: brandId,
      NOT: {
        id: {
          in: newProductsIds,
        },
      },
    },
  });
  return deletedProducts;
};

/**
 * Gets the interaction label of a user with a brand
 * @param {Array} brands - brands to add the label to, must include questions
 * @param {String} userId - id of the user
 * @returns {Object} - the interaction label, with an id and a value if necessary
 */
const addInteractionLabels = async (brands, userId) => {
  const user = await prisma.users.findUnique({
    where: {
      id: userId,
    },
    include: {
      answers: true,
      dealCodes: {
        include: {
          group: true,
        }
      }
    }
  });
  const products = await prisma.products.findMany({
    where: {
      brandId: {
        in: brands.map((brand) => brand.id),
      },
    },
  });
  brands.forEach((brand) => {
    const userMyFavouritesEntry = user.myFavourites.find(
      (myFavourite) => myFavourite.brandId === brand.id,
    );
    const userMyDealsEntry = user.dealCodes.find(
      (dc) => dc.group.brandId === brand.id,
    );

    // Give feedback: if code has been used and 14 days have passed and user has not
    // answered product feedback. Only for myFavourites
    if (userMyFavouritesEntry) {
      const userProductFeedbackAnswered = user.answers.some(
        (answer) =>
          config.get('productFeedbackQuestionIds').includes(answer.questionId)
          && answer.productFeedbackBrandId === brand.id
      );
      const dealCode = user.dealCodes.find((dc) => dc.group.brandId === brand.id);
      if (
        dealCode &&
        dealCode.isUsed &&
        new Date(dealCode.updatedAt) < new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) &&
        !userProductFeedbackAnswered
      ) {
        brand.interactionLabel = { id: 'feedback' };
        return;
      }

      // New updates: if the brand or its products have been updated since the user added it to favourites.
      const brandProducts = products.filter((product) => product.brandId === brand.id);
      if (
        brandProducts.some((product) =>
          new Date(product.updatedAt) > new Date(userMyFavouritesEntry.addedAt)
          || new Date(product.createdAt) > new Date(userMyFavouritesEntry.addedAt)
        )
      ) {
        brand.interactionLabel = { id: 'update' };
        return;
      }

      // Redeem your deal: if the user has a deal code for the brand that hasn't been used yet.
      const brandDealCode = user.dealCodes.find((dc) => dc.group.brandId === brand.id);
      if (brandDealCode && !brandDealCode.isUsed) {
        brand.interactionLabel = { id: 'redeem' };
        return;
      }
    } else if (userMyDealsEntry) {
      // labels only for myDeals
      // Time left: time left for deal to expire. Only for myDeals
      if (userMyDealsEntry.userExpireDate) {
        const timeLeft = new Date(userMyDealsEntry.userExpireDate) - Date.now();
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        if (days < 0) return;
        brand.interactionLabel = { id: 'daysLeft', data: days };
      }
      return;
    }
  });
}

function mapGenderToEnum(gender) {
  switch (gender.toLowerCase()) {
    case "men's":
    case "men":
      return "men";
    case "women's":
    case "women":
      return "women";
    case "both":
      return "both";
    default:
      return "other";
  }
}
const addRatings = async (brands) => {
  const brandIds = brands.map((brand) => brand.id);
  const dbBrands = await prisma.brands.findMany({
    where: {
      id: {
        in: brandIds,
      },
    },
    include: {
      ratings: true,
    },
  });
  if (brands.length !== dbBrands.length) {
    console.error('addRatings: Not all brands were found in the database');
  }
  for (let i = 0; i < brands.length; i++) {
    const brand = brands[i];
    const dbBrand = dbBrands[i];
    if (brand && dbBrand) {
      const ratingAvg = dbBrand.ratings.reduce((acc, rating) => acc + rating.rating, 0) / dbBrand.ratings.length;
      brand.rating = Math.round(ratingAvg);
    }
  }
};

const searchBrandIds = async (query, language = 'en') => {

  // Sanitize the search query
  const sanitizedQuery = query.trim();
  if (!sanitizedQuery) {
    return [];
  }

  try {
    const searchConditions = [
      // Name search
      { name: { $regex: sanitizedQuery, $options: "i" } },
    ];

    // Add description search based on specified language
    if (language === 'en' || language === 'all') {
      searchConditions.push({ "description.en": { $regex: sanitizedQuery, $options: "i" } },);
    }

    if (language === 'de' || language === 'all') {
      searchConditions.push({ "description.de": { $regex: sanitizedQuery, $options: "i" } });
    }

    const result = await prisma.$runCommandRaw({
      find: "brands",
      filter: {
        $or: searchConditions
      },
      sort: { name: 1 }
    });

    if (result?.ok === 1 && result?.cursor?.firstBatch) {
      return result.cursor.firstBatch.map((brand) => brand._id.$oid); // limited to 101 results
    }

    return [];
  } catch (error) {
    console.error('Brand search error:', error);
    throw new Error('Failed to search brands');
  }
};

module.exports = {
  captionsToSrt,
  srtToCaptions,
  updateProducts,
  deleteNonExistentProducts,
  addInteractionLabels,
  mapGenderToEnum,
  addRatings,
  searchBrandIds,
};
