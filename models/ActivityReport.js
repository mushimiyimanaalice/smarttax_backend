const mongoose = require('mongoose');

const activityReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
  },
  date: {
    type: Date,
    required: true,
    index: true,
  },
  reason: {
    type: String,
    enum: [
      'sickness',
      'no_customers',
      'travel',
      'holiday',
      'stock_finished',
      'shop_closed',
      'other',
    ],
    required: true,
  },
  description: String,
  note: String,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    enum: ['submitted', 'reviewed', 'flagged'],
    default: 'submitted',
  },
  createdAt: { type: Date, default: Date.now },
});

activityReportSchema.index({ businessId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('ActivityReport', activityReportSchema);
