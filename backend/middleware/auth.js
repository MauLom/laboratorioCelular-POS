const jwt = require('jsonwebtoken');
const User = require('../models/User');
const FranchiseLocation = require('../models/FranchiseLocation');

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
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Server error during authentication.' });
  }
};

const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required.' });

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied. Insufficient permissions.',
        required: allowedRoles,
        current: req.user.role,
      });
    }

    next();
  };
};

const requireMasterAdmin = authorize(['Master admin']);

const canManageLocation = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });

  const role = req.user.role;

  if (['Master admin', 'Supervisor de sucursales', 'Supervisor de oficina'].includes(role)) {
    return next();
  }

  const targetLocationId = req.params.locationId || req.body.franchiseLocation;
  if (
    req.user.franchiseLocation &&
    req.user.franchiseLocation._id.toString() === targetLocationId
  ) {
    return next();
  }

  return res.status(403).json({ error: 'Access denied. Cannot manage this location.' });
};

const applyFranchiseFilter = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required.' });

    const role = req.user.role;

    // Master admin ve todo
    if (role === 'Master admin' || role === 'Administrador general') {
      return next();
    }

    // Supervisores de sucursales
    if (role === 'Supervisor de sucursales') {
      const locs = await FranchiseLocation.find({ type: 'Sucursal', isActive: true }).select('_id');
      req.franchiseFilter = { franchiseLocation: { $in: locs.map((l) => l._id) } };
      return next();
    }

    // Supervisores de oficina
    if (role === 'Supervisor de oficina') {
      const locs = await FranchiseLocation.find({ type: 'Oficina', isActive: true }).select('_id');
      req.franchiseFilter = { franchiseLocation: { $in: locs.map((l) => l._id) } };
      return next();
    }

    // Vendedor o Cajero → solo su sucursal y solo los gastos del día
    if (['Vendedor', 'Cajero'].includes(role)) {
      if (!req.user.franchiseLocation?._id) {
        return res.status(403).json({ error: 'Sin sucursal asignada.' });
      }

      const now = new Date();
      const tzOffset = now.getTimezoneOffset() * 60000;
      const localNow = new Date(now - tzOffset);

      const startOfDay = new Date(localNow);
      startOfDay.setUTCHours(0, 0, 0, 0);

      const endOfDay = new Date(localNow);
      endOfDay.setUTCHours(23, 59, 59, 999);

      req.franchiseFilter = {
        franchiseLocation: req.user.franchiseLocation._id,
        date: { $gte: startOfDay, $lte: endOfDay },
      };
      return next();
    }

    // Por defecto, si tiene sucursal asignada
    if (req.user.franchiseLocation?._id) {
      req.franchiseFilter = { franchiseLocation: req.user.franchiseLocation._id };
      return next();
    }

    next();
  } catch (err) {
    console.error('applyFranchiseFilter error:', err);
    res.status(500).json({ error: 'Internal server error (applyFranchiseFilter).' });
  }
};

const applyRoleDataFilter = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });

  const { role, _id } = req.user;

  // Admins ven todo
  if (['Master admin', 'Administrador', 'Admin', 'Administrador general'].includes(role)) {
    req.roleFilter = {};
    return next();
  }

  // Cajeros/Vendedores: solo sus propios registros (además del filtro por fecha y sucursal)
  if (['Cajero', 'Vendedor'].includes(role)) {
    req.roleFilter = { createdBy: _id };
    return next();
  }

  // Supervisores → sin filtro por usuario, ya se filtra por sucursal en applyFranchiseFilter
  req.roleFilter = {};
  next();
};

module.exports = {
  authenticate,
  authorize,
  requireMasterAdmin,
  canManageLocation,
  applyFranchiseFilter,
  applyRoleDataFilter,
};