export const checkBrandUnlocked = (brand) => {
  // we check that some of the dealcode groups contains at least 1 dealcode
  return brand.dealCodeGroups?.some((group) => group.dealCodes?.length > 0);
}

export const filterBrands = (brands, filterOptions, selectedLabels) => {
  const options = {...filterOptions};
  // we select only one option per filter
  Object.keys(options).forEach(key => { 
    options[key] = options[key].options[0]?.value || null;
  });
  const { sortBy, category, labels, gender, values, shipsTo } = options;

  let results = [...brands];

  if (selectedLabels.length > 0) {
    results = results.filter((brand) => 
      brand.labels &&
      (selectedLabels.some(label =>
        brand.labels.some(brandLabel => brandLabel.en === label || brandLabel.de === label)
      ))
    );
  }

  if (sortBy) {
    if (sortBy === 'relevance') {
      // TODO: implement relevance
    } else if (sortBy === 'views') {
      results = results.sort((a, b) => b.unlockHistory.length - a.unlockHistory.length);
    } else if (sortBy === 'likes') {
      // count users that have liked the brand
      results = results.sort((a, b) => b.likes.length - a.likes.length);
    } else if (sortBy === 'rating') {
      results = results.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'latest') {
      results = results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  }

  if (category) {
    results = results.filter((brand) => 
      brand.category && 
      (brand.category.name.en === category || brand.category.name.de === category)
    );
  }

  if (labels) {
    results = results.filter((brand) => 
      brand.labels && 
      (labels.some(label => 
        brand.labels.some(brandLabel => brandLabel.name.en === label || brandLabel.name.de === label)
      ))
    );
  }

  if (gender) {
    results = results.filter((brand) => 
      brand.targetGender === gender
    );
  }

  if (values) {
    // TODO: implement values
  }

  if (shipsTo) {
    // TODO: implement shipsTo
  }

  return results;
}

export const randomizeOrder = (array) => {
  if (!array || !Array.isArray(array)) return array;
  const shuffledArray = [...array];
  for (let i = shuffledArray.length - 1; i > 0; i--) {
      const randomIndex = Math.floor(Math.random() * (i + 1));
      [shuffledArray[i], shuffledArray[randomIndex]] = [shuffledArray[randomIndex], shuffledArray[i]];
  }
  return shuffledArray;
}

export const browseInitialOrder = (brands, user) => {
  const randomBrands = randomizeOrder(brands);
  const showFirstBrands = randomBrands.filter((brand) => brand.showFirst);
  const notShowFirstBrands = randomBrands.filter((brand) => !brand.showFirst);
  const notLikedNotShowFirstBrands = notShowFirstBrands.filter((brand) => !user?.likes?.some(like => like.brandId === brand.id));
  const likedNotShowFirstBrands = notShowFirstBrands.filter((brand) => user?.likes?.some(like => like.brandId === brand.id));
  return [...showFirstBrands, ...notLikedNotShowFirstBrands, ...likedNotShowFirstBrands];
}
