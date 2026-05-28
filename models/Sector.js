const mongoose = require('mongoose');

const sectorSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // e.g. "Remera"
  name: { type: String, required: true },
  districtId: { type: String, required: true, ref: 'District' },
  provinceId: { type: String, required: true, ref: 'Province' }
});

module.exports = mongoose.model('Sector', sectorSchema);
