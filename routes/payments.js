// backend/routes/payments.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/mobile-money/request', paymentController.requestMobileMoneyPayment);
router.post('/mobile-money/confirm', paymentController.confirmMobileMoneyPayment);
router.get('/transactions', paymentController.getPaymentTransactions);
router.get('/balance', paymentController.getPaymentBalance);
router.post('/card/charge', paymentController.processCardPayment);
router.post('/refund/:transactionId', paymentController.refundPayment);

module.exports = router;