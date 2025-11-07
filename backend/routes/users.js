const express = require('express');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const checkPermission = require('../middleware/permissions');
const router = express.Router();

// GET /api/users - Admin only: List all users
router.get('/', authMiddleware, checkPermission('users:manage'), async (req, res) => {
  try {
    const users = await User.find().select('-password'); // Hide passwords
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      userId: req.user.userId,
      role: req.user.role,
      action: 'users:read',
      outcome: 'success',
      count: users.length
    }));
    res.json({ message: 'Users fetched!', users });
  } catch (error) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      userId: req.user.userId,
      role: req.user.role,
      action: 'users:read',
      outcome: 'fail_error',
      error: error.message
    }));
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// PATCH /api/users/:id/role - Admin only: Update user role
router.patch('/:id/role', authMiddleware, checkPermission('users:manage'), async (req, res) => {
  try {
    const { role } = req.body;
    if (!['Viewer', 'Editor', 'Admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role!' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found!' });
    }

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      userId: req.user.userId,
      role: req.user.role,
      action: 'users:role:update',
      outcome: 'success',
      targetUserId: req.params.id,
      newRole: role
    }));

    res.json({ message: 'Role updated!', user });
  } catch (error) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      userId: req.user.userId,
      role: req.user.role,
      action: 'users:role:update',
      outcome: 'fail_error',
      error: error.message
    }));
    res.status(500).json({ message: 'Error updating role', error: error.message });
  }
});

module.exports = router;