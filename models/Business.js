// backend/models/Business.js
const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  registrationNumber: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  taxIdentificationNumber: {
    type: String,
    required: true,
    unique: true
  },
  businessType: {
    type: String,
    enum: ['individual', 'company', 'partnership'],
    required: true
  },
  industry: String,
  address: {
    street: String,
    city: String,
    province: String,
    district: String,
    sector: String,
    cell: String
  },
  contactEmail: String,
  contactPhone: String,
  taxRate: {
    type: Number,
    default: 18 // Rwanda VAT rate
  },
  status: {
    type: String,
    enum: [
      'pending',
      'pending_approval',
      'approved',
      'active',
      'suspended',
      'rejected',
    ],
    default: 'pending_approval',
  },
  provinceId: String,
  districtId: String,
  sectorId: String,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: Date,
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  rejectedAt: Date,
  rejectionReason: String,
  totalPendingTax: {
    type: Number,
    default: 0
  },
  totalPaidTax: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Business', businessSchema);