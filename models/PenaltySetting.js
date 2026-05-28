const mongoose = require('mongoose');

const penaltySettingSchema = new mongoose.Schema({
  latePenaltyPerDay: { type: Number, default: 0.05 },
  maxPenalty: { type: Number, default: 25 },
  gracePeriodDays: { type: Number, default: 7 },
  interestRate: { type: Number, default: 1.5 },
  enableInterest: { type: Boolean, default: true },
  enableWaiver: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

penaltySettingSchema.pre('save', function () {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('PenaltySetting', penaltySettingSchema);
