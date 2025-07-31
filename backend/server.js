const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connect
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ Mongo Error', err));

// Routes
app.use('/api/messages', require('./routes/messages'));
app.use('/api/chats', require('./routes/chats')); // 👈 ADD this line


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
