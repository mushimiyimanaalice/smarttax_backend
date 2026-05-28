const ADMIN_ROLES = ['national_admin', 'provincial_admin', 'district_admin', 'sector_admin'];

const isAdminRole = (role) => ADMIN_ROLES.includes(role);

const PROVINCE_ALIASES = { kigali: 'City of Kigali', northern: 'Northern Province', southern: 'Southern Province', eastern: 'Eastern Province', western: 'Western Province' };
const KNOWN_PROVINCES = ['City of Kigali', 'Northern Province', 'Southern Province', 'Eastern Province', 'Western Province'];
const normalizeProvince = (p) => {
  if (!p) return '';
  if (KNOWN_PROVINCES.includes(p)) return p;
  const alias = PROVINCE_ALIASES[p.toLowerCase().trim()];
  return alias || p;
};
const toTitleCase = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;

/** Build MongoDB filter for Business.address fields from admin user scope */
const buildBusinessGeoFilter = (user, base = {}) => {
  const query = { ...base };
  if (!user || !isAdminRole(user.role)) return query;

  const province = normalizeProvince(user.province);
  const district = toTitleCase(user.district);
  const sector = toTitleCase(user.sector);

  if (user.role === 'sector_admin' && sector) {
    query['address.sector'] = sector;
    if (district) query['address.district'] = district;
    if (province) query['address.province'] = province;
  } else if (user.role === 'district_admin' && district) {
    query['address.district'] = district;
    if (province) query['address.province'] = province;
  } else if (user.role === 'provincial_admin' && province) {
    query['address.province'] = province;
  }

  return query;
};

const getGeoScope = (user) => ({
  provinceId: normalizeProvince(user?.province) || null,
  districtId: toTitleCase(user?.district) || null,
  sectorId: toTitleCase(user?.sector) || null,
  role: user?.role,
});

const ACTIVE_BUSINESS_STATUSES = ['active', 'approved', 'pending_approval'];

const isBusinessActive = (status) => ACTIVE_BUSINESS_STATUSES.includes(status);

module.exports = {
  ADMIN_ROLES,
  isAdminRole,
  buildBusinessGeoFilter,
  getGeoScope,
  ACTIVE_BUSINESS_STATUSES,
  isBusinessActive,
};
