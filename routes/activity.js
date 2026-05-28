const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { protect } = require('../middleware/auth');
const { businessContext } = require('../middleware/businessContext');

router.use(protect);

router.get('/inactivity/pending', businessContext, activityController.getMyPendingInactivity);
router.post('/inactivity/report', businessContext, activityController.submitInactivityReport);

module.exports = router;
