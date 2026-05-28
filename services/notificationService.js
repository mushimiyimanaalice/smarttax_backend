const Notification = require('../models/Notification');
const User = require('../models/User');
const { getMessage } = require('../utils/notificationMessages');
const { sendSms } = require('./smsService');
const { sendPushToUser } = require('./pushService');

let ioInstance = null;

const setSocketIO = (io) => {
  ioInstance = io;
};

const getPreferredLanguage = (user) =>
  user?.preferredLanguage || user?.language || 'en';

const createNotification = async ({
  userId,
  businessId,
  type,
  title,
  message,
  language,
  metadata,
}) => {
  const notification = await Notification.create({
    userId,
    businessId,
    type,
    title: title || 'SmartTax',
    message,
    language: language || 'en',
    metadata,
  });

  if (ioInstance) {
    ioInstance.to(`user:${userId}`).emit('notification', notification);
  }

  sendPushToUser(userId, title || 'SmartTax', message, metadata?.url || '/notifications').catch(() => {});

  return notification;
};

const notifyUser = async (userId, type, overrides = {}) => {
  const user = await User.findById(userId);
  if (!user) return null;

  const lang = getPreferredLanguage(user);
  const template = getMessage(type, lang);

  return createNotification({
    userId,
    businessId: overrides.businessId,
    type,
    title: overrides.title || template.title,
    message: overrides.message || template.message,
    language: overrides.language || template.language,
    metadata: overrides.metadata,
  });
};

const notifyBusinessOwner = async (ownerId, type, businessId, extra = {}) => {
  const notification = await notifyUser(ownerId, type, { businessId, ...extra });
  const user = await User.findById(ownerId);
  if (user?.phoneNumber && extra.sendSms !== false) {
    const lang = getPreferredLanguage(user);
    const { message } = getMessage(type, lang);
    await sendSms(user.phoneNumber, message);
  }
  return notification;
};

module.exports = {
  setSocketIO,
  createNotification,
  notifyUser,
  notifyBusinessOwner,
  getPreferredLanguage,
};
