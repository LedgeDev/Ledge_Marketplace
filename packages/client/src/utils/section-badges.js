import AsyncStorage from '@react-native-async-storage/async-storage';

const validSections = ['forYou', 'browse', 'myFavourites', 'myDeals', 'news', 'questionnaire', 'myBenefits'];

// to restore the arrays, to be used in the logout
const resetItems = async (section) => {
  if (section) {
    if (!validSections.includes(section)) {
      return;
    }
    await AsyncStorage.removeItem(`${section}:newItems`);
    return;
  }
  await AsyncStorage.multiRemove(validSections.map(section => `${section}:newItems`));
}

export {
  resetItems,
}