const ROLES_HIERARCHY = {
  national_admin: 100,
  provincial_admin: 80,
  district_admin: 60,
  sector_admin: 40,
  business_owner: 10,
};

const PERMISSIONS = {
  'manage:admins': ['national_admin'],
  'manage:provincial_admins': ['national_admin'],
  'manage:district_admins': ['national_admin', 'provincial_admin'],
  'manage:sector_admins': ['national_admin', 'provincial_admin', 'district_admin'],
  'view:national_analytics': ['national_admin'],
  'view:provincial_analytics': ['national_admin', 'provincial_admin'],
  'view:district_analytics': ['national_admin', 'provincial_admin', 'district_admin'],
  'view:sector_analytics': ['national_admin', 'provincial_admin', 'district_admin', 'sector_admin'],
  'view:all_businesses': ['national_admin'],
  'manage:all_businesses': ['national_admin'],
  'approve:businesses': ['sector_admin', 'district_admin', 'provincial_admin', 'national_admin'],
  'suspend:businesses': ['national_admin', 'provincial_admin', 'district_admin'],
  'view:audit_logs': ['national_admin'],
  'view:payment_monitoring': ['national_admin', 'provincial_admin', 'district_admin'],
  'view:ai_insights': ['national_admin'],
  'manage:system_settings': ['national_admin'],
  'manage:tax_settings': ['national_admin'],
  'manage:penalty_settings': ['national_admin'],
  'view:security_center': ['national_admin'],
  'export:reports': ['national_admin', 'provincial_admin', 'district_admin', 'sector_admin'],
  'view:inactivity': ['sector_admin', 'district_admin', 'provincial_admin', 'national_admin'],
  'view:compliance': ['national_admin', 'provincial_admin', 'district_admin'],
  'view:revenue': ['national_admin', 'provincial_admin', 'district_admin'],
  'manage:businesses': ['sector_admin', 'district_admin', 'provincial_admin', 'national_admin'],
};

const hasPermission = (userRole, permission) => {
  const allowed = PERMISSIONS[permission];
  if (!allowed) return false;
  return allowed.includes(userRole);
};

const getRoleLevel = (role) => ROLES_HIERARCHY[role] || 0;

const canManageRole = (adminRole, targetRole) => {
  return getRoleLevel(adminRole) > getRoleLevel(targetRole);
};

module.exports = {
  ROLES_HIERARCHY,
  PERMISSIONS,
  hasPermission,
  getRoleLevel,
  canManageRole,
};
