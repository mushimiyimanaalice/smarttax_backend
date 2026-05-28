// backend/routes/taxes.js
const express = require('express');
const router = express.Router();
const taxController = require('../controllers/taxController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/pending', taxController.getPendingTaxes);
router.get('/history', taxController.getTaxHistory);
router.get('/summary', taxController.getTaxSummary);
router.post('/pay/:id', taxController.payTax);
router.post('/mobile-money-pay', taxController.payWithMobileMoney);
router.get('/overdue', taxController.getOverdueTaxes);
router.post('/payment-callback', taxController.mobileMoneyCallback);

module.exports = router;