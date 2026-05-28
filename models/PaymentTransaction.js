// backend/models/PaymentTransaction.js
const mongoose = require('mongoose');

const paymentTransactionSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  phoneNumber: String,
  provider: {
    type: String,
    enum: ['mtn', 'airtel', 'card', 'cash']
  },
  reference: String,
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  requestId: String,
  providerReference: String,
  paymentMethod: String,
  completedAt: Date,
  refundedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PaymentTransaction', paymentTransactionSchema);