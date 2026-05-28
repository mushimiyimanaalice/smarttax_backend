// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['business_owner', 'sector_admin', 'district_admin', 'provincial_admin', 'national_admin'],
    default: 'business_owner'
  },
  language: {
    type: String,
    enum: ['en', 'rw', 'fr'],
    default: 'en',
  },
  preferredLanguage: {
    type: String,
    enum: ['en', 'rw', 'fr'],
    default: 'en',
  },
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
  },
  businessIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
  }],
  activeBusinessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
  },
  province: String,
  district: String,
  sector: String,
  provinceId: String,
  districtId: String,
  sectorId: String,
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);