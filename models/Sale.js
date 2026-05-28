// backend/models/Sale.js
const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    productName: String,
    quantity: Number,
    unitPrice: Number,
    subtotal: Number,
    taxRate: Number,
    taxAmount: Number,
    total: Number
  }],
  subtotal: {
    type: Number,
    required: true
  },
  taxAmount: {
    type: Number,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'mobile_money', 'card'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'pending_tax', 'partial'],
    required: true
  },
  taxStatus: {
    type: String,
    enum: ['pending', 'paid', 'overdue'],
    default: 'pending'
  },
  customerName: String,
  customerPhone: String,
  customerEmail: String,
  saleDate: {
    type: Date,
    default: Date.now
  },
  isSynced: {
    type: Boolean,
    default: true
  },
  syncedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Sale', saleSchema);