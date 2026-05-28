const formatUserResponse = (user) => ({
  id: user._id,
  email: user.email,
  fullName: user.fullName,
  role: user.role,
  businessId: user.businessId,
  businessIds: user.businessIds || [],
  activeBusinessId: user.activeBusinessId || user.businessId,
  language: user.language,
  preferredLanguage: user.preferredLanguage || user.language,
  province: user.province,
  district: user.district,
  sector: user.sector,
});

module.exports = { formatUserResponse };
