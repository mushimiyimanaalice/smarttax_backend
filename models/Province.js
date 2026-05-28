const mongoose = require('mongoose');

const provinceSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // e.g. "Kigali" or "Kigali City"
  name: { type: String, required: true },
  code: { type: String, required: true }
});

module.exports = mongoose.model('Province', provinceSchema);
