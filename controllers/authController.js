// backend/controllers/authController.js
const User = require('../models/User');
const Business = require('../models/Business');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const { formatUserResponse } = require('../utils/userResponse');
const { notifyBusinessOwner, notifyUser } = require('../services/notificationService');
const { trackLogin } = require('../services/activityService');
const { isAdminRole } = require('../utils/geoScope');

const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      email: user.email, 
      role: user.role,
      businessId: user.businessId,
      province: user.province,
      district: user.district,
      sector: user.sector
    },
    process.env.JWT_SECRET || 'secretkey',
    { expiresIn: '7d' }
  );
};

exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, fullName, phoneNumber, role, businessData } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const userRole = role || 'business_owner';

    // Create user first (business needs ownerId)
    const user = new User({
      email,
      password,
      fullName,
      phoneNumber,
      role: userRole,
      province: businessData?.address?.province,
      district: businessData?.address?.district,
      sector: businessData?.address?.sector,
    });

    await user.save();

    // Create business if business_owner
    if (userRole === 'business_owner' && businessData) {
      const registrationNumber =
        businessData.registrationNumber?.trim() || businessData.tin?.trim();
      if (!registrationNumber) {
        await User.findByIdAndDelete(user._id);
        return res.status(400).json({ message: 'Business registration number or TIN is required' });
      }

      const addr = businessData.address || {};
      const business = new Business({
        registrationNumber,
        name: businessData.name,
        ownerId: user._id,
        taxIdentificationNumber: businessData.tin,
        businessType: businessData.businessType || 'individual',
        address: addr,
        provinceId: addr.province,
        districtId: addr.district,
        sectorId: addr.sector,
        contactEmail: businessData.email || email,
        contactPhone: businessData.phone || phoneNumber,
        status: 'pending_approval',
      });
      await business.save();

      user.businessId = business._id;
      user.activeBusinessId = business._id;
      user.businessIds = [business._id];
      user.preferredLanguage = user.language;
      await user.save();

      // Welcome notification for the new user
      notifyUser(user._id, 'greeting_morning', {
        title: 'Welcome to SmartTax!',
        message: `Your business "${business.name}" has been registered. Your sector admin will review and approve it shortly.`,
        metadata: { url: '/dashboard' },
      }).catch(() => {});

      const sectorAdmins = await User.find({
        role: 'sector_admin',
        sector: addr.sector,
        district: addr.district,
      });
      for (const admin of sectorAdmins) {
        await notifyUser(admin._id, 'approval_request', {
          businessId: business._id,
          metadata: { businessName: business.name },
        });
      }
    }

    const token = generateToken(user);

    res.status(201).json({
      message: 'Registration successful. Awaiting sector admin approval.',
      token,
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('Register error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email, TIN, or registration number already in use' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save();

    if (!isAdminRole(user.role) && (user.activeBusinessId || user.businessId)) {
      await trackLogin(user._id, user.activeBusinessId || user.businessId);
    }

    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.id).select('-password');
    res.json(formatUserResponse(user));
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.setActiveBusiness = async (req, res) => {
  try {
    const { businessId } = req.body;
    const business = await Business.findOne({ _id: businessId, ownerId: req.user._id });
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }
    req.user.activeBusinessId = businessId;
    req.user.businessId = businessId;
    await req.user.save();
    res.json({ message: 'Active business updated', activeBusinessId: businessId, business });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMyBusinesses = async (req, res) => {
  try {
    const businesses = await Business.find({ ownerId: req.user._id }).sort({ name: 1 });
    res.json(businesses);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.setPreferredLanguage = async (req, res) => {
  try {
    const { language } = req.body;
    if (!['en', 'rw', 'fr'].includes(language)) {
      return res.status(400).json({ message: 'Invalid language' });
    }
    req.user.preferredLanguage = language;
    req.user.language = language;
    await req.user.save();
    res.json({ preferredLanguage: language });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.logout = async (req, res) => {
  try {
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    
    const isValidPassword = await user.comparePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();
    
    // In production, send email with reset link
    res.json({ message: 'Password reset email sent', resetToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};