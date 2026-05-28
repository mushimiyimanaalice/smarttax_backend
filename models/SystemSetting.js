const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema({
  appName: { type: String, default: 'SmartTax' },
  supportEmail: { type: String, default: 'support@smarttax.rw' },
  supportPhone: { type: String, default: '+250788000000' },
  maintenanceMode: { type: Boolean, default: false },
  maxLoginAttempts: { type: Number, default: 5 },
  sessionTimeout: { type: Number, default: 60 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

systemSettingSchema.pre('save', function () {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('SystemSetting', systemSettingSchema);
