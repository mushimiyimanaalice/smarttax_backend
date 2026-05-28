const Business = require('../models/Business');
const { isAdminRole, isBusinessActive } = require('../utils/geoScope');

/**
 * Resolves active business for business_owner requests.
 * Header X-Business-Id or user.activeBusinessId / businessId.
 */
const businessContext = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  if (isAdminRole(req.user.role)) {
    return next();
  }

  const businessId =
    req.headers['x-business-id'] ||
    req.user.activeBusinessId ||
    req.user.businessId;

  if (!businessId) {
    return res.status(400).json({ message: 'No active business selected' });
  }

  const business = await Business.findOne({
    _id: businessId,
    ownerId: req.user._id,
  });

  if (!business) {
    console.warn(`[businessContext] No business found for id=${businessId}, userId=${req.user._id}, role=${req.user.role}`);
    return res.status(403).json({ message: 'Business not found or access denied' });
  }

  if (!isBusinessActive(business.status)) {
    return res.status(403).json({
      message: 'Business is not active. Wait for sector admin approval.',
      status: business.status,
    });
  }

  req.businessId = business._id;
  req.activeBusiness = business;
  next();
};

module.exports = { businessContext };
