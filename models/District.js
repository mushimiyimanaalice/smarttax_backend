const mongoose = require('mongoose');

const districtSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // e.g. "Gasabo"
  name: { type: String, required: true },
  provinceId: { type: String, required: true, ref: 'Province' }
});

module.exports = mongoose.model('District', districtSchema);
