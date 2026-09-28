const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');

// In-memory fallback if MongoDB connection is unavailable
const memoryUsers = new Map();

const generateToken = (id, name, email) => {
  return jwt.sign(
    { id, name, email },
    process.env.JWT_SECRET || 'meetspace_super_secret_jwt_key_2026_xYz987!',
    { expiresIn: '30d' }
  );
};

const isDbConnected = () => mongoose.connection.readyState === 1;

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and password'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (isDbConnected()) {
      const userExists = await User.findOne({ email: normalizedEmail });
      if (userExists) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email'
        });
      }

      const user = await User.create({
        name,
        email: normalizedEmail,
        password
      });

      const token = generateToken(user._id.toString(), user.name, user.email);

      return res.status(201).json({
        success: true,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          avatar: user.avatar
        },
        token
      });
    } else {
      // Fallback in-memory
      if (memoryUsers.has(normalizedEmail)) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email'
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const fakeId = 'usr_' + Date.now();

      const user = {
        id: fakeId,
        _id: fakeId,
        name,
        email: normalizedEmail,
        password: hashedPassword,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`
      };

      memoryUsers.set(normalizedEmail, user);
      const token = generateToken(fakeId, name, normalizedEmail);

      return res.status(201).json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        },
        token
      });
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (isDbConnected()) {
      const user = await User.findOne({ email: normalizedEmail }).select('+password');

      if (!user || !(await user.matchPassword(password))) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      const token = generateToken(user._id.toString(), user.name, user.email);

      return res.json({
        success: true,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          avatar: user.avatar
        },
        token
      });
    } else {
      // In-memory fallback
      const user = memoryUsers.get(normalizedEmail);

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      const token = generateToken(user.id, user.name, user.email);

      return res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        },
        token
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user._id || req.user.id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${req.user.name}`
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error retrieving profile'
    });
  }
};

module.exports = {
  register,
  login,
  getMe
};
