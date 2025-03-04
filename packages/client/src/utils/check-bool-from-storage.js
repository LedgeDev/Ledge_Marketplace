import AsyncStorage from '@react-native-async-storage/async-storage';

export async function checkBoolFromStorage(key) {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value !== "true") {
      await AsyncStorage.setItem(key, "true");
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error checking async storage:', error);
    return false;
  }
};

export async function resetBoolFromStorage(key) {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error resetting async storage item:', error);
    return false;
  }
};

export async function setBoolInStorage(key, value) {
  try {
    await AsyncStorage.setItem(key, value ? "true" : "false");
    return true;
  } catch (error) {
    console.error('Error setting async storage item:', error);
    return false;
  }
};

export async function peekBoolFromStorage(key) {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value !== "true") {
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error peeking async storage:', error);
    return false;
  }
};
