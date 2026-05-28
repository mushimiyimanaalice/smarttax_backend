// backend/controllers/businessController.js
const Business = require('../models/Business');
const User = require('../models/User');
const Sale = require('../models/Sale');
const TaxTransaction = require('../models/TaxTransaction');

exports.getBusinesses = async (req, res) => {
  try {
    let query = {};
    
    // Apply geographic restrictions based on user role
    if (req.user.role === 'sector_admin') {
      query['address.sector'] = req.user.sector;
    } else if (req.user.role === 'district_admin') {
      query['address.district'] = req.user.district;
    } else if (req.user.role === 'provincial_admin') {
      query['address.province'] = req.user.province;
    }
    
    const businesses = await Business.find(query)
      .populate('ownerId', 'fullName email phoneNumber')
      .sort({ createdAt: -1 });
    
    res.json(businesses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMyBusiness = async (req, res) => {
  try {
    const business = await Business.findById(req.user.businessId)
      .populate('ownerId', 'fullName email phoneNumber');
    
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }
    
    res.json(business);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getBusinessById = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id)
      .populate('ownerId', 'fullName email phoneNumber');
    
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }
    
    // Check geographic access
    if (req.user.role !== 'national_admin' && req.user.role !== 'business_owner') {
      if (req.user.role === 'sector_admin' && business.address.sector !== req.user.sector) {
        return res.status(403).json({ message: 'Access denied' });
      }
      if (req.user.role === 'district_admin' && business.address.district !== req.user.district) {
        return res.status(403).json({ message: 'Access denied' });
      }
      if (req.user.role === 'provincial_admin' && business.address.province !== req.user.province) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    
    res.json(business);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createBusiness = async (req, res) => {
  try {
    const addr = req.body.address || {};
    const business = new Business({
      ...req.body,
      ownerId: req.user._id,
      status: 'pending_approval',
      provinceId: addr.province,
      districtId: addr.district,
      sectorId: addr.sector,
      address: addr,
    });

    await business.save();

    const user = await User.findById(req.user._id);
    if (!user.businessIds?.includes(business._id)) {
      user.businessIds = [...(user.businessIds || []), business._id];
    }
    if (!user.activeBusinessId) {
      user.activeBusinessId = business._id;
      user.businessId = business._id;
    }
    await user.save();

    res.status(201).json(business);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateBusiness = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }
    
    // Check ownership
    if (business.ownerId.toString() !== req.user.id && req.user.role === 'business_owner') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const updatedBusiness = await Business.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    
    res.json(updatedBusiness);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getBusinessStats = async (req, res) => {
  try {
    const businessId = req.user.businessId || req.params.id;
    
    const [totalSales, totalProducts, pendingTax, monthlyRevenue] = await Promise.all([
      Sale.countDocuments({ businessId }),
      require('../models/Product').countDocuments({ businessId }),
      TaxTransaction.aggregate([
        { $match: { businessId, status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Sale.aggregate([
        { 
          $match: { 
            businessId,
            saleDate: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
          } 
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);
    
    res.json({
      totalSales,
      totalProducts,
      pendingTax: pendingTax[0]?.total || 0,
      monthlyRevenue: monthlyRevenue[0]?.total || 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.approveBusiness = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }
    
    business.status = 'approved';
    business.approvedBy = req.user.id;
    business.approvedAt = new Date();
    await business.save();
    
    res.json({ message: 'Business approved successfully', business });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTaxSummary = async (req, res) => {
  try {
    const businessId = req.user.businessId || req.params.id;
    
    const taxes = await TaxTransaction.aggregate([
      { $match: { businessId } },
      { 
        $group: {
          _id: '$status',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json(taxes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};