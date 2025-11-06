const Expense = require('../models/Expense');
const FranchiseLocation = require('../models/FranchiseLocation');

// Helper: obtener sucursales accesibles según el rol del usuario
const getAccessibleLocations = async (user) => {
  if (['Master admin', 'Administrador', 'Admin'].includes(user.role)) {
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

exports.list = async (req, res) => {
  try {
    const { q, from, to, user } = req.query;

    // Base del filtro (rol y sucursal)
    const query = { ...(req.roleFilter || {}), ...(req.franchiseFilter || {}) };

    // Evitar sobreescribir el filtro de fecha del middleware
    const userRole = req.user.role;

    // Solo los roles superiores pueden aplicar rango de fechas libremente
    if (['Master admin', 'Administrador', 'Admin', 'Supervisor de oficina', 'Supervisor de sucursales'].includes(userRole)) {
      if (from || to) {
        query.date = {};
        if (from) query.date.$gte = new Date(from);
        if (to) query.date.$lte = new Date(to);
      }
    }

    // Filtros de texto o usuario
    if (q) {
      query.$or = [
        { reason: new RegExp(q, 'i') },
        { notes: new RegExp(q, 'i') },
        { user: new RegExp(q, 'i') },
      ];
    }
    if (user) query.user = new RegExp(user, 'i');

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

exports.getOne = async (req, res) => {
  try {
    const query = { _id: req.params.id };

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

    // Registrar autor y fecha actual si no se especifica
    data.createdBy = req.user._id;
    data.user = req.user.username || 'Usuario';
    if (!data.date) {
      const now = new Date();
      const localNow = new Date(
        now.toLocaleString('en-US', { timeZone: 'America/Monterrey' })
      );
      
      const year = localNow.getFullYear();
      const month = String(localNow.getMonth() + 1).padStart(2, '0');
      const day = String(localNow.getDate()).padStart(2, '0');

      data.date = new Date(`${year}-${month}-${day}T00:00:00`);
    }  

    console.log('🕒 Fecha guardada local (sin UTC):', data.date);

    const expense = new Expense(data);
    await expense.save();

    res.status(201).json(expense);
  } catch (error) {
    console.error('❌ Error al crear gasto:', error);
    res.status(400).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const query = { _id: req.params.id };

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