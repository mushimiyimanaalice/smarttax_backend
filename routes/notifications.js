const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const pushService = require('../services/pushService');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.get('/preferences', notificationController.getPreferences);
router.put('/preferences', notificationController.updatePreferences);
router.patch('/:id/read', notificationController.markRead);
router.patch('/read-all', notificationController.markAllRead);
router.post('/seed', notificationController.seed);

router.get('/vapid-public-key', (req, res) => {
  const key = pushService.getVapidDetails();
  res.json({ publicKey: key || null });
});

router.post('/push-subscribe', async (req, res) => {
  try {
    const { subscription, userAgent } = req.body;
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ message: 'Invalid subscription' });
    }
    await pushService.saveSubscription(req.user._id, subscription, userAgent);
    res.status(201).json({ message: 'Subscribed to push notifications' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/push-unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (endpoint) await pushService.removeSubscription(endpoint);
    res.json({ message: 'Unsubscribed from push notifications' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
