const Expense = require('../models/Expense');
const FranchiseLocation = require('../models/FranchiseLocation');

function getTodayString() {
  return new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Monterrey'
  });
}

exports.list = async (req, res) => {
  try {
    const { q, from, to, user } = req.query;
    const userRole = req.user.role;

    const isAdmin = [
      'Master admin',
      'Administrador',
      'Admin',
      'Supervisor de oficina',
      'Supervisor de sucursales'
    ].includes(userRole);

    const query = {};

    if (!isAdmin) {
      const branchDetected = req.headers['x-branch-id'];

      if (!branchDetected) {
        return res.json([]);
      }

      query.franchiseLocation = branchDetected;
      query.date = getTodayString();
    }

    if (isAdmin && (from || to)) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }

    if (q) {
      query.$or = [
        { reason: new RegExp(q, 'i') },
        { notes: new RegExp(q, 'i') },
        { user: new RegExp(user, 'i') }
      ];
    }

    if (user) {
      query.user = new RegExp(user, 'i');
    }

    const expenses = await Expense.find(query)
      .sort({ createdAt: -1 })
      .populate('franchiseLocation', 'name code type')
      .populate('createdBy', 'firstName lastName username role');

    res.json(expenses);

  } catch (error) {
    console.error('Error al listar gastos:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('franchiseLocation', 'name code type')
      .populate('createdBy', 'firstName lastName username role');

    if (!expense) {
      return res.status(404).json({ error: 'Gasto no encontrado' });
    }

    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const data = req.body;

    if (!data.franchiseLocation) {
      return res.status(400).json({ error: 'Sucursal requerida' });
    }

    const exists = await FranchiseLocation.findById(data.franchiseLocation);
    if (!exists) {
      return res.status(400).json({ error: 'Sucursal inválida' });
    }

    const expense = new Expense({
      reason: data.reason,
      amount: data.amount,
      user: req.user.username,
      createdBy: req.user._id,
      franchiseLocation: data.franchiseLocation,
      date: data.date || getTodayString(),
      notes: data.notes || ''
    });

    await expense.save();
    res.status(201).json(expense);

  } catch (error) {
    console.error('Error creando gasto:', error);
    res.status(400).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const updated = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'No encontrado' });
    }

    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const deleted = await Expense.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: 'No encontrado' });
    }

    res.json({ message: 'Gasto eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};