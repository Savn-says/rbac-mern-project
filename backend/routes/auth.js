const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

// Rate limit: 5 login attempts per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { message: 'Too many login attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// helpers
const createAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

const createRefreshToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

// Login route
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required!' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials!' });
    }

    const jti = crypto.randomUUID();
    user.refreshTokenJti = jti;
    await user.save();

    const token = createAccessToken({ userId: user._id, role: user.role });
    const refreshToken = createRefreshToken({ userId: user._id, role: user.role, jti });

    res.cookie('rt', refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      message: 'Login successful! 🎟️',
      token,
      user: { id: user._id, username: user.username, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: 'Login error', error: error.message });
  }
});

// Refresh route with reuse detection
router.post('/refresh', async (req, res) => {
  try {
    const token = req.cookies?.rt;
    if (!token) return res.status(401).json({ message: 'No refresh token' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ message: 'User not found' });
    if (user.refreshTokenJti !== decoded.jti) {
      user.refreshTokenJti = null;
      await user.save();
      return res.status(401).json({ message: 'Refresh token reuse detected' });
    }
    // rotate
    const newJti = crypto.randomUUID();
    user.refreshTokenJti = newJti;
    await user.save();
    const newAccess = createAccessToken({ userId: user._id, role: user.role });
    const newRefresh = createRefreshToken({ userId: user._id, role: user.role, jti: newJti });
    res.cookie('rt', newRefresh, {
      httpOnly: true,
      sameSite: 'strict',
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.json({ token: newAccess });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
});

// Logout route
router.post('/logout', async (req, res) => {
  try {
    const token = req.cookies?.rt;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        await User.findByIdAndUpdate(decoded.userId, { $set: { refreshTokenJti: null } });
      } catch {}
    }
    res.clearCookie('rt');
    res.json({ message: 'Logged out' });
  } catch (error) {
    res.status(500).json({ message: 'Logout error' });
  }
});

module.exports = router;