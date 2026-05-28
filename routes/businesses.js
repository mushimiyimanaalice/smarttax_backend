// backend/routes/businesses.js
const express = require('express');
const router = express.Router();
const businessController = require('../controllers/businessController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', businessController.getBusinesses);
router.get('/my-business', businessController.getMyBusiness);
router.get('/:id', businessController.getBusinessById);
router.post('/', authorize('business_owner'), businessController.createBusiness);
router.put('/:id', businessController.updateBusiness);
router.get('/:id/stats', businessController.getBusinessStats);
router.post('/:id/approve', authorize('sector_admin', 'district_admin', 'provincial_admin', 'national_admin'), businessController.approveBusiness);
router.get('/:id/tax-summary', businessController.getTaxSummary);

module.exports = router;