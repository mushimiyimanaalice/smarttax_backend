const { isAdminRole } = require('../utils/geoScope');

/**
 * Restrict route to specific roles.
 * Usage: roleAuth('sector_admin', 'national_admin')
 */
const roleAuth =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role ${req.user.role} is not authorized for this action`,
      });
    }
    next();
  };

const adminOnly = roleAuth(
  'sector_admin',
  'district_admin',
  'provincial_admin',
  'national_admin'
);

const businessOwnerOnly = roleAuth('business_owner');

module.exports = { roleAuth, adminOnly, businessOwnerOnly, isAdminRole };
