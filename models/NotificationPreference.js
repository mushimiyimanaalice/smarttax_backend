const mongoose = require('mongoose');

const notificationPreferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  pushEnabled: { type: Boolean, default: true },
  emailEnabled: { type: Boolean, default: true },
  smsEnabled: { type: Boolean, default: false },
  inactivityReminders: { type: Boolean, default: true },
  taxReminders: { type: Boolean, default: true },
  businessUpdates: { type: Boolean, default: true },
  marketingEnabled: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

notificationPreferenceSchema.pre('save', function () {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('NotificationPreference', notificationPreferenceSchema);
