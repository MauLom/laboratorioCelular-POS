const Expense = require('../models/Expense');
const FranchiseLocation = require('../models/FranchiseLocation');

// Helper: obtener sucursales accesibles según el rol del usuario
const getAccessibleLocations = async (user) => {
  if (['Master admin', 'Administrador', 'Admin'].includes(user.role)) {
    // Puede acceder a todas las sucursales
    return await FranchiseLocation.find({ isActive: true });
  }
  if (user.role === 'Supervisor de sucursales') {
    return await FranchiseLocation.find({ type: 'Sucursal', isActive: true });
  }
  if (user.role === 'Supervisor de oficina') {
    return await FranchiseLocation.find({ type: 'Oficina', isActive: true });
  }
  if (user.franchiseLocation) {
    return [user.franchiseLocation];
  }
  return [];
};

// LISTAR GASTOS (con filtros por rol, sucursal, búsqueda y fecha)
exports.list = async (req, res) => {
  try {
    const { q, from, to, user } = req.query;

    // Base del filtro (rol del usuario)
    const query = req.roleFilter ? { ...req.roleFilter } : {};

    // Combinar con filtro de sucursal si existe
    if (req.franchiseFilter) {
      Object.assign(query, req.franchiseFilter);
    }

    const userRole = req.user.role;

    // Master admin / Administrador / Admin: ver todos
    if (['Master admin', 'Administrador', 'Admin'].includes(userRole)) {
      // sin restricciones
    } 
    // Cajero o Vendedor: filtrado por middleware
    else if (['Cajero', 'Vendedor'].includes(userRole)) {
      // ya filtrado por fecha y sucursal en applyRoleDataFilter
    } 
    // Supervisores o con sucursal asignada: mantener sus filtros
    else {
      // filtros adicionales de búsqueda
      if (q) {
        query.$or = [
          { reason: new RegExp(q, 'i') },
          { notes: new RegExp(q, 'i') },
          { user: new RegExp(q, 'i') },
        ];
      }

      if (from || to) {
        query.date = {};
        if (from) query.date.$gte = new Date(from);
        if (to) query.date.$lte = new Date(to);
      }

      if (user) query.user = new RegExp(user, 'i');
    }

    const expenses = await Expense.find(query)
      .sort({ date: -1 })
      .populate('franchiseLocation', 'name code type')
      .populate('createdBy', 'firstName lastName username role');

    res.json(expenses);
  } catch (error) {
    console.error('❌ Error al listar gastos:', error);
    res.status(500).json({ error: error.message });
  }
};

// OBTENER GASTO POR ID
exports.getOne = async (req, res) => {
  try {
    const query = { _id: req.params.id };

    // Solo filtrar acceso si no es Master/Admin
    if (!['Master admin', 'Administrador', 'Admin'].includes(req.user.role)) {
      const accessibleLocations = await getAccessibleLocations(req.user);
      const ids = accessibleLocations.map(loc => loc._id);
      query.franchiseLocation = { $in: ids };
    }

    const expense = await Expense.findOne(query)
      .populate('franchiseLocation', 'name code type')
      .populate('createdBy', 'firstName lastName username');

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found or access denied' });
    }

    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// CREAR GASTO
exports.create = async (req, res) => {
  try {
    const data = { ...req.body };

    // Cajero/Vendedor solo pueden crear en su sucursal
    if (['Cajero', 'Vendedor'].includes(req.user.role)) {
      if (!req.user.franchiseLocation) {
        return res.status(403).json({ error: 'Usuario sin sucursal asignada.' });
      }
      data.franchiseLocation = req.user.franchiseLocation._id;
    }

    data.createdBy = req.user._id;
    data.user = req.user.username || 'Usuario';

    const expense = new Expense(data);
    await expense.save();

    res.status(201).json(expense);
  } catch (error) {
    console.error('❌ Error al crear gasto:', error);
    res.status(400).json({ error: error.message });
  }
};

// ACTUALIZAR GASTO
exports.update = async (req, res) => {
  try {
    const query = { _id: req.params.id };

    // Solo restringir a roles no administrativos
    if (!['Master admin', 'Administrador', 'Admin'].includes(req.user.role)) {
      const accessibleLocations = await getAccessibleLocations(req.user);
      const ids = accessibleLocations.map(loc => loc._id);
      query.franchiseLocation = { $in: ids };
    }

    const updated = await Expense.findOneAndUpdate(query, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ error: 'Expense not found or access denied' });
    }

    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ELIMINAR GASTO
exports.remove = async (req, res) => {
  try {
    if (!['Master admin', 'Administrador', 'Admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Solo administradores pueden eliminar gastos.' });
    }

    const deleted = await Expense.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({ message: 'Gasto eliminado correctamente', deleted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};