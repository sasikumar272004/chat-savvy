const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');

// Create a new chat
router.post('/', async (req, res) => {
  try {
    const newChat = new Chat(req.body);
    await newChat.save();
    res.status(201).json(newChat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all chats
router.get('/', async (req, res) => {
  try {
    const chats = await Chat.find().sort({ date: -1 });
    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a specific chat
router.get('/:id', async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a chat (e.g., add new message or files)
router.put('/:id', async (req, res) => {
  try {
    const updatedChat = await Chat.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.json(updatedChat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a chat
router.delete('/:id', async (req, res) => {
  try {
    await Chat.findByIdAndDelete(req.params.id);
    res.json({ message: 'Chat deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
