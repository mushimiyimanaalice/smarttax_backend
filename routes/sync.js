// backend/routes/sync.js
const express = require('express');
const router = express.Router();
const syncController = require('../controllers/syncController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/sync-data', syncController.syncData);
router.get('/pending-items', syncController.getPendingSyncItems);
router.post('/resolve-conflict', syncController.resolveConflict);
router.post('/force-sync', syncController.forceSync);
router.get('/sync-status', syncController.getSyncStatus);

module.exports = router;