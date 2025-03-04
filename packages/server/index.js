const app = require('./src/app');
const { logger } = require('./src/logger');
const { executeDbBackup } = require('./db-backup');
const expireDeals = require('./cronjobs/expire-deals');
const pushNotifications = require('./cronjobs/push-notifications');
const setBrandsFeedbacks = require('./cronjobs/set-brands-feedbacks');
const cron = require('node-cron');

const port = process.env.PORT || 3030;
const host = process.env.HOST || 'localhost';

// Start endpoints
app.listen(port, '0.0.0.0', () => {
  logger.info(`Express app listening on http://${host}:${port}`);
});

// Start app cron jobs

// Execute a db backup every 2 hours
cron.schedule('0 0 */2 * * *', async () => {
  logger.info('Executing MongoDB backup');
  try {
    await executeDbBackup();
  } catch (error) {
    logger.error('Error executing database backup:', error);
  }
});

// Expire user deals every hour
cron.schedule('0 0 */1 * * *', async () => {
  logger.info('Cronjob: Expire User Deals');
  try {
    await expireDeals();
  } catch (error) {
    logger.error('Error expiring user deals:', error);
  }
});

// Send push notifications at 8:30 AM CET and 6:30 PM CET
cron.schedule('30 8,18 * * *', async () => {
  logger.info('Cronjob: Sending Push Notifications');
  try {
    await pushNotifications();
  } catch (error) {
    logger.error('Error sending push notifications:', error);
  }
});

// Reset new brands flag at 12:00 AM CET
cron.schedule('0 0 * * *', async () => {
  logger.info('Cronjob: Resetting New Brands Flag');
  try {
    await resetNewBrandsFlag();
  } catch (error) {
    logger.error('Error resetting new brands flag:', error);
  }
});

// Set brands feedbacks every week
cron.schedule('0 0 * * 0', async () => {
  logger.info('Cronjob: Setting New Brands Feedbacks');
  try {
    await setBrandsFeedbacks();
  } catch (error) {
    logger.error('Error setting new brands feedbacks:', error);
  }
});

