const prisma = require('../src/prisma');
const config = require('config');
const { sendNotification } = require('../src/utils/sendNotification');
const { addDays, differenceInDays, startOfMonth } = require('date-fns');
const { getQuestionnaireAnswerCount } = require('./utils');
const { getBrandsToRotate } = require('../src/utils/brandFeeds');

const NotificationType = {
  QUESTIONS_AWAY: 'QUESTIONS_AWAY',
  BRANDS_AWAY: 'BRANDS_AWAY',
  PRODUCT_FEEDBACK: 'PRODUCT_FEEDBACK',
  COMEBACK_REMINDER: 'COMEBACK_REMINDER',
  EXPIRING_DEALS: 'EXPIRING_DEALS',
  NEW_BRANDS: 'NEW_BRANDS'
};

// Helper function to replace notifications templates variables
function replaceTemplateVariables(template, variables) {
  let content = template;
  for (const [key, value] of Object.entries(variables)) {
    content = content.replace(`<${key}>`, value || '');
  }
  return content;
}

// Helper functions for notification checks
const notificationHelpers = {
  hasReceivedToday: (user) => {
    if (!user.pushNotificationHistory) return false;
    const today = new Date();
    return user.pushNotificationHistory.some(notification =>
      differenceInDays(today, new Date(notification.sentAt)) < 1
    );
  },

  hasReceivedNotificationType: (user, notificationType, entityId = null) => {
    if (!user.pushNotificationHistory) return false;
    return user.pushNotificationHistory.some(notification =>
      notification.type === notificationType &&
      (!entityId || notification.entityId === entityId)
    );
  },

  getDaysInactive: (user) => {
    if (!user.lastOpened) return 0;
    return differenceInDays(new Date(), new Date(user.lastOpened));
  },

  getMonthlyNotificationCount: (user) => {
    if (!user.pushNotificationHistory) return 0;
    const monthStart = startOfMonth(new Date());
    return user.pushNotificationHistory.filter(notification =>
      new Date(notification.sentAt) >= monthStart
    ).length;
  },

  canReceiveNotification: (user, type, settings, entityId = null) => {
    if (notificationHelpers.hasReceivedToday(user)) return false;

    if (!settings) return false;

    if (settings.oneTimeOnly && notificationHelpers.hasReceivedNotificationType(user, type, entityId)) {
      return false;
    }

    // Check if user is inactive (30+ days) and has reached monthly limit
    const daysInactive = notificationHelpers.getDaysInactive(user);
    if (daysInactive >= 30) {
      const monthlyCount = notificationHelpers.getMonthlyNotificationCount(user);
      if (monthlyCount >= 2) return false;
    }

    return true;
  }
};

// Create notification checkers factory with settings
function createNotificationCheckers(notificationSettings) {
  return {
    checkQuestionsAway: async (user) => {
      const settings = notificationSettings[NotificationType.QUESTIONS_AWAY];
      if (!notificationHelpers.canReceiveNotification(user, NotificationType.QUESTIONS_AWAY, settings)) {
        return null;
      }

      const daysInactive = notificationHelpers.getDaysInactive(user);
      if (daysInactive < settings.minDaysInactive) {
        return null;
      }

      const userLevel = await prisma.levels.findUnique({
        where: { id: user.levelId },
        include: { questionnaire: true }
      });

      if (!userLevel) return null;

      const nAnswersResponded = await getQuestionnaireAnswerCount(user.id);
      const remainingQuestions = userLevel.requiredAnswers - nAnswersResponded;
      const remainingBrands = userLevel.requiredBrandsExplored - user.brandsExplored;

      if (remainingQuestions > 0 && remainingBrands <= 0) {
        const variables = {
          questions: remainingQuestions.toString(),
          level: userLevel.name
        };

        return {
          type: NotificationType.QUESTIONS_AWAY,
          title: replaceTemplateVariables(settings.title, variables),
          message: replaceTemplateVariables(settings.content, variables)
        };
      }

      return null;
    },

    checkBrandsAway: async (user) => {
      const settings = notificationSettings[NotificationType.BRANDS_AWAY];
      if (!notificationHelpers.canReceiveNotification(user, NotificationType.BRANDS_AWAY, settings)) {
        return null;
      }

      const daysInactive = notificationHelpers.getDaysInactive(user);
      if (daysInactive < settings.minDaysInactive) {
        return null;
      }

      const userLevel = await prisma.levels.findUnique({
        where: { id: user.levelId },
        include: { questionnaire: true }
      });

      if (!userLevel) return null;

      const nAnswersResponded = await getQuestionnaireAnswerCount(user.id);
      const remainingQuestions = userLevel.requiredAnswers - nAnswersResponded;
      const remainingBrands = userLevel.requiredBrandsExplored - user.brandsExplored;

      if (remainingBrands > 0 && remainingQuestions <= 0) {
        const variables = {
          brands: remainingBrands.toString(),
          level: userLevel.name
        };

        return {
          type: NotificationType.BRANDS_AWAY,
          title: replaceTemplateVariables(settings.title, variables),
          message: replaceTemplateVariables(settings.content, variables)
        };
      }

      return null;
    },

    checkProductFeedback: async (user) => {
      const settings = notificationSettings[NotificationType.PRODUCT_FEEDBACK];
      if (!settings) return null;

      const dateThreshold = addDays(new Date(), -settings.daysAfterActivation);

      const activatedCodes = await prisma.deal_codes.findMany({
        where: {
          userId: user.id,
          isUsed: true,
          updatedAt: {
            lte: dateThreshold
          }
        },
        include: {
          group: {
            include: {
              brand: true
            }
          }
        }
      });

      for (const code of activatedCodes) {
        if (!code.group?.brandId) {
          continue;
        }

        if (!notificationHelpers.canReceiveNotification(user, NotificationType.PRODUCT_FEEDBACK, settings, code.group.brandId)) {
          continue;
        }

        const variables = {
          brand: code.group.brand.name,
          founder: code.group.brand.founders?.[0]?.name || ''
        };

        return {
          type: NotificationType.PRODUCT_FEEDBACK,
          entityId: code.group.brandId,
          title: replaceTemplateVariables(settings.title, variables),
          message: replaceTemplateVariables(settings.content, variables)
        };
      }

      return null;
    },

    checkComebackReminder: async (user) => {
      const settings = notificationSettings[NotificationType.COMEBACK_REMINDER];
      if (!notificationHelpers.canReceiveNotification(user, NotificationType.COMEBACK_REMINDER, settings)) {
        return null;
      }

      const daysInactive = notificationHelpers.getDaysInactive(user);

      if (daysInactive >= settings.minDaysInactive) {
        const lastReminder = user.pushNotificationHistory?.find(
          n => n.type === NotificationType.COMEBACK_REMINDER
        );

        if (!lastReminder || differenceInDays(new Date(), new Date(lastReminder.sentAt)) >= settings.repeatAfterDays) {
          return {
            type: NotificationType.COMEBACK_REMINDER,
            title: settings.title,
            message: settings.content
          };
        }
      }

      return null;
    },

    checkExpiringDeals: async (user) => {
      const settings = notificationSettings[NotificationType.EXPIRING_DEALS];
      if (!settings) return null;

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const expiryDate = addDays(startOfDay, settings.daysBeforeExpiry);

      const expiringCodes = await prisma.deal_codes.findMany({
        where: {
          userId: user.id,
          isUsed: false,
          userExpireDate: {
            lte: expiryDate
          },
        },
        include: {
          group: {
            include: {
              brand: true
            }
          }
        }
      });

      for (const code of expiringCodes) {
        if (!code.group?.brand || !notificationHelpers.canReceiveNotification(user, NotificationType.EXPIRING_DEALS, settings, code.id)) {
          continue;
        }

        const variables = {
          brand: code.group.brand.name
        };

        return {
          type: NotificationType.EXPIRING_DEALS,
          entityId: code.id,
          title: replaceTemplateVariables(settings.title, variables),
          message: replaceTemplateVariables(settings.content, variables)
        };
      }

      return null;
    },

    checkNewBrands: async (user) => {
      const settings = notificationSettings[NotificationType.NEW_BRANDS];
      if (!settings) return null;

      const daysInactive = notificationHelpers.getDaysInactive(user);
      if (daysInactive < settings.sendAfterInactiveDays) {
        return null;
      }
      
      const brandsToRotate = getBrandsToRotate(user);
      if (brandsToRotate.length === 0 || user.forYouBrandsPoolIds.length === 0) {
        return null;
      }

      if (!notificationHelpers.canReceiveNotification(user, NotificationType.NEW_BRANDS, settings)) {
        return null;
      }

      return {
        type: NotificationType.NEW_BRANDS,
        title: settings.title,
        message: settings.content
      };
    }
  };
}

async function getNotificationsForUsers(users, notificationCheckers) {
  const notifications = [];

  for (const user of users) {
    if (notificationHelpers.hasReceivedToday(user)) continue;

    // Prioritize notifications for inactive users
    const daysInactive = notificationHelpers.getDaysInactive(user);
    const isInactive = daysInactive >= 30;

    // For inactive users, prioritize COMEBACK_REMINDER and NEW_BRANDS
    const notificationChecks = isInactive ? [
      notificationCheckers.checkComebackReminder,
      notificationCheckers.checkNewBrands,
      notificationCheckers.checkExpiringDeals,
      notificationCheckers.checkProductFeedback,
      notificationCheckers.checkQuestionsAway,
      notificationCheckers.checkBrandsAway
    ] : [
      notificationCheckers.checkQuestionsAway,
      notificationCheckers.checkBrandsAway,
      notificationCheckers.checkProductFeedback,
      notificationCheckers.checkComebackReminder,
      notificationCheckers.checkExpiringDeals,
      notificationCheckers.checkNewBrands
    ];

    try {
      for (const check of notificationChecks) {
        const notification = await check(user);
        if (notification) {
          notifications.push({
            userId: user.id,
            token: user.notificationsToken,
            ...notification
          });
          break;
        }
      }
    } catch (error) {
      console.error(`Error processing notifications for user ${user.id}:`, error);
    }
  }

  return notifications;
}

async function pushNotifications() {
  try {
    // Fetch all notification settings at once and organize by type
    const allNotificationSettings = await prisma.push_notifications.findMany();
    const notificationSettings = Object.values(NotificationType).reduce((acc, type) => {
      const notification = allNotificationSettings.find(n => n.type === type);
      if (notification) {
        acc[type] = notification;
      }
      return acc;
    }, {});

    // Create notification checkers with settings
    const notificationCheckers = createNotificationCheckers(notificationSettings);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const usersWithToken = await prisma.users.findMany({
      where: {
        AND: [
          {
            notificationsToken: {
              not: null
            }
          },
          {
            OR: [
              {
                lastOpened: null
              },
              {
                lastOpened: {
                  gte: thirtyDaysAgo
                }
              }
            ]
          }
        ]
      },
      select: {
        id: true,
        notificationsToken: true,
        lastOpened: true,
        levelId: true,
        brandsExplored: true,
        pushNotificationHistory: true,
        // fields necessary for getBrandsToRotate
        forYouBrands: true,
        forYouBrandsPoolIds: true,
        contentViews: {
          where: {
            section: {
              in: ['forYou', 'brandProfile']
            },
            contentType: 'brand',
          }
        }
      }
    });

    const notificationsForUsers = await getNotificationsForUsers(usersWithToken, notificationCheckers);

    for (const notification of notificationsForUsers) {
      try {
        await sendNotification(notification);
      } catch (error) {
        console.error(`Error sending notification to user ${notification.userId}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in pushNotifications:', error);
    throw error;
  }
}

module.exports = pushNotifications;
