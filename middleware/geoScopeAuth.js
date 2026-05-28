const { buildBusinessGeoFilter, getGeoScope, isAdminRole } = require('../utils/geoScope');

/**
 * Attaches req.geoFilter and req.geoScope for admin data queries.
 * National admin: no geographic restriction.
 */
const geoScopeAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  if (!isAdminRole(req.user.role)) {
    return res.status(403).json({ message: 'Admin access required' });
  }

  req.geoScope = getGeoScope(req.user);
  req.geoFilter = buildBusinessGeoFilter(req.user);
  next();
};

/** Ensure target business document is within admin's geographic scope */
const assertBusinessInScope = async (req, business) => {
  if (!business) return false;
  if (req.user.role === 'national_admin') return true;

  const f = buildBusinessGeoFilter(req.user, { _id: business._id });
  const Business = require('../models/Business');
  const found = await Business.findOne(f).select('_id');
  return !!found;
};

module.exports = { geoScopeAuth, assertBusinessInScope };
