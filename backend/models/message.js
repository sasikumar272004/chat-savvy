const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chatId: String,
  text: String,
  isUser: Boolean,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);
