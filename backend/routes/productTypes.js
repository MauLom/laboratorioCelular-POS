const express = require('express');
const ProductType = require('../models/ProductType');
const Brand = require('../models/Brand');
const { authenticate } = require('../middleware/auth');
const { ROLES } = require('../utils/roles');

const router = express.Router();

// Get all product types
router.get('/', authenticate, async (req, res) => {
  try {
    const productTypes = await ProductType.find({ isActive: true })
      .populate('company', 'name description')
      .sort({ createdAt: -1 });
    res.json(productTypes);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los tipos de producto' });
  }
});

// Get product type by id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const productType = await ProductType.findById(req.params.id)
      .populate('company', 'name description');
    if (!productType || !productType.isActive) {
      return res.status(404).json({ error: 'Tipo de producto no encontrado' });
    }
    res.json(productType);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el tipo de producto' });
  }
});

// Create product type
router.post('/', authenticate, async (req, res) => {
  try {
    const allowedRoles = [ROLES.MASTER_ADMIN, ROLES.OFFICE_SUPERVISOR, ROLES.OFFICE];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acceso denegado. Permisos insuficientes.' });
    }

    const { company, model, minInventoryThreshold } = req.body;
    
    if (!company || !model || !model.trim()) {
      return res.status(400).json({ error: 'Empresa y modelo son requeridos' });
    }

    if (minInventoryThreshold === undefined || minInventoryThreshold < 0) {
      return res.status(400).json({ error: 'El umbral mínimo de inventario debe ser mayor o igual a 0' });
    }

    // Verify brand exists and is active
    const brand = await Brand.findById(company);
    if (!brand || !brand.isActive) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    // Check if product type already exists
    const existing = await ProductType.findOne({ 
      company, 
      model: model.trim(), 
      isActive: true 
    });
    if (existing) {
      return res.status(400).json({ error: 'Ya existe un tipo de producto con esta empresa y modelo' });
    }

    const productType = new ProductType({ 
      company, 
      model: model.trim(), 
      minInventoryThreshold: minInventoryThreshold || 0,
      createdBy: req.user.id 
    });
    await productType.save();
    
    const populated = await ProductType.findById(productType._id)
      .populate('company', 'name description');
    
    res.status(201).json(populated);
  } catch (error) {
    console.error('Error creating product type:', error);
    res.status(500).json({ error: 'Error al crear el tipo de producto' });
  }
});

// Update product type
router.put('/:id', authenticate, async (req, res) => {
  try {
    const allowedRoles = [ROLES.MASTER_ADMIN, ROLES.OFFICE_SUPERVISOR, ROLES.OFFICE];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acceso denegado. Permisos insuficientes.' });
    }

    const { company, model, minInventoryThreshold } = req.body;
    
    if (!company || !model || !model.trim()) {
      return res.status(400).json({ error: 'Empresa y modelo son requeridos' });
    }

    if (minInventoryThreshold === undefined || minInventoryThreshold < 0) {
      return res.status(400).json({ error: 'El umbral mínimo de inventario debe ser mayor o igual a 0' });
    }

    // Verify brand exists and is active
    const brand = await Brand.findById(company);
    if (!brand || !brand.isActive) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    // Check if another product type with same company/model exists
    const existing = await ProductType.findOne({ 
      company, 
      model: model.trim(), 
      isActive: true,
      _id: { $ne: req.params.id }
    });
    if (existing) {
      return res.status(400).json({ error: 'Ya existe un tipo de producto con esta empresa y modelo' });
    }

    const productType = await ProductType.findByIdAndUpdate(
      req.params.id,
      { 
        company, 
        model: model.trim(), 
        minInventoryThreshold: minInventoryThreshold || 0
      },
      { new: true }
    );
    
    if (!productType || !productType.isActive) {
      return res.status(404).json({ error: 'Tipo de producto no encontrado' });
    }

    const populated = await ProductType.findById(productType._id)
      .populate('company', 'name description');
    
    res.json(populated);
  } catch (error) {
    console.error('Error updating product type:', error);
    res.status(500).json({ error: 'Error al actualizar el tipo de producto' });
  }
});

// Delete product type (soft delete)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const allowedRoles = [ROLES.MASTER_ADMIN, ROLES.OFFICE_SUPERVISOR];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acceso denegado. Permisos insuficientes.' });
    }

    const productType = await ProductType.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!productType) {
      return res.status(404).json({ error: 'Tipo de producto no encontrado' });
    }

    res.json({ message: 'Tipo de producto eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el tipo de producto' });
  }
});

module.exports = router;

