const express = require('express');
const Characteristic = require('../models/Characteristic');
const CharacteristicValue = require('../models/CharacteristicValue');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get all characteristics
router.get('/', authenticate, async (req, res) => {
  try {
    const chars = await Characteristic.find({ isActive: true }).sort({ name: 1 });
    res.json(chars);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las características' });
  }
});

// Get values for a characteristic, optionally filtered by brand
router.get('/:characteristicId/values', authenticate, async (req, res) => {
  try {
    const { characteristicId } = req.params;
    const { brandId } = req.query;

    const query = { characteristic: characteristicId, isActive: true };
    if (brandId) query.brand = brandId;

    const values = await CharacteristicValue.find(query).populate('brand', 'name').sort({ displayName: 1 });
    res.json(values);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los valores de la característica' });
  }
});

// Create characteristic
router.post('/', authenticate, async (req, res) => {
  try {
    const allowedRoles = ['Master admin', 'Supervisor de oficina', 'Oficina'];
    if (!allowedRoles.includes(req.user.role)) return res.status(403).json({ error: 'Acceso denegado. Permisos insuficientes.' });

    const { name, description, type } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'El nombre de la característica es requerido' });

    const existing = await Characteristic.findOne({ name: name.trim(), isActive: true });
    if (existing) return res.status(400).json({ error: 'Ya existe una característica con este nombre' });

    const char = new Characteristic({ name: name.trim(), description: description?.trim(), type: type || 'text', createdBy: req.user.id });
    await char.save();
    res.status(201).json(char);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear la característica' });
  }
});

// Create characteristic value for a brand
router.post('/:characteristicId/values', authenticate, async (req, res) => {
  try {
    const allowedRoles = ['Master admin', 'Supervisor de oficina', 'Oficina'];
    if (!allowedRoles.includes(req.user.role)) return res.status(403).json({ error: 'Acceso denegado. Permisos insuficientes.' });

    const { characteristicId } = req.params;
    const { brandId, value, displayName, hexColor } = req.body;

    if (!brandId || !value || !displayName) return res.status(400).json({ error: 'Marca, valor y nombre para mostrar son requeridos' });

    const characteristic = await Characteristic.findById(characteristicId);
    if (!characteristic || !characteristic.isActive) return res.status(404).json({ error: 'Característica no encontrada' });

    const existing = await CharacteristicValue.findOne({ characteristic: characteristicId, brand: brandId, value: value.trim(), isActive: true });
    if (existing) return res.status(400).json({ error: 'Ya existe este valor para la característica y marca seleccionadas' });

    const charValue = new CharacteristicValue({ characteristic: characteristicId, brand: brandId, value: value.trim(), displayName: displayName.trim(), hexColor: hexColor?.trim(), createdBy: req.user.id });
    await charValue.save();
    res.status(201).json(charValue);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el valor de la característica' });
  }
});

// Update characteristic
router.put('/:id', authenticate, async (req, res) => {
  try {
    const allowedRoles = ['Master admin', 'Supervisor de oficina', 'Oficina'];
    if (!allowedRoles.includes(req.user.role)) return res.status(403).json({ error: 'Acceso denegado. Permisos insuficientes.' });

    const { name, description, type } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'El nombre de la característica es requerido' });

    const existing = await Characteristic.findOne({ name: name.trim(), isActive: true, _id: { $ne: req.params.id } });
    if (existing) return res.status(400).json({ error: 'Ya existe una característica con este nombre' });

    const char = await Characteristic.findByIdAndUpdate(req.params.id, { name: name.trim(), description: description?.trim(), type: type || 'text' }, { new: true });
    if (!char || !char.isActive) return res.status(404).json({ error: 'Característica no encontrada' });

    res.json(char);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar la característica' });
  }
});

// Delete characteristic (soft)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const allowedRoles = ['Master admin', 'Supervisor de oficina'];
    if (!allowedRoles.includes(req.user.role)) return res.status(403).json({ error: 'Acceso denegado. Permisos insuficientes.' });

    const char = await Characteristic.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!char) return res.status(404).json({ error: 'Característica no encontrada' });

    await CharacteristicValue.updateMany({ characteristic: req.params.id }, { isActive: false });

    res.json({ message: 'Característica eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la característica' });
  }
});

module.exports = router;
