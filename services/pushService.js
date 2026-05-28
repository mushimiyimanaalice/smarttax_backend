const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

const getVapidDetails = () => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (publicKey && privateKey) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:support@smarttax.rw',
      publicKey,
      privateKey
    );
  }
  return publicKey;
};

const saveSubscription = async (userId, subscription, userAgent) => {
  await PushSubscription.findOneAndUpdate(
    { endpoint: subscription.endpoint },
    { userId, endpoint: subscription.endpoint, keys: subscription.keys, userAgent },
    { upsert: true, new: true }
  );
};

const removeSubscription = async (endpoint) => {
  await PushSubscription.deleteOne({ endpoint });
};

const getUserSubscriptions = async (userId) => {
  return PushSubscription.find({ userId });
};

const sendPushToUser = async (userId, title, message, url) => {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return { sent: 0, total: 0, reason: 'no_vapid' };

  const subs = await getUserSubscriptions(userId);
  if (!subs.length) return { sent: 0, total: 0 };

  if (!webpush.vapidDetails) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:support@smarttax.rw',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  }

  let sent = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys },
        JSON.stringify({ title, message, url: url || '/notifications' })
      );
      sent++;
    } catch (err) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        await removeSubscription(sub.endpoint);
      }
    }
  }
  return { sent, total: subs.length };
};

module.exports = {
  getVapidDetails,
  saveSubscription,
  removeSubscription,
  getUserSubscriptions,
  sendPushToUser,
};
