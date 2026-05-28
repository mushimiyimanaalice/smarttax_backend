const DailyActivity = require('../models/DailyActivity');
const Sale = require('../models/Sale');
const TaxTransaction = require('../models/TaxTransaction');
const Business = require('../models/Business');
const { isBusinessActive } = require('../utils/geoScope');
const { notifyUser } = require('./notificationService');

const startOfDay = (d = new Date()) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const trackLogin = async (userId, businessId) => {
  const date = startOfDay();
  await DailyActivity.findOneAndUpdate(
    { userId, businessId, date },
    { $set: { loggedIn: true } },
    { upsert: true, new: true }
  );
};

const trackSale = async (businessId) => {
  const date = startOfDay();
  const business = await Business.findById(businessId);
  if (!business) return;
  await DailyActivity.findOneAndUpdate(
    { userId: business.ownerId, businessId, date },
    { $inc: { salesCount: 1 }, $set: { inactive: false } },
    { upsert: true }
  );
};

const trackTaxActivity = async (businessId) => {
  const date = startOfDay();
  const business = await Business.findById(businessId);
  if (!business) return;
  await DailyActivity.findOneAndUpdate(
    { userId: business.ownerId, businessId, date },
    { $set: { taxActivity: true, inactive: false } },
    { upsert: true }
  );
};

const runInactivityCheck = async () => {
  const date = startOfDay();
  const businesses = await Business.find({
    status: { $in: ['active', 'approved'] },
  });

  for (const business of businesses) {
    const activity = await DailyActivity.findOne({
      userId: business.ownerId,
      businessId: business._id,
      date,
    });

    const salesToday = await Sale.countDocuments({
      businessId: business._id,
      saleDate: { $gte: date },
    });

    const taxToday = await TaxTransaction.countDocuments({
      businessId: business._id,
      createdAt: { $gte: date },
    });

    const loggedIn = activity?.loggedIn;
    const hasActivity = salesToday > 0 || taxToday > 0 || activity?.taxActivity;

    if (loggedIn && !hasActivity) {
      await DailyActivity.findOneAndUpdate(
        { userId: business.ownerId, businessId: business._id, date },
        {
          $set: {
            inactive: true,
            salesCount: salesToday,
            loggedIn: true,
          },
        },
        { upsert: true }
      );

      if (!activity?.inactivityNotified) {
        await notifyUser(business.ownerId, 'inactivity_reminder', {
          businessId: business._id,
        });
        await DailyActivity.updateOne(
          { userId: business.ownerId, businessId: business._id, date },
          { $set: { inactivityNotified: true } }
        );
      }
    }
  }
};

module.exports = {
  startOfDay,
  trackLogin,
  trackSale,
  trackTaxActivity,
  runInactivityCheck,
};
