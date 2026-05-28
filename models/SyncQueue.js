// backend/models/SyncQueue.js
const mongoose = require('mongoose');

const syncQueueSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  operation: {
    type: String,
    enum: ['create_sale', 'update_product', 'create_invoice', 'pay_tax'],
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  error: String,
  retryCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  processedAt: Date
});

module.exports = mongoose.model('SyncQueue', syncQueueSchema);