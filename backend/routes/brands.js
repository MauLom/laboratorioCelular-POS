const express = require('express');
const Brand = require('../models/Brand');
const CharacteristicValue = require('../models/CharacteristicValue');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get all brands
router.get('/', authenticate, async (req, res) => {
  try {
    const brands = await Brand.find({ isActive: true }).sort({ name: 1 });
    res.json(brands);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las marcas' });
  }
});

// Get brand by id with characteristics
router.get('/:id', authenticate, async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand || !brand.isActive) return res.status(404).json({ error: 'Marca no encontrada' });

    const characteristics = await CharacteristicValue.find({ brand: req.params.id, isActive: true }).populate('characteristic', 'name type');

    res.json({ brand, characteristics });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la marca' });
  }
});

// Create brand
router.post('/', authenticate, async (req, res) => {
  try {
    const allowedRoles = ['Master admin', 'Supervisor de oficina', 'Oficina'];
    if (!allowedRoles.includes(req.user.role)) return res.status(403).json({ error: 'Acceso denegado. Permisos insuficientes.' });

    const { name, description } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'El nombre de la marca es requerido' });

    const existing = await Brand.findOne({ name: name.trim(), isActive: true });
    if (existing) return res.status(400).json({ error: 'Ya existe una marca con este nombre' });

    const brand = new Brand({ name: name.trim(), description: description?.trim(), createdBy: req.user.id });
    await brand.save();
    res.status(201).json(brand);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear la marca' });
  }
});

// Update brand
router.put('/:id', authenticate, async (req, res) => {
  try {
    const allowedRoles = ['Master admin', 'Supervisor de oficina', 'Oficina'];
    if (!allowedRoles.includes(req.user.role)) return res.status(403).json({ error: 'Acceso denegado. Permisos insuficientes.' });

    const { name, description } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'El nombre de la marca es requerido' });

    const existing = await Brand.findOne({ name: name.trim(), isActive: true, _id: { $ne: req.params.id } });
    if (existing) return res.status(400).json({ error: 'Ya existe una marca con este nombre' });

    const brand = await Brand.findByIdAndUpdate(req.params.id, { name: name.trim(), description: description?.trim() }, { new: true });
    if (!brand || !brand.isActive) return res.status(404).json({ error: 'Marca no encontrada' });

    res.json(brand);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar la marca' });
  }
});

// Delete brand (soft)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const allowedRoles = ['Master admin', 'Supervisor de oficina'];
    if (!allowedRoles.includes(req.user.role)) return res.status(403).json({ error: 'Acceso denegado. Permisos insuficientes.' });

    const brand = await Brand.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!brand) return res.status(404).json({ error: 'Marca no encontrada' });

    await CharacteristicValue.updateMany({ brand: req.params.id }, { isActive: false });

    res.json({ message: 'Marca eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la marca' });
  }
});

module.exports = router;
