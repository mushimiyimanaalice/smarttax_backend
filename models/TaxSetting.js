const mongoose = require('mongoose');

const taxSettingSchema = new mongoose.Schema({
  vatRate: { type: Number, default: 18 },
  reducedVatRate: { type: Number, default: 8 },
  taxDueDay: { type: Number, default: 15 },
  filingPeriod: { type: Number, default: 1 },
  enableLateFees: { type: Boolean, default: true },
  enableDigitalOnly: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

taxSettingSchema.pre('save', function () {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('TaxSetting', taxSettingSchema);
