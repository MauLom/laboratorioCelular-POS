const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided. Access denied.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).populate('franchiseLocation');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid token or inactive user.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.' });
    }
    res.status(500).json({ error: 'Server error during authentication.' });
  }
};

// Middleware to check if user has required role
const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied. Insufficient permissions.',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

// Middleware to check if user is Master admin
const requireMasterAdmin = authorize(['Master admin']);

// Middleware to check if user can manage users in their franchise location
const canManageLocation = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  // Master admin can manage all locations
  if (req.user.role === 'Master admin') {
    return next();
  }

  // Supervisor de sucursales can manage all branch locations
  if (req.user.role === 'Supervisor de sucursales') {
    return next();
  }

  // Supervisor de oficina can manage all office locations
  if (req.user.role === 'Supervisor de oficina') {
    return next();
  }

  // Other roles can only manage their own location
  const targetLocationId = req.params.locationId || req.body.franchiseLocation;
  if (req.user.franchiseLocation && req.user.franchiseLocation._id.toString() === targetLocationId) {
    return next();
  }

  return res.status(403).json({ error: 'Access denied. Cannot manage this location.' });
};

// Middleware to filter data by franchise location
const applyFranchiseFilter = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  // Master admin can see all data
  if (req.user.role === 'Master admin') {
    return next();
  }

  // Supervisor de sucursales can see all branch data
  if (req.user.role === 'Supervisor de sucursales') {
    // This middleware will be applied at the route level
    req.franchiseFilter = { type: 'Sucursal' };
    return next();
  }

  // Supervisor de oficina can see all office data
  if (req.user.role === 'Supervisor de oficina') {
    req.franchiseFilter = { type: 'Oficina' };
    return next();
  }

  // Other roles can only see their specific location data
  if (req.user.franchiseLocation) {
    req.franchiseFilter = { _id: req.user.franchiseLocation._id };
    return next();
  }

  return res.status(403).json({ error: 'Access denied. No franchise location assigned.' });
};

module.exports = {
  authenticate,
  authorize,
  requireMasterAdmin,
  canManageLocation,
  applyFranchiseFilter
};