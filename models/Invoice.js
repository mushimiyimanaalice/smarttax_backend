// backend/models/Invoice.js
const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  saleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale',
    required: true
  },
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  dueDate: Date,
  items: [{
    productName: String,
    quantity: Number,
    unitPrice: Number,
    subtotal: Number,
    taxRate: Number,
    taxAmount: Number,
    total: Number
  }],
  subtotal: Number,
  taxAmount: Number,
  totalAmount: Number,
  businessInfo: {
    name: String,
    tin: String,
    address: {
      street: String,
      city: String,
      province: String
    }
  },
  customerInfo: {
    name: String,
    email: String,
    phone: String
  },
  status: {
    type: String,
    enum: ['draft', 'issued', 'paid', 'overdue', 'cancelled'],
    default: 'draft'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Invoice', invoiceSchema);