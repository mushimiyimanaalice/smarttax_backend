const Notification = require('../models/Notification');
const NotificationPreference = require('../models/NotificationPreference');

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.markRead = async (req, res) => {
  try {
    await Notification.updateOne(
      { _id: req.params.id, userId: req.user._id },
      { $set: { read: true } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, read: false },
      { $set: { read: true } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user._id,
      read: false,
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPreferences = async (req, res) => {
  try {
    let prefs = await NotificationPreference.findOne({ userId: req.user._id });
    if (!prefs) {
      prefs = await NotificationPreference.create({ userId: req.user._id });
    }
    res.json(prefs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updatePreferences = async (req, res) => {
  try {
    const prefs = await NotificationPreference.findOneAndUpdate(
      { userId: req.user._id },
      req.body,
      { new: true, upsert: true }
    );
    res.json(prefs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.seed = async (req, res) => {
  try {
    const samples = [
      { type: 'greeting_morning', title: 'Good Morning! ☀️', message: 'Start your day with SmartTax — check your sales dashboard for today\'s updates.' },
      { type: 'greeting_afternoon', title: 'Afternoon Update', message: 'Don\'t forget to file your pending taxes before the deadline.' },
      { type: 'sale_completed', title: 'Sale Completed', message: 'Your recent sale has been recorded successfully. View receipt in your sales history.' },
      { type: 'inventory_low', title: 'Low Stock Alert', message: 'Some of your products are running low. Consider restocking soon.' },
      { type: 'approval_request', title: 'Business Pending Approval', message: 'Your business registration is awaiting sector admin review.' },
    ];
    const notifications = await Notification.insertMany(
      samples.map((s) => ({ ...s, userId: req.user._id }))
    );
    res.status(201).json({ count: notifications.length, notifications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
