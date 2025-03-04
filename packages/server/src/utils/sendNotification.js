const { Expo } = require('expo-server-sdk');
const prisma = require('../prisma');

let expo = new Expo();

// For individual/personalized notifications
async function sendNotification({ userId, token, title, message, type, entityId }) {
  if (!Expo.isExpoPushToken(token)) {
    console.error(`Push token ${token} is not a valid Expo push token`);
    return;
  }

  try {

    // Then create the notification history record
    await prisma.push_notification_history.create({
      data: {
        userId,
        type,
        entityId,
        content: message,
        title,
      }
    });

    await expo.sendPushNotificationsAsync([{
      to: token,
      sound: 'default',
      title: title,
      body: message
    }]);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

// For global notifications
async function sendGlobalNotification(tokens, { title, message }) {
  try {
    const messages = tokens
      .filter(token => Expo.isExpoPushToken(token))
      .map(token => ({
        to: token,
        sound: 'default',
        title,
        body: message
      }));

    if (messages.length === 0) {
      console.error('No valid tokens provided');
      return;
    }

    // Use chunking for multiple devices
    const chunks = expo.chunkPushNotifications(messages);

    // Send all notifications
    for (let chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }

  } catch (error) {
    console.error('Error sending global notification:', error);
    throw error;
  }
}

module.exports = { sendNotification, sendGlobalNotification };
