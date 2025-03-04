import AsyncStorage from '@react-native-async-storage/async-storage';

const FIRST_OPEN_KEY = 'lastOpenDate';

export async function checkFirstOpenOfDay() {
  const today = new Date().toISOString().split('T')[0];

  try {
    const lastOpenDate = await AsyncStorage.getItem(FIRST_OPEN_KEY);
    if (lastOpenDate !== today) {
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error checking first open of day:', error);
    return false;
  }
};

export async function setFirstOpenOfDay() {
  try {
    const today = new Date().toISOString().split('T')[0];
    await AsyncStorage.setItem(FIRST_OPEN_KEY, today);
  } catch (error) {
    console.error('Error setting first open of day:', error);
    return false;
  }
};

export async function resetFirstOpenOfDay() {
  try {
    await AsyncStorage.removeItem(FIRST_OPEN_KEY);
  } catch (error) {
    console.error('Error resetting first open of day:', error);
  }
}
