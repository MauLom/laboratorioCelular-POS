const Expense = require('../models/Expense');
const FranchiseLocation = require('../models/FranchiseLocation');

function getTodayRange() {
  const now = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/Monterrey' })
  );

  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  return { start, end };
}

exports.list = async (req, res) => {
  try {
    const isAdmin = [
      'Master admin',
      'Administrador',
      'Admin',
      'Supervisor de oficina',
      'Supervisor de sucursales'
    ].includes(req.user.role);

    const query = {};

    const branchDetected = req.headers['x-branch-id'];

    if (!isAdmin) {
      if (!branchDetected) return res.json([]);

      const { start, end } = getTodayRange();

      query.franchiseLocation = branchDetected;
      query.date = { $gte: start, $lte: end };
    }

    const expenses = await Expense.find(query)
      .populate('franchiseLocation', 'name')
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });

    res.json(expenses);
  } catch (error) {
    console.error('Error listando gastos:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ error: 'No encontrado' });
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

    const now = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'America/Monterrey' })
    );

    const expense = new Expense({
      reason: data.reason,
      amount: data.amount,
      user: req.user.username,
      createdBy: req.user._id,
      franchiseLocation: data.franchiseLocation,
      date: now,
      notes: data.notes || ''
    });

    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    console.error('❌ Error creando gasto:', error);
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

    if (!updated) return res.status(404).json({ error: 'No encontrado' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const deleted = await Expense.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'No encontrado' });
    res.json({ message: 'Eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};