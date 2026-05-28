/**
 * Creates test admin accounts. Run: npm run seed:admin
 * Requires MongoDB running.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const ADMINS = [
  {
    email: 'national.admin@smarttax.rw',
    password: 'Admin@12345',
    fullName: 'National Admin',
    phoneNumber: '0780000001',
    role: 'national_admin',
  },
  {
    email: 'provincial.admin@smarttax.rw',
    password: 'Admin@12345',
    fullName: 'Provincial Admin',
    phoneNumber: '0780000002',
    role: 'provincial_admin',
    province: 'City of Kigali',
    provinceId: 'City of Kigali',
  },
  {
    email: 'district.admin@smarttax.rw',
    password: 'Admin@12345',
    fullName: 'District Admin',
    phoneNumber: '0780000003',
    role: 'district_admin',
    province: 'City of Kigali',
    provinceId: 'City of Kigali',
    district: 'Gasabo',
    districtId: 'Gasabo',
  },
  {
    email: 'sector.admin@smarttax.rw',
    password: 'Admin@12345',
    fullName: 'Sector Admin',
    phoneNumber: '0780000004',
    role: 'sector_admin',
    province: 'City of Kigali',
    provinceId: 'City of Kigali',
    district: 'Gasabo',
    districtId: 'Gasabo',
    sector: 'Remera',
    sectorId: 'Remera',
  },
];

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smarttax';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB\n');
  console.log('=== SmartTax test admin accounts ===\n');

  for (const admin of ADMINS) {
    const existing = await User.findOne({ email: admin.email });
    if (existing) {
      existing.password = admin.password;
      existing.role = admin.role;
      existing.fullName = admin.fullName;
      existing.phoneNumber = admin.phoneNumber;
      existing.province = admin.province;
      existing.district = admin.district;
      existing.sector = admin.sector;
      existing.provinceId = admin.provinceId;
      existing.districtId = admin.districtId;
      existing.sectorId = admin.sectorId;
      existing.preferredLanguage = existing.preferredLanguage || 'en';
      await existing.save();
      console.log(`Updated: ${admin.email}`);
    } else {
      await User.create(admin);
      console.log(`Created: ${admin.email}`);
    }
    console.log(`  Role:     ${admin.role}`);
    console.log(`  Password: ${admin.password}\n`);
  }

  console.log('Login at /login then open /admin for the admin dashboard.');
  console.log('(Use national.admin@smarttax.rw for full access.)\n');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
