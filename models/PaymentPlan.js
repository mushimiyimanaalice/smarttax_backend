const mongoose = require('mongoose');

const paymentPlanSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  installments: {
    type: Number,
    required: true,
  },
  remainingAmount: {
    type: Number,
    default: 0,
  },
  installmentAmount: {
    type: Number,
    default: 0,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: Date,
  status: {
    type: String,
    enum: ['active', 'completed', 'defaulted', 'cancelled'],
    default: 'active',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  payments: [{
    amount: Number,
    date: { type: Date, default: Date.now },
    transactionId: String,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

paymentPlanSchema.pre('save', function () {
  if (this.installments > 0) {
    this.installmentAmount = this.totalAmount / this.installments;
  }
});

module.exports = mongoose.model('PaymentPlan', paymentPlanSchema);
