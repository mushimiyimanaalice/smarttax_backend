require('dotenv').config();
const mongoose = require('mongoose');
const Province = require('../models/Province');
const District = require('../models/District');
const Sector = require('../models/Sector');

const GEOGRAPHY = {
  provinces: [
    { _id: 'Kigali', name: 'Kigali City', code: 'KGL' },
    { _id: 'Northern', name: 'Northern Province', code: 'NORT' },
    { _id: 'Southern', name: 'Southern Province', code: 'SOUT' },
    { _id: 'Eastern', name: 'Eastern Province', code: 'EAST' },
    { _id: 'Western', name: 'Western Province', code: 'WEST' }
  ],
  districts: [
    // Kigali
    { _id: 'Gasabo', name: 'Gasabo', provinceId: 'Kigali' },
    { _id: 'Nyarugenge', name: 'Nyarugenge', provinceId: 'Kigali' },
    { _id: 'Kicukiro', name: 'Kicukiro', provinceId: 'Kigali' },
    // Northern
    { _id: 'Musanze', name: 'Musanze', provinceId: 'Northern' },
    { _id: 'Gicumbi', name: 'Gicumbi', provinceId: 'Northern' },
    // Southern
    { _id: 'Huye', name: 'Huye', provinceId: 'Southern' },
    { _id: 'Nyanza', name: 'Nyanza', provinceId: 'Southern' },
    // Eastern
    { _id: 'Rwamagana', name: 'Rwamagana', provinceId: 'Eastern' },
    { _id: 'Nyagatare', name: 'Nyagatare', provinceId: 'Eastern' },
    // Western
    { _id: 'Rubavu', name: 'Rubavu', provinceId: 'Western' },
    { _id: 'Karongi', name: 'Karongi', provinceId: 'Western' }
  ],
  sectors: [
    // Gasabo
    { _id: 'Remera', name: 'Remera', districtId: 'Gasabo', provinceId: 'Kigali' },
    { _id: 'Kimironko', name: 'Kimironko', districtId: 'Gasabo', provinceId: 'Kigali' },
    { _id: 'Kacyiru', name: 'Kacyiru', districtId: 'Gasabo', provinceId: 'Kigali' },
    // Nyarugenge
    { _id: 'Muhima', name: 'Muhima', districtId: 'Nyarugenge', provinceId: 'Kigali' },
    { _id: 'Nyamirambo', name: 'Nyamirambo', districtId: 'Nyarugenge', provinceId: 'Kigali' },
    // Kicukiro
    { _id: 'Kanombe', name: 'Kanombe', districtId: 'Kicukiro', provinceId: 'Kigali' },
    { _id: 'Kagarama', name: 'Kagarama', districtId: 'Kicukiro', provinceId: 'Kigali' },
    // Musanze
    { _id: 'Muhoza', name: 'Muhoza', districtId: 'Musanze', provinceId: 'Northern' },
    { _id: 'Kinigi', name: 'Kinigi', districtId: 'Musanze', provinceId: 'Northern' },
    // Huye
    { _id: 'Ngoma', name: 'Ngoma', districtId: 'Huye', provinceId: 'Southern' },
    { _id: 'Mukura', name: 'Mukura', districtId: 'Huye', provinceId: 'Southern' },
    // Rwamagana
    { _id: 'Fumbwe', name: 'Fumbwe', districtId: 'Rwamagana', provinceId: 'Eastern' },
    // Rubavu
    { _id: 'Gisenyi', name: 'Gisenyi', districtId: 'Rubavu', provinceId: 'Western' }
  ]
};

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smarttax';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB for geo seeding...');

  // Seeding Provinces
  await Province.deleteMany({});
  for (const prov of GEOGRAPHY.provinces) {
    await Province.create(prov);
  }
  console.log(`✅ Seeded ${GEOGRAPHY.provinces.length} Provinces.`);

  // Seeding Districts
  await District.deleteMany({});
  for (const dist of GEOGRAPHY.districts) {
    await District.create(dist);
  }
  console.log(`✅ Seeded ${GEOGRAPHY.districts.length} Districts.`);

  // Seeding Sectors
  await Sector.deleteMany({});
  for (const sec of GEOGRAPHY.sectors) {
    await Sector.create(sec);
  }
  console.log(`✅ Seeded ${GEOGRAPHY.sectors.length} Sectors.`);

  await mongoose.disconnect();
  console.log('Geo seeding finished successfully!');
}

seed().catch(err => {
  console.error('Geo seeding failed:', err);
  process.exit(1);
});
