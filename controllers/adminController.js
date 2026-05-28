const User = require('../models/User');
const Business = require('../models/Business');
const Sale = require('../models/Sale');
const TaxTransaction = require('../models/TaxTransaction');
const AuditLog = require('../models/AuditLog');
const PaymentTransaction = require('../models/PaymentTransaction');
const Notification = require('../models/Notification');
const ActivityReport = require('../models/ActivityReport');
const DailyActivity = require('../models/DailyActivity');
const { buildBusinessGeoFilter } = require('../utils/geoScope');
const { notifyBusinessOwner } = require('../services/notificationService');

const buildGeoQuery = buildBusinessGeoFilter;
const PENDING_STATUSES = ['pending', 'pending_approval'];

// ==================== DASHBOARD & CORE ====================

exports.getDashboardStats = async (req, res) => {
  try {
    const query = buildGeoQuery(req.user);
    const businessIds = await Business.find(query).distinct('_id');

    const [totalBusinesses, totalSales, totalTaxCollected, pendingBusinesses] = await Promise.all([
      Business.countDocuments(query),
      businessIds.length ? Sale.countDocuments({ businessId: { $in: businessIds } }) : 0,
      businessIds.length
        ? TaxTransaction.aggregate([
            { $match: { businessId: { $in: businessIds }, status: 'paid' } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
          ])
        : [{ total: 0 }],
      Business.countDocuments({ ...query, status: { $in: PENDING_STATUSES } }),
    ]);

    res.json({ totalBusinesses, totalSales, totalTaxCollected: totalTaxCollected[0]?.total || 0, pendingBusinesses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getChartData = async (req, res) => {
  try {
    const query = buildGeoQuery(req.user);
    const pipeline = Object.keys(query).length
      ? [{ $match: query }]
      : [];

    const [byProvince, byStatus, monthlyTax] = await Promise.all([
      Business.aggregate([
        ...pipeline,
        { $group: { _id: '$address.province', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Business.aggregate([
        ...pipeline,
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      TaxTransaction.aggregate([
        { $match: { status: 'paid' } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$paidAt' } },
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 12 },
      ]),
    ]);

    res.json({
      byProvince: byProvince.map((p) => ({ name: p._id || 'Unknown', value: p.count })),
      byStatus: byStatus.map((s) => ({ name: s._id || 'Unknown', value: s.count })),
      monthlyTax: monthlyTax.map((m) => ({ month: m._id, amount: m.total, transactions: m.count })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.approveBusiness = async (req, res) => {
  try {
    if (req.user.role !== 'sector_admin' && req.user.role !== 'district_admin') {
      return res.status(403).json({ message: 'Only sector or district admin can approve businesses' });
    }

    const geoFilter = buildGeoQuery(req.user, { _id: req.params.id, status: { $in: PENDING_STATUSES } });
    const business = await Business.findOne(geoFilter);

    if (!business) return res.status(404).json({ message: 'Business not found in your area' });

    business.status = 'active';
    business.approvedBy = req.user._id;
    business.approvedAt = new Date();
    await business.save();

    await notifyBusinessOwner(business.ownerId, 'business_approved', business._id);
    await AuditLog.create({ userId: req.user._id, action: 'APPROVE_BUSINESS', targetType: 'Business', targetId: business._id, details: { businessName: business.name } });

    res.json({ message: 'Business approved', business });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.rejectBusiness = async (req, res) => {
  try {
    const geoFilter = buildGeoQuery(req.user, { _id: req.params.id, status: { $in: PENDING_STATUSES } });
    const business = await Business.findOne(geoFilter);

    if (!business) return res.status(404).json({ message: 'Business not found' });

    business.status = 'rejected';
    business.rejectedBy = req.user._id;
    business.rejectedAt = new Date();
    business.rejectionReason = req.body.reason || '';
    await business.save();

    await notifyBusinessOwner(business.ownerId, 'business_rejected', business._id, { message: req.body.reason });
    await AuditLog.create({ userId: req.user._id, action: 'REJECT_BUSINESS', targetType: 'Business', targetId: business._id, details: { reason: req.body.reason } });

    res.json({ message: 'Business rejected', business });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPendingBusinesses = async (req, res) => {
  try {
    const query = buildGeoQuery(req.user, { status: { $in: PENDING_STATUSES } });
    const businesses = await Business.find(query).populate('ownerId', 'fullName email phoneNumber').sort({ createdAt: 1 });
    res.json(businesses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllBusinesses = async (req, res) => {
  try {
    const query = buildGeoQuery(req.user);
    if (req.query.province) query['address.province'] = req.query.province;
    if (req.query.district) query['address.district'] = req.query.district;
    if (req.query.sector) query['address.sector'] = req.query.sector;
    if (req.query.status) query.status = req.query.status;

    const businesses = await Business.find(query).populate('ownerId', 'fullName email phoneNumber').sort({ createdAt: -1 });

    const enriched = await Promise.all(
      businesses.map(async (b) => {
        const pendingTax = await TaxTransaction.aggregate([
          { $match: { businessId: b._id, status: 'pending' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        return { ...b.toObject(), taxStatus: pendingTax[0]?.total > 0 ? 'pending' : 'compliant', pendingTaxAmount: pendingTax[0]?.total || 0 };
      })
    );
    res.json(enriched);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.suspendBusiness = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) return res.status(404).json({ message: 'Business not found' });
    business.status = 'suspended';
    await business.save();
    await AuditLog.create({ userId: req.user._id, action: 'SUSPEND_BUSINESS', targetType: 'Business', targetId: business._id, details: { reason: req.body.reason }, ipAddress: req.ip });
    res.json({ message: 'Business suspended' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.reactivateBusiness = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) return res.status(404).json({ message: 'Business not found' });
    business.status = 'active';
    await business.save();
    await AuditLog.create({ userId: req.user._id, action: 'REACTIVATE_BUSINESS', targetType: 'Business', targetId: business._id });
    res.json({ message: 'Business reactivated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==================== TAX & REVENUE ====================

exports.getTaxRevenue = async (req, res) => {
  try {
    const geoQuery = buildGeoQuery(req.user);
    const businessIds = await Business.find(geoQuery).distinct('_id');
    const match = { status: 'paid' };
    if (businessIds.length) match.businessId = { $in: businessIds };

    const revenue = await TaxTransaction.aggregate([
      { $match: match },
      { $group: { _id: { year: { $year: '$paidAt' }, month: { $month: '$paidAt' } }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 },
    ]);
    res.json(revenue);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTaxCollectionReport = async (req, res) => {
  try {
    const end = req.query.endDate ? new Date(req.query.endDate) : new Date();
    const start = req.query.startDate ? new Date(req.query.startDate) : new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
    const geoQuery = buildGeoQuery(req.user);
    const businessIds = await Business.find(geoQuery).distinct('_id');
    const match = { paidAt: { $gte: start, $lte: end }, status: 'paid' };
    if (businessIds.length) match.businessId = { $in: businessIds };
    const report = await TaxTransaction.aggregate([
      { $match: match },
      { $group: { _id: { date: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } }, paymentMethod: '$paymentMethod' }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { '_id.date': 1 } },
    ]);
    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getComplianceReports = async (req, res) => {
  try {
    const geoQuery = buildGeoQuery(req.user);
    const businessIds = await Business.find(geoQuery).distinct('_id');

    const reports = await Business.aggregate([
      { $match: { _id: { $in: businessIds } } },
      {
        $lookup: {
          from: 'taxtransactions', localField: '_id', foreignField: 'businessId', as: 'taxes',
        },
      },
      {
        $project: {
          name: 1, registrationNumber: 1,
          totalTaxDue: { $sum: '$taxes.amount' },
          totalTaxPaid: { $sum: { $cond: [{ $eq: ['$taxes.status', 'paid'] }, '$taxes.amount', 0] } },
          complianceRate: {
            $cond: [
              { $eq: [{ $sum: '$taxes.amount' }, 0] }, 100,
              { $multiply: [{ $divide: [{ $sum: { $cond: [{ $eq: ['$taxes.status', 'paid'] }, '$taxes.amount', 0] } }, { $sum: '$taxes.amount' }] }, 100] },
            ],
          },
        },
      },
      { $sort: { complianceRate: 1 } },
    ]);
    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getRevenueMonitoring = async (req, res) => {
  try {
    const period = req.query.period || 'monthly';
    const geoQuery = buildGeoQuery(req.user);
    const businessIds = await Business.find(geoQuery).distinct('_id');
    const match = { status: 'paid' };
    if (businessIds.length) match.businessId = { $in: businessIds };

    const now = new Date();
    let dateGroup;
    if (period === 'daily') { dateGroup = { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } }; match.paidAt = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }; }
    else if (period === 'weekly') { dateGroup = { $dateToString: { format: '%Y-W%V', date: '$paidAt' } }; match.paidAt = { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) }; }
    else if (period === 'yearly') { dateGroup = { $dateToString: { format: '%Y', date: '$paidAt' } }; }
    else { dateGroup = { $dateToString: { format: '%Y-%m', date: '$paidAt' } }; match.paidAt = { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) }; }

    const trend = await TaxTransaction.aggregate([
      { $match: match },
      { $group: { _id: dateGroup, revenue: { $sum: '$amount' }, expected: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const totals = await TaxTransaction.aggregate([
      { $match: { status: 'paid', businessId: businessIds.length ? { $in: businessIds } : undefined } },
      { $group: { _id: '$paymentMethod', amount: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    const allTaxes = await TaxTransaction.aggregate([
      { $match: { businessId: businessIds.length ? { $in: businessIds } : undefined } },
      { $group: { _id: null, total: { $sum: '$amount' }, paid: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] } } } },
    ]);

    const totalRevenue = trend.reduce((s, t) => s + t.revenue, 0);
    const expectedRevenue = trend.reduce((s, t) => s + t.expected, 0);
    const outstanding = (allTaxes[0]?.total || 0) - (allTaxes[0]?.paid || 0);

    res.json({
      totalRevenue,
      expectedRevenue,
      collectionRate: expectedRevenue > 0 ? Math.round((totalRevenue / expectedRevenue) * 100) : 0,
      outstanding,
      trend,
      byMethod: totals.map((t) => ({ method: t._id || 'other', amount: t.amount, count: t.count })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==================== GEOGRAPHIC ANALYTICS ====================

exports.getNationalAnalytics = async (req, res) => {
  try {
    const totalBusinesses = await Business.countDocuments();
    const activeBusinesses = await Business.countDocuments({ status: 'active' });
    const totalRevenue = (await TaxTransaction.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]))[0]?.total || 0;
    const totalUsers = await User.countDocuments();
    const totalSales = await Sale.countDocuments();

    const monthlyRevenue = await TaxTransaction.aggregate([
      { $match: { status: 'paid', paidAt: { $gte: new Date(new Date().getFullYear() - 1, 0, 1) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$paidAt' } }, revenue: { $sum: '$amount' } } },
      { $sort: { _id: 1 } },
      { $limit: 12 },
    ]);

    const topPerformers = await Business.aggregate([
      { $match: { status: 'active' } },
      {
        $lookup: { from: 'sales', localField: '_id', foreignField: 'businessId', as: 'sales' },
      },
      { $project: { name: 1, totalSales: { $sum: '$sales.totalAmount' } } },
      { $sort: { totalSales: -1 } },
      { $limit: 5 },
    ]);

    res.json({
      totalBusinesses, activeBusinesses, totalRevenue, totalUsers, totalSales, growth: 12,
      monthlyRevenue: monthlyRevenue.map((m) => ({ month: m._id, revenue: m.revenue })),
      topPerformers: topPerformers.map((b) => ({ name: b.name, metric: 'Total Sales', value: `RWF ${(b.totalSales || 0).toLocaleString()}` })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getProvincialAnalytics = async (req, res) => {
  try {
    const geoQuery = buildGeoQuery(req.user);
    const businessIds = await Business.find(geoQuery).distinct('_id');
    const totalBusinesses = await Business.countDocuments(geoQuery);
    const activeBusinesses = await Business.countDocuments({ ...geoQuery, status: 'active' });
    const totalRevenue = businessIds.length ? (await TaxTransaction.aggregate([{ $match: { businessId: { $in: businessIds }, status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]))[0]?.total || 0 : 0;
    const totalUsers = await User.countDocuments(geoQuery);

    const monthlyRevenue = businessIds.length ? await TaxTransaction.aggregate([
      { $match: { businessId: { $in: businessIds }, status: 'paid', paidAt: { $gte: new Date(new Date().getFullYear() - 1, 0, 1) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$paidAt' } }, revenue: { $sum: '$amount' } } },
      { $sort: { _id: 1 } },
      { $limit: 12 },
    ]) : [];

    res.json({ totalBusinesses, activeBusinesses, totalRevenue, totalUsers, growth: 8, monthlyRevenue: monthlyRevenue.map((m) => ({ month: m._id, revenue: m.revenue })), topPerformers: [] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getDistrictAnalytics = async (req, res) => {
  try {
    const geoQuery = buildGeoQuery(req.user);
    const businessIds = await Business.find(geoQuery).distinct('_id');
    const totalBusinesses = await Business.countDocuments(geoQuery);
    const activeBusinesses = await Business.countDocuments({ ...geoQuery, status: 'active' });
    const totalRevenue = businessIds.length ? (await TaxTransaction.aggregate([{ $match: { businessId: { $in: businessIds }, status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]))[0]?.total || 0 : 0;
    res.json({ totalBusinesses, activeBusinesses, totalRevenue, growth: 5, topPerformers: [] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getProvincePerformance = async (req, res) => {
  try {
    const provinces = await Business.aggregate([
      { $group: { _id: '$address.province', count: { $sum: 1 }, activeCount: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } } } },
      { $sort: { count: -1 } },
    ]);

    const withRevenue = await Promise.all(
      provinces.map(async (p) => {
        const businessIds = await Business.find({ 'address.province': p._id }).distinct('_id');
        const rev = businessIds.length ? (await TaxTransaction.aggregate([{ $match: { businessId: { $in: businessIds }, status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]))[0]?.total || 0 : 0;
        return { name: p._id || 'Unknown', revenue: rev, businesses: p.count, compliance: p.activeCount > 0 ? Math.round((p.activeCount / p.count) * 100) : 0 };
      })
    );

    const totalRevenue = withRevenue.reduce((s, p) => s + p.revenue, 0);
    const totalBusinesses = withRevenue.reduce((s, p) => s + p.businesses, 0);
    const bestProvince = withRevenue.sort((a, b) => b.revenue - a.revenue)[0] || null;
    const complianceRate = totalBusinesses > 0 ? Math.round((withRevenue.reduce((s, p) => s + (p.compliance * p.businesses / 100), 0) / totalBusinesses) * 100) : 0;

    res.json({ provinces: withRevenue, totalRevenue, totalBusinesses, bestProvince, complianceRate });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getDistrictMonitoring = async (req, res) => {
  try {
    const geoQuery = buildGeoQuery(req.user);
    const districts = await Business.aggregate([
      { $match: geoQuery },
      { $group: { _id: { district: '$address.district', province: '$address.province' }, count: { $sum: 1 }, activeCount: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } } } },
      { $sort: { count: -1 } },
    ]);

    const withRevenue = await Promise.all(
      districts.map(async (d) => {
        const ids = await Business.find({ 'address.district': d._id.district, 'address.province': d._id.province }).distinct('_id');
        const rev = ids.length ? (await TaxTransaction.aggregate([{ $match: { businessId: { $in: ids }, status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]))[0]?.total || 0 : 0;
        return { name: d._id.district || 'Unknown', businesses: d.count, revenue: rev, compliance: d.activeCount > 0 ? Math.round((d.activeCount / d.count) * 100) : 0 };
      })
    );

    res.json({
      totalDistricts: withRevenue.length,
      totalBusinesses: withRevenue.reduce((s, d) => s + d.businesses, 0),
      totalRevenue: withRevenue.reduce((s, d) => s + d.revenue, 0),
      avgCompliance: withRevenue.length > 0 ? Math.round(withRevenue.reduce((s, d) => s + d.compliance, 0) / withRevenue.length) : 0,
      districts: withRevenue,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getSectorMonitoring = async (req, res) => {
  try {
    const geoQuery = buildGeoQuery(req.user);
    const sectors = await Business.aggregate([
      { $match: geoQuery },
      { $group: { _id: { sector: '$address.sector', district: '$address.district' }, count: { $sum: 1 }, pendingCount: { $sum: { $cond: [{ $in: ['$status', ['pending', 'pending_approval']] }, 1, 0] } } } },
      { $sort: { count: -1 } },
    ]);

    const totalBusinesses = sectors.reduce((s, sec) => s + sec.count, 0);
    const totalPending = sectors.reduce((s, sec) => s + sec.pendingCount, 0);

    res.json({
      totalSectors: sectors.length,
      totalBusinesses,
      pendingApprovals: totalPending,
      approvalRate: totalBusinesses > 0 ? Math.round(((totalBusinesses - totalPending) / totalBusinesses) * 100) : 0,
      sectors: sectors.map((s) => ({ name: s._id.sector || 'Unknown', businesses: s.count, pending: s.pendingCount })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==================== ACTIVITY ====================

exports.getActivityMonitoring = async (req, res) => {
  try {
    const period = req.query.period || '7d';
    const days = parseInt(period) || 7;
    const geoQuery = buildGeoQuery(req.user);
    const businessIds = await Business.find(geoQuery).distinct('_id');

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const activities = await DailyActivity.find({ businessId: { $in: businessIds }, date: { $gte: startDate } }).sort({ date: 1 });

    const trendMap = {};
    activities.forEach((a) => {
      const key = a.date.toISOString().slice(0, 10);
      if (!trendMap[key]) trendMap[key] = { date: key, active: 0, inactive: 0 };
      if (a.inactive) trendMap[key].inactive++;
      else trendMap[key].active++;
    });

    const activeToday = await DailyActivity.countDocuments({ businessId: { $in: businessIds }, date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }, inactive: false });
    const inactiveToday = await DailyActivity.countDocuments({ businessId: { $in: businessIds }, date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }, inactive: true });
    const flagged = await ActivityReport.countDocuments({ status: 'flagged' });
    const totalUsers = await User.countDocuments(geoQuery);

    res.json({ activeToday, inactiveToday, totalUsers, flagged, trend: Object.values(trendMap) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getBusinessLocations = async (req, res) => {
  try {
    const locations = await Business.aggregate([
      { $group: { _id: { province: '$address.province', district: '$address.district' }, total: { $sum: 1 }, active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } }, pending: { $sum: { $cond: [{ $in: ['$status', ['pending', 'pending_approval']] }, 1, 0] } } } },
      { $sort: { '_id.province': 1, '_id.district': 1 } },
    ]);

    const totalProvinces = new Set(locations.map((l) => l._id.province).filter(Boolean)).size;
    const totalDistricts = locations.length;

    res.json({
      totalProvinces,
      totalDistricts,
      totalBusinesses: locations.reduce((s, l) => s + l.total, 0),
      locations: locations.map((l) => ({ province: l._id.province || 'Unknown', district: l._id.district || 'Unknown', total: l.total, active: l.active, pending: l.pending })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getBusinessesByGeography = async (req, res) => {
  try {
    const geography = await Business.aggregate([
      { $group: { _id: { province: '$address.province', district: '$address.district', sector: '$address.sector' }, count: { $sum: 1 } } },
      { $sort: { '_id.province': 1, '_id.district': 1, '_id.sector': 1 } },
    ]);
    res.json(geography);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getInactivityExplanations = async (req, res) => {
  try {
    const geoQuery = buildGeoQuery(req.user);
    const businessIds = await Business.find(geoQuery).distinct('_id');
    const reports = await ActivityReport.find({ businessId: { $in: businessIds } })
      .populate('businessId', 'name registrationNumber')
      .populate('userId', 'fullName email')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.flagBusiness = async (req, res) => {
  try {
    const report = await ActivityReport.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    report.status = 'flagged';
    report.reviewedBy = req.user._id;
    await report.save();
    res.json({ message: 'Business flagged' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==================== USER MANAGEMENT ====================

exports.getAdminUsers = async (req, res) => {
  try {
    const filter = { role: { $in: ['sector_admin', 'district_admin', 'provincial_admin', 'national_admin'] } };
    if (req.query.role) filter.role = req.query.role;

    if (req.user.role !== 'national_admin') {
      if (req.user.role === 'provincial_admin') {
        filter.province = normalizeProvince(req.user.province);
        filter.role = { $in: ['district_admin', 'sector_admin'] };
      } else if (req.user.role === 'district_admin') {
        filter.district = req.user.district;
        filter.role = 'sector_admin';
      } else {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const PROVINCE_ALIASES = { kigali: 'City of Kigali', northern: 'Northern Province', southern: 'Southern Province', eastern: 'Eastern Province', western: 'Western Province' };
const KNOWN_PROVINCES = ['City of Kigali', 'Northern Province', 'Southern Province', 'Eastern Province', 'Western Province'];
const normalizeProvince = (p) => {
  if (!p) return '';
  if (KNOWN_PROVINCES.includes(p)) return p;
  const alias = PROVINCE_ALIASES[p.toLowerCase().trim()];
  return alias || p;
};
const toTitleCase = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;

exports.createAdminUser = async (req, res) => {
  try {
    const { email, password, fullName, phoneNumber, role } = req.body;
    const province = normalizeProvince(req.body.province);
    const district = toTitleCase(req.body.district);
    const sector = toTitleCase(req.body.sector);
    if (!email || !password || !fullName || !phoneNumber || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate role creation permissions
    if (req.user.role === 'national_admin') {
      // Can create any admin role
    } else if (req.user.role === 'provincial_admin') {
      if (!['district_admin', 'sector_admin'].includes(role)) {
        return res.status(403).json({ message: 'Provincial admin can only create district or sector admins' });
      }
      if (province && normalizeProvince(province) !== normalizeProvince(req.user.province)) {
        return res.status(403).json({ message: 'Can only create admins within your province' });
      }
    } else if (req.user.role === 'district_admin') {
      if (role !== 'sector_admin') {
        return res.status(403).json({ message: 'District admin can only create sector admins' });
      }
      if (district && district !== req.user.district) {
        return res.status(403).json({ message: 'Can only create admins within your district' });
      }
    } else {
      return res.status(403).json({ message: 'Not authorized to create admin users' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already exists' });

    const user = new User({ email, password, fullName, phoneNumber, role, province, district, sector, isActive: true });
    await user.save();

    await AuditLog.create({ userId: req.user._id, action: 'CREATE_ADMIN', targetType: 'User', targetId: user._id, details: { role, email } });

    res.status(201).json({ message: 'Admin created', user: { ...user.toObject(), password: undefined } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateAdminUser = async (req, res) => {
  try {
    const updates = {};
    if (req.body.fullName) updates.fullName = req.body.fullName;
    if (req.body.phoneNumber) updates.phoneNumber = req.body.phoneNumber;
    if (req.body.isActive !== undefined) updates.isActive = req.body.isActive;
    if (req.body.province) updates.province = req.body.province;
    if (req.body.district) updates.district = req.body.district;
    if (req.body.sector) updates.sector = req.body.sector;

    if (updates.province) updates.province = normalizeProvince(updates.province);
    if (updates.district) updates.district = toTitleCase(updates.district);
    if (updates.sector) updates.sector = toTitleCase(updates.sector);

    const updated = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    if (!updated) return res.status(404).json({ message: 'User not found' });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteAdminUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'national_admin') return res.status(403).json({ message: 'Cannot delete national admin' });
    if (user.role === 'business_owner') return res.status(403).json({ message: 'Use business owner management' });

    await User.findByIdAndDelete(req.params.id);
    await AuditLog.create({ userId: req.user._id, action: 'DELETE_ADMIN', targetType: 'User', targetId: req.params.id, details: { role: user.role, email: user.email } });

    res.json({ message: 'Admin deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllBusinessOwners = async (req, res) => {
  try {
    const users = await User.find({ role: 'business_owner' }).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==================== PAYMENT MONITORING ====================

exports.getPaymentMonitoring = async (req, res) => {
  try {
    const geoQuery = buildGeoQuery(req.user);
    const businessIds = await Business.find(geoQuery).distinct('_id');
    const match = { businessId: businessIds.length ? { $in: businessIds } : undefined };

    const payments = await PaymentTransaction.find(match).sort({ createdAt: -1 });
    const totalPayments = payments.reduce((s, p) => s + (p.amount || 0), 0);
    const momoPayments = payments.filter((p) => p.provider === 'mtn' || p.provider === 'airtel').reduce((s, p) => s + (p.amount || 0), 0);
    const cardPayments = payments.filter((p) => p.paymentMethod === 'card').reduce((s, p) => s + (p.amount || 0), 0);
    const successful = payments.filter((p) => p.status === 'completed').length;
    const successRate = payments.length > 0 ? Math.round((successful / payments.length) * 100) : 0;

    const trendData = payments.reduce((acc, p) => {
      const date = p.createdAt.toISOString().slice(0, 10);
      acc[date] = (acc[date] || 0) + (p.amount || 0);
      return acc;
    }, {});

    res.json({
      totalPayments, momoPayments, cardPayments, successRate,
      trend: Object.entries(trendData).map(([date, amount]) => ({ date, amount })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMomoTransactions = async (req, res) => {
  try {
    const transactions = await PaymentTransaction.find({
      provider: { $in: ['mtn', 'airtel'] },
    }).populate('businessId', 'name').sort({ createdAt: -1 }).limit(200);
    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==================== AI INSIGHTS ====================

exports.getAiInsights = async (req, res) => {
  try {
    const totalBusinesses = await Business.countDocuments();
    const activeBusinesses = await Business.countDocuments({ status: 'active' });
    const pendingBusinesses = await Business.countDocuments({ status: { $in: PENDING_STATUSES } });
    const totalRevenue = (await TaxTransaction.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]))[0]?.total || 0;
    const inactiveToday = await DailyActivity.countDocuments({ date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }, inactive: true });
    const totalSales = await Sale.countDocuments();

    const lastMonthRevenue = (await TaxTransaction.aggregate([
      { $match: { status: 'paid', paidAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1), $lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]))[0]?.total || 0;

    const thisMonthRevenue = (await TaxTransaction.aggregate([
      { $match: { status: 'paid', paidAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]))[0]?.total || 0;

    const growth = lastMonthRevenue > 0 ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : 0;

    const insights = [];
    if (pendingBusinesses > 0) insights.push({ type: 'warning', title: 'Pending Approvals', description: `${pendingBusinesses} businesses awaiting approval. Review promptly.`, metric: { label: 'Pending', value: pendingBusinesses } });
    if (inactiveToday > 10) insights.push({ type: 'warning', title: 'High Inactivity', description: `${inactiveToday} businesses inactive today. This is higher than normal.`, metric: { label: 'Inactive Today', value: inactiveToday } });
    if (growth > 0) insights.push({ type: 'positive', title: 'Revenue Growth', description: `Revenue grew by ${growth}% compared to last month.`, metric: { label: 'Growth', value: `${growth}%` } });
    if (totalSales > 0) insights.push({ type: 'info', title: 'Platform Activity', description: `${totalSales} total sales recorded across ${activeBusinesses} active businesses.`, metric: { label: 'Total Sales', value: totalSales } });

    const predictions = [];
    for (let i = 1; i <= 3; i++) {
      const month = new Date();
      month.setMonth(month.getMonth() + i);
      const predicted = thisMonthRevenue * (1 + growth / 100 / 3) * i;
      predictions.push({
        month: month.toLocaleString('default', { month: 'short' }),
        predicted: Math.round(predicted),
        lower: Math.round(predicted * 0.85),
        upper: Math.round(predicted * 1.15),
      });
    }

    res.json({ insights, prediction: predictions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==================== AUDIT LOGS ====================

exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find().populate('userId', 'fullName email').sort({ createdAt: -1 }).limit(100);
    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==================== PAYMENT PLANS ====================

exports.getPaymentPlans = async (req, res) => {
  try {
    const geoQuery = buildGeoQuery(req.user);
    const businessIds = await Business.find(geoQuery).distinct('_id');
    const plans = await require('../models/PaymentPlan').find({ businessId: { $in: businessIds } }).populate('businessId', 'name').sort({ createdAt: -1 });
    res.json(plans);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createPaymentPlan = async (req, res) => {
  try {
    const PaymentPlan = require('../models/PaymentPlan');
    const plan = new PaymentPlan({
      businessId: req.body.businessId,
      totalAmount: req.body.totalAmount,
      installments: req.body.installments,
      startDate: req.body.startDate,
      remainingAmount: req.body.totalAmount,
      status: 'active',
      createdBy: req.user._id,
    });
    await plan.save();
    res.status(201).json(plan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==================== SYSTEM SETTINGS ====================

exports.getSystemSettings = async (req, res) => {
  try {
    const SystemSetting = require('../models/SystemSetting');
    let settings = await SystemSetting.findOne();
    if (!settings) {
      settings = await SystemSetting.create({
        appName: 'SmartTax',
        supportEmail: 'support@smarttax.rw',
        supportPhone: '+250788000000',
        maxLoginAttempts: 5,
        sessionTimeout: 60,
      });
    }
    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateSystemSettings = async (req, res) => {
  try {
    const SystemSetting = require('../models/SystemSetting');
    const settings = await SystemSetting.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    await AuditLog.create({ userId: req.user._id, action: 'UPDATE_SYSTEM_SETTINGS', targetType: 'Settings', details: { updated: Object.keys(req.body) } });
    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTaxSettings = async (req, res) => {
  try {
    const TaxSetting = require('../models/TaxSetting');
    let settings = await TaxSetting.findOne();
    if (!settings) {
      settings = await TaxSetting.create({ vatRate: 18, reducedVatRate: 8, taxDueDay: 15, filingPeriod: 1 });
    }
    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateTaxSettings = async (req, res) => {
  try {
    const TaxSetting = require('../models/TaxSetting');
    const settings = await TaxSetting.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    await AuditLog.create({ userId: req.user._id, action: 'UPDATE_TAX_SETTINGS', targetType: 'Settings', details: { updated: Object.keys(req.body) } });
    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPenaltySettings = async (req, res) => {
  try {
    const PenaltySetting = require('../models/PenaltySetting');
    let settings = await PenaltySetting.findOne();
    if (!settings) {
      settings = await PenaltySetting.create({ latePenaltyPerDay: 0.05, maxPenalty: 25, gracePeriodDays: 7, interestRate: 1.5 });
    }
    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updatePenaltySettings = async (req, res) => {
  try {
    const PenaltySetting = require('../models/PenaltySetting');
    const settings = await PenaltySetting.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    await AuditLog.create({ userId: req.user._id, action: 'UPDATE_PENALTY_SETTINGS', targetType: 'Settings', details: { updated: Object.keys(req.body) } });
    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==================== SECURITY ====================

exports.getSecurityLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find().populate('userId', 'fullName email').sort({ createdAt: -1 }).limit(200);
    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getSecurityOverview = async (req, res) => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const failedLogins = await AuditLog.countDocuments({ action: 'LOGIN_FAILED', createdAt: { $gte: oneDayAgo } });
    const suspiciousActivities = await AuditLog.countDocuments({ action: { $in: ['SUSPICIOUS_ACTIVITY', 'UNAUTHORIZED_ACCESS'] }, createdAt: { $gte: oneDayAgo } });
    const activeSessions = await User.countDocuments({ lastLogin: { $gte: new Date(Date.now() - 30 * 60 * 1000) } });
    const securityAlerts = await AuditLog.countDocuments({ action: 'SECURITY_ALERT', createdAt: { $gte: oneDayAgo } });

    const recentEvents = await AuditLog.find({
      action: { $in: ['LOGIN_FAILED', 'SUSPICIOUS_ACTIVITY', 'SECURITY_ALERT', 'UNAUTHORIZED_ACCESS'] },
    }).populate('userId', 'fullName').sort({ createdAt: -1 }).limit(10);

    res.json({ failedLogins, suspiciousActivities, activeSessions, securityAlerts, recentEvents });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==================== EXPORT / PROFILE ====================

exports.exportData = async (req, res) => {
  try {
    const { type, format } = req.query;
    const geoQuery = buildGeoQuery(req.user);
    let data;

    switch (type) {
      case 'tax-collection':
        data = await TaxTransaction.find({ status: 'paid' }).populate('businessId', 'name').sort({ paidAt: -1 }).limit(1000);
        break;
      case 'compliance':
        data = await exports.getComplianceReports(req, res);
        return;
      case 'businesses':
        data = await Business.find(geoQuery).populate('ownerId', 'fullName email').sort({ createdAt: -1 });
        break;
      case 'payments':
        data = await PaymentTransaction.find().sort({ createdAt: -1 }).limit(1000);
        break;
      case 'audit-logs':
        data = await AuditLog.find().populate('userId', 'fullName email').sort({ createdAt: -1 }).limit(1000);
        break;
      case 'inactivity':
        data = await ActivityReport.find().populate('businessId', 'name').sort({ createdAt: -1 });
        break;
      default:
        return res.status(400).json({ message: 'Invalid export type' });
    }

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=smarttax-${type}.csv`);
      res.write(Object.keys(data[0] || {}).join(',') + '\n');
      data.forEach((row) => {
        res.write(Object.values(row.toObject ? row.toObject() : row).join(',') + '\n');
      });
      res.end();
    } else {
      res.json(data);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAdminProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateAdminProfile = async (req, res) => {
  try {
    const updates = {};
    if (req.body.fullName) updates.fullName = req.body.fullName;
    if (req.body.phoneNumber) updates.phoneNumber = req.body.phoneNumber;
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
