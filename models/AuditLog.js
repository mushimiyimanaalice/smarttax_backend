// backend/models/AuditLog.js
const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true
  },
  targetType: String,
  targetId: mongoose.Schema.Types.ObjectId,
  details: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);