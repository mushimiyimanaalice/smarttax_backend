// backend/routes/invoices.js
const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', invoiceController.getInvoices);
router.get('/stats/summary', invoiceController.getInvoiceStats);
router.get('/download/:invoiceNumber', invoiceController.downloadInvoice);
router.post('/:saleId/generate', invoiceController.generateInvoice);
router.post('/:invoiceNumber/send', invoiceController.sendInvoiceEmail);
router.get('/:invoiceNumber', invoiceController.getInvoiceByNumber);

module.exports = router;