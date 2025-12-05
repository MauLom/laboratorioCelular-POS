const jwt = require('jsonwebtoken');
const User = require('../models/User');
const FranchiseLocation = require('../models/FranchiseLocation');
const { ROLES } = require("../utils/roles");

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

    // Attach user to request (Mongoose document with mustChangePassword flag accessible)
    req.user = user;
    // Ensure mustChangePassword flag is explicitly available (it's already in the schema)
    req.user.mustChangePassword = user.mustChangePassword || false;
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

const requireMasterAdmin = authorize([ROLES.MASTER_ADMIN]);

const canManageLocation = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });

  const role = req.user.role;

  if ([ROLES.MASTER_ADMIN, ROLES.MULTI_BRANCH_SUPERVISOR, ROLES.OFFICE_SUPERVISOR].includes(role)) {
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
    if (role === ROLES.MASTER_ADMIN || role === ROLES.GLOBAL_ADMIN) {
      return next();
    }

    // Supervisores de sucursales
    if (role === ROLES.MULTI_BRANCH_SUPERVISOR) {
      const locs = await FranchiseLocation.find({ type: 'Sucursal', isActive: true }).select('_id');
      req.franchiseFilter = { franchiseLocation: { $in: locs.map((l) => l._id) } };
      return next();
    }

    // Supervisores de oficina
    if (role === ROLES.OFFICE_SUPERVISOR) {
      const locs = await FranchiseLocation.find({ type: 'Oficina', isActive: true }).select('_id');
      req.franchiseFilter = { franchiseLocation: { $in: locs.map((l) => l._id) } };
      return next();
    }

    // Vendedor o Cajero solo su sucursal y solo los gastos del día
    if ([ROLES.SELLER, ROLES.CASHIER].includes(role)) {
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
    res.status(500).json({ error: 'Internal server error (applyFranchiseFilter).' });
  }
};

const applyInventoryFilter = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required.' });

    const role = req.user.role;

    // Master admin y administradores ven todo
    if ([ROLES.MASTER_ADMIN, ROLES.ADMIN, ROLES.GLOBAL_ADMIN].includes(role)) {
      return next();
    }

    // Supervisores de sucursales u oficina: segun tipo
    if (role === ROLES.MULTI_BRANCH_SUPERVISOR) {
      const locs = await FranchiseLocation.find({ type: 'Sucursal', isActive: true }).select('_id');
      req.franchiseFilter = { franchiseLocation: { $in: locs.map((l) => l._id) } };
      return next();
    }

    if (role === ROLES.OFFICE_SUPERVISOR) {
      const locs = await FranchiseLocation.find({ type: 'Oficina', isActive: true }).select('_id');
      req.franchiseFilter = { franchiseLocation: { $in: locs.map((l) => l._id) } };
      return next();
    }

    // Vendedor o Cajero = solo inventario de su sucursal actual
    if ([ROLES.SELLER, ROLES.CASHIER].includes(role)) {
      if (!req.user.franchiseLocation?._id) {
        return res.status(403).json({ error: 'Sin sucursal asignada.' });
      }

      req.franchiseFilter = { franchiseLocation: req.user.franchiseLocation._id };
      return next();
    }

    // Por defecto, si tiene sucursal asignada
    if (req.user.franchiseLocation?._id) {
      req.franchiseFilter = { franchiseLocation: req.user.franchiseLocation._id };
      return next();
    }

    next();
  } catch (err) {
    res.status(500).json({ error: 'Internal server error (applyInventoryFilter).' });
  }
};

const applyRoleDataFilter = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });

  const { role, _id } = req.user;

  // Admins ven todo
  if ([ROLES.MASTER_ADMIN, ROLES.ADMIN, ROLES.ADMIN_SHORT, ROLES.GLOBAL_ADMIN].includes(role)) {
    req.roleFilter = {};
    return next();
  }

  // Cajeros/Vendedores: solo sus propios registros (ademas del filtro por fecha y sucursal)
  if ([ROLES.CASHIER, ROLES.SELLER].includes(role)) {
    req.roleFilter = { createdBy: _id };
    return next();
  }

  // Supervisores sin filtro por usuario, ya se filtra por sucursal en applyFranchiseFilter
  req.roleFilter = {};
  next();
};

module.exports = {
  authenticate,
  authorize,
  requireMasterAdmin,
  canManageLocation,
  applyFranchiseFilter,
  applyInventoryFilter,
  applyRoleDataFilter,
};