const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  text: String,
  isUser: Boolean,
  timestamp: { type: Date, default: Date.now },
  files: [{
    name: String,
    content: String,
    type: String
  }],
  isFavorite: Boolean
});

const chatSchema = new mongoose.Schema({
  title: String,
  date: { type: Date, default: Date.now },
  uploadedFiles: [{
    name: String,
    content: String,
    type: String
  }],
  messages: [messageSchema]
});

module.exports = mongoose.model('Chat', chatSchema);
