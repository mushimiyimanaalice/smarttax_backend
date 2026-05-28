// backend/controllers/productController.js
const Product = require('../models/Product');
const { notifyUser } = require('../services/notificationService');

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find({
      businessId: req.businessId || req.user.activeBusinessId || req.user.businessId,
      isActive: true 
    }).sort({ createdAt: -1 });
    
    res.json(products);
  } catch (error) {
    console.error('getProducts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      businessId: req.businessId || req.user.activeBusinessId || req.user.businessId
    });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const businessId = req.businessId || req.user.activeBusinessId || req.user.businessId;
    const product = new Product({
      ...req.body,
      businessId
    });
    
    await product.save();

    notifyUser(req.user._id, 'product_created', {
      businessId,
      metadata: { productName: product.name, productId: product._id },
    }).catch((err) => console.error('Product notification error:', err));

    res.status(201).json(product);
  } catch (error) {
    console.error('createProduct error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, businessId: req.user.businessId },
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, businessId: req.user.businessId },
      { isActive: false },
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateStock = async (req, res) => {
  try {
    const { quantity } = req.body;
    const businessId = req.businessId || req.user.activeBusinessId || req.user.businessId;
    
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, businessId },
      { $inc: { quantity } },
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.quantity <= 0) {
      product.quantity = 0;
      product.isActive = false;
      await product.save();
      notifyUser(req.user._id, 'inventory_low', {
        businessId,
        metadata: { productName: product.name, productId: product._id },
      }).catch((err) => console.error('Stock notification error:', err));
    }
    
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({
      businessId: req.businessId || req.user.activeBusinessId || req.user.businessId,
      quantity: { $lt: 10 },
      isActive: true
    });
    
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};