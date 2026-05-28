const ActivityReport = require('../models/ActivityReport');
const DailyActivity = require('../models/DailyActivity');
const { startOfDay } = require('../services/activityService');
const { buildBusinessGeoFilter } = require('../utils/geoScope');
const Business = require('../models/Business');

exports.submitInactivityReport = async (req, res) => {
  try {
    const { reason, description, note } = req.body;
    const businessId = req.businessId || req.user.activeBusinessId;
    const date = startOfDay();

    const report = await ActivityReport.findOneAndUpdate(
      { userId: req.user._id, businessId, date },
      {
        reason,
        description,
        note,
        status: 'submitted',
      },
      { upsert: true, new: true }
    );

    await DailyActivity.updateOne(
      { userId: req.user._id, businessId, date },
      { $set: { explanationSubmitted: true, inactive: true } }
    );

    res.status(201).json({ message: 'Report submitted', report });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMyPendingInactivity = async (req, res) => {
  try {
    const businessId = req.businessId || req.user.activeBusinessId;
    const date = startOfDay();
    const daily = await DailyActivity.findOne({
      userId: req.user._id,
      businessId,
      date,
      inactive: true,
      explanationSubmitted: false,
    });
    res.json({ needsExplanation: !!daily, daily });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getInactivityReportsForAdmin = async (req, res) => {
  try {
    const geoFilter = buildBusinessGeoFilter(req.user);
    const businesses = await Business.find(geoFilter).select('_id');
    const ids = businesses.map((b) => b._id);

    const reports = await ActivityReport.find({ businessId: { $in: ids } })
      .populate('userId', 'fullName email phoneNumber')
      .populate('businessId', 'name address taxIdentificationNumber status')
      .sort({ createdAt: -1 })
      .limit(100);

    const inactiveToday = await DailyActivity.find({
      businessId: { $in: ids },
      date: startOfDay(),
      inactive: true,
    })
      .populate('businessId', 'name address')
      .populate('userId', 'fullName');

    res.json({ reports, inactiveToday });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.reviewReport = async (req, res) => {
  try {
    const report = await ActivityReport.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    report.status = req.body.status || 'reviewed';
    report.reviewedBy = req.user._id;
    await report.save();

    res.json({ message: 'Report updated', report });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
