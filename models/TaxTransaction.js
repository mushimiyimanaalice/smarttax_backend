// backend/models/TaxTransaction.js
const mongoose = require('mongoose');

const taxTransactionSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  saleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale'
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['vat', 'payee', 'cst'],
    default: 'vat'
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue', 'cancelled'],
    default: 'pending'
  },
  dueDate: Date,
  paidAt: Date,
  paymentMethod: String,
  transactionId: String,
  penaltyAmount: Number,
  interestAmount: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('TaxTransaction', taxTransactionSchema);