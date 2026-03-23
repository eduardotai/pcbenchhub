const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth, generateToken } = require('../middleware/auth');
const { validateRegister, validateProfile } = require('../middleware/validate');
const activityTracker = require('../utils/activityTracker');

router.post('/register', validateRegister, async (req, res) => {
  try {
    const { email, password, username, experienceLevel } = req.body;

    const existingEmail = User.findByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const existingUsername = User.findByUsername(username);
    if (existingUsername) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const user = User.create({ email, password, username, experienceLevel });
    activityTracker.userRegistered(user.id);
    
    const token = generateToken(user.id);
    
    res.status(201).json({
      message: 'Registration successful. Please verify your email.',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        experienceLevel: user.experienceLevel,
        isVerified: false
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!User.verifyPassword(user, password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.is_banned) {
      return res.status(403).json({ error: 'Account is banned' });
    }

    const token = generateToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        experienceLevel: user.experience_level,
        hardwareSetup: user.hardware_setup,
        isVerified: user.is_verified,
        isAdmin: user.email === 'admin@pcbenchhub.com'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/verify-email', auth, async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Verification token required' });
    }

    const verified = User.verifyEmail(token);
    if (!verified) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

router.get('/profile', auth, async (req, res) => {
  try {
    const user = User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const Benchmark = require('../models/Benchmark');
    const submissionCount = Benchmark.countByUserId(user.id);

    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      experienceLevel: user.experience_level,
      hardwareSetup: user.hardware_setup,
      isVerified: user.is_verified,
      createdAt: user.created_at,
      submissionCount
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

router.put('/profile', auth, validateProfile, async (req, res) => {
  try {
    const { username, experienceLevel, hardwareSetup } = req.body;

    if (username && username !== req.user.username) {
      const existing = User.findByUsername(username);
      if (existing) {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }

    const updated = User.update(req.user.id, { username, experienceLevel, hardwareSetup });

    res.json({
      id: updated.id,
      email: updated.email,
      username: updated.username,
      experienceLevel: updated.experience_level,
      hardwareSetup: updated.hardware_setup,
      isVerified: updated.is_verified
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.post('/resend-verification', auth, async (req, res) => {
  try {
    const user = User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.is_verified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    const newToken = require('uuid').v4();
    User.update(req.user.id, { verificationToken: newToken });

    res.json({ message: 'Verification email sent', token: newToken });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification' });
  }
});

module.exports = router;
