const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const authMiddleware = require('./middleware/auth');
const checkPermission = require('./middleware/permissions');

const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware for security and JSON parsing
app.use(helmet());
app.use(cors());
app.use(express.json());

// Connect to MongoDB before routes
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected! 🗄️'))
  .catch(err => console.error('MongoDB connection error:', err));

// Load auth routes
app.use('/api/auth', authRoutes);

// Load posts routes
const postsRoutes = require('./routes/posts');
app.use('/api/posts', postsRoutes);

// Basic route to test
app.get('/', (req, res) => {
  res.json({ message: 'RBAC MERN Backend is running! 🚀' });
});

// Protected route: Requires auth + Admin role
app.get('/api/protected', authMiddleware, checkPermission('users:manage'), (req, res) => {
  res.json({
    message: 'Access granted! You are an Admin. 👑',
    user: req.user
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});