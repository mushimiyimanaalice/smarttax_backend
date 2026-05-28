const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  language: {
    type: String,
    enum: ['en', 'rw', 'fr'],
    default: 'en',
  },
  type: {
    type: String,
    enum: [
      'greeting_morning',
      'greeting_afternoon',
      'inactivity_reminder',
      'business_approved',
      'business_rejected',
      'approval_request',
      'ai_insight',
      'product_created',
      'sale_completed',
      'inventory_low',
      'general',
    ],
    default: 'general',
  },
  read: { type: Boolean, default: false },
  metadata: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now, index: true },
});

module.exports = mongoose.model('Notification', notificationSchema);
