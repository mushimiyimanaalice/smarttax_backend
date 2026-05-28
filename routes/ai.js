const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const { businessContext } = require('../middleware/businessContext');

router.use(protect);
router.use(businessContext);

router.get('/info', aiController.getAssistantInfo);
router.post('/chat', aiController.chat);

module.exports = router;
