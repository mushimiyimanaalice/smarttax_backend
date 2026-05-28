const { chatWithAI } = require('../services/aiService');

exports.chat = async (req, res) => {
  try {
    const { message, language } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ message: 'Message required' });
    }

    const result = await chatWithAI({
      message: message.trim(),
      language: language || req.user.preferredLanguage || req.user.language,
      businessId: req.businessId || req.user.activeBusinessId,
      userId: req.user._id,
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'AI service error' });
  }
};

exports.getAssistantInfo = async (req, res) => {
  res.json({
    name: 'Umwishingizi',
    languages: ['en', 'rw', 'fr'],
    capabilities: ['sales', 'taxes', 'reports', 'pending_tax', 'pay_tax'],
  });
};
