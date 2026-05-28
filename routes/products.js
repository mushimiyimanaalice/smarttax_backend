// backend/routes/products.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const { businessContext } = require('../middleware/businessContext');

router.use(protect);
router.use(businessContext);

router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);
router.patch('/:id/stock', productController.updateStock);
router.get('/low-stock/alert', productController.getLowStockProducts);

module.exports = router;