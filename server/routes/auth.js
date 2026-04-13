const express = require('express');
const router = express.Router();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/user');
const { requireAuth } = require('../middleware/auth');

// Signup endpoint
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const role = 'Staff'; // signup defaults to Staff

    console.log('=== SIGNUP REQUEST ===');
    console.log('Email:', email);
    console.log('Name:', name);
    console.log('Password provided:', !!password);

    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ message: 'Email and password required' });
    }

    console.log('Checking for existing user with email:', String(email).toLowerCase().trim());
    const existing = await User.findOne({ email: String(email).toLowerCase().trim() });
    console.log('Existing user found:', !!existing);

    if (existing) {
      console.log('Email already exists');
      return res.status(400).json({ message: 'Email already exists' });
    }

    console.log('Creating new user...');
    const passwordHash = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');

    const user = await User.create({
      id: crypto.randomUUID(),
      email: String(email).toLowerCase().trim(),
      name: name || '',
      passwordHash,
      role,
    });

    console.log('User created successfully:', { id: user.id, email: user.email, name: user.name, role: user.role });

    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Debug endpoint to list all users
router.get('/debug/users', async (req, res) => {
  try {
    const users = await User.find({});
    console.log('Total users in database:', users.length);
    console.log('Users:', users.map(u => ({ id: u.id, email: u.email, name: u.name, role: u.role })));
    res.json({ 
      total: users.length, 
      users: users.map(u => ({ id: u.id, email: u.email, name: u.name, role: u.role }))
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('=== LOGIN REQUEST ===');
    console.log('Email:', email);
    console.log('Password provided:', !!password);

    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ message: 'Email and password required' });
    }

    console.log('Searching for user with email:', String(email).toLowerCase().trim());
    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    console.log('User found:', !!user);

    if (!user) {
      console.log('User not found - invalid credentials');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('Comparing password...');
    const ok = await bcrypt.compare(password, user.passwordHash);
    console.log('Password match:', ok);

    if (!ok) {
      console.log('Password mismatch - invalid credentials');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const jwtSecret = process.env.JWT_SECRET;
    console.log('JWT_SECRET exists:', !!jwtSecret);

    if (!jwtSecret) {
      console.log('JWT_SECRET missing');
      return res.status(500).json({ message: 'JWT_SECRET is missing in .env' });
    }

    console.log('Generating JWT token...');
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      jwtSecret,
      { expiresIn: '7d' }
    );

    console.log('Login successful for user:', { id: user.id, email: user.email, name: user.name, role: user.role });

    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Verify token and return user data
router.get('/verify', requireAuth, async (req, res) => {
  try {
    // Fetch full user data from database to ensure we have the name field
    const user = await User.findOne({ id: req.user.id });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Verify endpoint - User data from DB:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
