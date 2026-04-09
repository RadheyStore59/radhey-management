const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const User = require('../models/user');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

// List users (Admin only)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const users = await User.find({})
      .select('_id id email role created_at')
      .sort({ created_at: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create user (Admin only)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const normalizedEmail = String(email || '').toLowerCase().trim();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const finalRole = role === 'Admin' ? 'Admin' : 'Staff';

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      id: crypto.randomUUID(),
      email: normalizedEmail,
      passwordHash,
      role: finalRole,
    });

    res.status(201).json({
      id: user.id,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user details (Admin only)
router.put('/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { email, role, password } = req.body;
    
    const updateData = {};
    
    if (email) {
      const normalizedEmail = String(email).toLowerCase().trim();
      // Check if email already exists for another user
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing && existing.id !== userId) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      updateData.email = normalizedEmail;
    }
    
    if (role) {
      updateData.role = role === 'Admin' ? 'Admin' : 'Staff';
    }
    
    if (password && password.length >= 6) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const updated = await User.findOneAndUpdate(
      { id: userId },
      updateData,
      { new: true }
    ).select('_id id email role created_at');

    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update user role (Admin only)
router.put('/:userId/role', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    const finalRole = role === 'Admin' ? 'Admin' : 'Staff';

    const updated = await User.findOneAndUpdate(
      { id: userId },
      { role: finalRole },
      { new: true }
    ).select('_id id email role created_at');

    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete user (Admin only)
router.delete('/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    await User.findOneAndDelete({ id: userId });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;

