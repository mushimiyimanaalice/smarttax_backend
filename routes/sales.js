// backend/routes/sales.js
const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
const { protect } = require('../middleware/auth');
const { businessContext } = require('../middleware/businessContext');

router.use(protect);
router.use(businessContext);

router.post('/', saleController.createSale);
router.get('/', saleController.getSales);
router.get('/:id', saleController.getSaleById);
router.get('/summary/today', saleController.getTodaySummary);
router.get('/report/monthly', saleController.getMonthlyReport);
router.post('/offline-sync', saleController.syncOfflineSales);
router.get('/pending/sync', saleController.getPendingSyncSales);

module.exports = router;