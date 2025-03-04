import { Platform, Alert } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import { useDispatch } from 'react-redux';
import { registerNotificationsToken, unregisterNotificationsToken } from '../store/models/users';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const useNotifications = () => {
  const dispatch = useDispatch();

  async function unregisterForPushNotifications() {
    try {
      await Notifications.unregisterForNotificationsAsync();
      await dispatch(unregisterNotificationsToken()).unwrap();
    } catch (e) {
      alert(`Error unregistering for push notifications: ${e}`);
    }
  }

  async function askAndRegisterForPushNotifications() {
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        handleRegistrationError('Please enable push notifications for ledge in your device settings');
        return false;
      }
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      if (!projectId) {
        handleRegistrationError('Project ID not found');
        return false;
      }
      try {
        const pushTokenString = (
          await Notifications.getExpoPushTokenAsync({
            projectId,
          })
        ).data;
        // save token to server
        await dispatch(registerNotificationsToken({ token: pushTokenString })).unwrap();
        return true;
      } catch (e) {
        handleRegistrationError(`${e}`);
      }
    } else {
      return false;
    }
    return false;
  }

  async function checkNotificationsPermission() {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }

  async function openSettings() {
    const bundleIdentifier = Constants?.expoConfig?.ios?.bundleIdentifier ?? 'ledge';
    if (Platform.OS === 'ios') {
      await Linking.openURL(`App-Prefs:NOTIFICATIONS_ID&path=${bundleIdentifier}`);
    } else {
      await Linking.openSettings();
    }
  }

  function handleRegistrationError(errorMessage) {
    Alert.alert('Could not enable notifications', errorMessage);
  }

  return { 
    askAndRegisterForPushNotifications, 
    unregisterForPushNotifications,
    openSettings,
    checkNotificationsPermission,
  };

};

export { useNotifications };