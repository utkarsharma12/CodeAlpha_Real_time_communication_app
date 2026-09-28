const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'meetspace_super_secret_jwt_key_2026_xYz987!'
      );

      // Support DB user or fallback if offline/mock
      try {
        req.user = await User.findById(decoded.id).select('-password');
      } catch (dbErr) {
        req.user = { _id: decoded.id, name: decoded.name || 'User', email: decoded.email };
      }

      if (!req.user) {
        req.user = { _id: decoded.id, name: decoded.name || 'User', email: decoded.email };
      }

      return next();
    } catch (error) {
      console.error('Auth middleware error:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

const optionalProtect = async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'meetspace_super_secret_jwt_key_2026_xYz987!'
      );
      try {
        req.user = await User.findById(decoded.id).select('-password');
      } catch (e) {
        req.user = { _id: decoded.id, name: decoded.name || 'Guest', email: decoded.email };
      }
    } catch (e) {
      // optional, continue
    }
  }
  next();
};

module.exports = { protect, optionalProtect };
