const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');
const { geoScopeAuth } = require('../middleware/geoScopeAuth');
const { roleAuth } = require('../middleware/roleAuth');
const { hasPermission } = require('../utils/permissions');
const activityController = require('../controllers/activityController');

router.use(protect);
router.use(authorize('sector_admin', 'district_admin', 'provincial_admin', 'national_admin'));
router.use(geoScopeAuth);

router.get('/dashboard/stats', adminController.getDashboardStats);
router.get('/dashboard/charts', adminController.getChartData);

router.get('/businesses/pending', adminController.getPendingBusinesses);
router.get('/businesses/all', adminController.getAllBusinesses);
router.get('/businesses/geographic', adminController.getBusinessesByGeography);
router.post('/businesses/:id/approve', roleAuth('sector_admin', 'district_admin', 'provincial_admin', 'national_admin'), adminController.approveBusiness);
router.post('/businesses/:id/reject', roleAuth('sector_admin', 'district_admin', 'provincial_admin', 'national_admin'), adminController.rejectBusiness);
router.post('/businesses/:id/suspend', roleAuth('national_admin', 'provincial_admin'), adminController.suspendBusiness);
router.post('/businesses/:id/reactivate', roleAuth('national_admin'), adminController.reactivateBusiness);

router.get('/inactivity', activityController.getInactivityReportsForAdmin);
router.patch('/inactivity/:id/review', activityController.reviewReport);
router.get('/inactivity/explanations', adminController.getInactivityExplanations);
router.post('/inactivity/:id/flag', roleAuth('sector_admin'), adminController.flagBusiness);

router.get('/tax-revenue', adminController.getTaxRevenue);
router.get('/compliance-reports', adminController.getComplianceReports);
router.get('/reports/tax-collection', adminController.getTaxCollectionReport);
router.get('/audit-logs', adminController.getAuditLogs);

router.get('/users/admins', roleAuth('national_admin', 'provincial_admin', 'district_admin'), adminController.getAdminUsers);
router.post('/users/admins', roleAuth('national_admin', 'provincial_admin', 'district_admin'), adminController.createAdminUser);
router.patch('/users/:id', roleAuth('national_admin', 'provincial_admin', 'district_admin'), adminController.updateAdminUser);
router.delete('/users/:id', roleAuth('national_admin'), adminController.deleteAdminUser);

router.get('/users/business-owners', roleAuth('national_admin'), adminController.getAllBusinessOwners);

router.get('/payment-monitoring', roleAuth('national_admin', 'provincial_admin', 'district_admin'), adminController.getPaymentMonitoring);
router.get('/momo-transactions', roleAuth('national_admin'), adminController.getMomoTransactions);

router.get('/national-analytics', roleAuth('national_admin'), adminController.getNationalAnalytics);
router.get('/provincial-analytics', roleAuth('national_admin', 'provincial_admin'), adminController.getProvincialAnalytics);
router.get('/district-analytics', roleAuth('national_admin', 'provincial_admin', 'district_admin'), adminController.getDistrictAnalytics);
router.get('/province-performance', roleAuth('national_admin'), adminController.getProvincePerformance);
router.get('/district-monitoring', roleAuth('national_admin', 'provincial_admin'), adminController.getDistrictMonitoring);
router.get('/sector-monitoring', roleAuth('national_admin', 'provincial_admin', 'district_admin'), adminController.getSectorMonitoring);

router.get('/ai-insights', roleAuth('national_admin'), adminController.getAiInsights);
router.get('/activity-monitoring', adminController.getActivityMonitoring);
router.get('/business-locations', roleAuth('national_admin'), adminController.getBusinessLocations);

router.get('/payment-plans', roleAuth('sector_admin'), adminController.getPaymentPlans);
router.post('/payment-plans', roleAuth('sector_admin'), adminController.createPaymentPlan);

router.get('/settings', roleAuth('national_admin'), adminController.getSystemSettings);
router.put('/settings', roleAuth('national_admin'), adminController.updateSystemSettings);
router.get('/tax-settings', roleAuth('national_admin'), adminController.getTaxSettings);
router.put('/tax-settings', roleAuth('national_admin'), adminController.updateTaxSettings);
router.get('/penalty-settings', roleAuth('national_admin'), adminController.getPenaltySettings);
router.put('/penalty-settings', roleAuth('national_admin'), adminController.updatePenaltySettings);

router.get('/security/logs', roleAuth('national_admin'), adminController.getSecurityLogs);
router.get('/security/overview', roleAuth('national_admin'), adminController.getSecurityOverview);

router.get('/export', adminController.exportData);

router.get('/profile', adminController.getAdminProfile);
router.put('/profile', adminController.updateAdminProfile);

router.get('/revenue-monitoring', adminController.getRevenueMonitoring);

module.exports = router;
