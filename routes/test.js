// backend/routes/test.js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'API is working!' });
});

router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

module.exports = router;