const mongoose = require('mongoose');

const dailyActivitySchema = new mongoose.Schema({
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
  },
  loggedIn: { type: Boolean, default: false },
  salesCount: { type: Number, default: 0 },
  taxActivity: { type: Boolean, default: false },
  inactive: { type: Boolean, default: false },
  inactivityNotified: { type: Boolean, default: false },
  explanationSubmitted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

dailyActivitySchema.index({ businessId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyActivity', dailyActivitySchema);
