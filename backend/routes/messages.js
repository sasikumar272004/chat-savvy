const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// Save a new message
router.post('/', async (req, res) => {
  try {
    const message = new Message(req.body);
    await message.save();
    res.status(201).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all messages (optional)
router.get('/:chatId', async (req, res) => {
  try {
    const messages = await Message.find({ chatId: req.params.chatId });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
