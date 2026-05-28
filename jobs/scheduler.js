const cron = require('node-cron');
const User = require('../models/User');
const { notifyUser } = require('../services/notificationService');
const { runInactivityCheck } = require('../services/activityService');
const { isBusinessActive } = require('../utils/geoScope');
const Business = require('../models/Business');

let started = false;

const notifyBusinessOwners = async (type) => {
  const owners = await User.find({ role: 'business_owner' });
  for (const owner of owners) {
    const hasActive = await Business.exists({
      ownerId: owner._id,
      status: { $in: ['active', 'approved'] },
    });
    if (hasActive) {
      await notifyUser(owner._id, type);
    }
  }
};

const startSchedulers = () => {
  if (started) return;
  started = true;

  // Morning greetings 6:00–9:00 (run at 6:30 daily)
  cron.schedule('30 6 * * *', () => {
    console.log('[cron] Morning greetings');
    notifyBusinessOwners('greeting_morning').catch(console.error);
  });

  // Afternoon greetings 12:00
  cron.schedule('0 12 * * *', () => {
    console.log('[cron] Afternoon greetings');
    notifyBusinessOwners('greeting_afternoon').catch(console.error);
  });

  // Inactivity check 6:00 PM
  cron.schedule('0 18 * * *', () => {
    console.log('[cron] Inactivity detection');
    runInactivityCheck().catch(console.error);
  });

  console.log('✅ Cron schedulers started (greetings + inactivity)');
};

module.exports = { startSchedulers };
