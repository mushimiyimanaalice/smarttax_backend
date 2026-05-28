// backend/models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  category: String,
  price: {
    type: Number,
    required: true
  },
  cost: Number,
  taxRate: {
    type: Number,
    default: 18
  },
  taxCategory: {
    type: String,
    enum: ['standard', 'reduced', 'zero', 'exempt'],
    default: 'standard'
  },
  quantity: {
    type: Number,
    default: 0
  },
  unit: {
    type: String,
    default: 'piece'
  },
  sku: String,
  barcode: String,
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

productSchema.pre('save', function () {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('Product', productSchema);