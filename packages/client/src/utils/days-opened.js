import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'daysOpened';
/**
 * Check how many days the user has opened the app
 */
export async function checkDaysOpened() {
  try {
    const previousValue = await AsyncStorage.getItem(KEY);
    if (!previousValue) {
      return 0;
    }
    return parseInt(previousValue);
  } catch (error) {
    console.error('Error checking days opened:', error);
    return null;
  }
};

export async function addDaysOpened() {
  try {
    const previousValue = await AsyncStorage.getItem(KEY);
    if (!previousValue) {
      await AsyncStorage.setItem(KEY, '1');
      return;
    }
    const newValue = parseInt(previousValue) + 1;
    await AsyncStorage.setItem(KEY, newValue.toString());
  } catch (error) {
    console.error('Error adding days opened:', error);
  }
};

export async function resetDaysOpened() {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch (error) {
    console.error('Error resetting days opened:', error);
  }
}


