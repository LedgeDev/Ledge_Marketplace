import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'questionnaireAvailable';

/**
 * Check if there are questions not answered in the questionnaire
 * according to the async storage
 */
export async function checkQuestionnaireAvailable() {
  try {
    const value = await AsyncStorage.getItem(KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error checking questionnaire available:', error);
    return false;
  }
};

export async function setQuestionnaireAvailable(value) {
  try {
    if (value) {
      await AsyncStorage.setItem(KEY, 'true');
      return;
    }
    await AsyncStorage.setItem(KEY, 'false');
  } catch (error) {
    console.error('Error setting questionnaire available:', error);
    return;
  }
};

export async function resetQuestionnaireAvailable() {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch (error) {
    console.error('Error resetting questionnaire available:', error);
  }
}
