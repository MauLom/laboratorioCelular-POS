const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const InventoryItem = require('../models/InventoryItem');
const FranchiseLocation = require('../models/FranchiseLocation');
const { authenticate, applyFranchiseFilter, applyRoleDataFilter } = require('../middleware/auth');
const { handleBranchToFranchiseLocationConversion } = require('../middleware/branchCompatibility');
const ExcelJS = require('exceljs');
const { ROLES } = require('../utils/roles');

// Helper function to get accessible franchise locations for a user
const getAccessibleLocations = async (user) => {
  if (user.role === ROLES.MASTER_ADMIN) {
    return await FranchiseLocation.find({ isActive: true });
  }
  
  if (user.role === ROLES.MULTI_BRANCH_SUPERVISOR) {
    return await FranchiseLocation.find({ type: 'Sucursal', isActive: true });
  }
  
  if (user.role === ROLES.OFFICE_SUPERVISOR) {
    return await FranchiseLocation.find({ type: 'Oficina', isActive: true });
  }
  
  // Other roles can only access their specific location
  if (user.franchiseLocation) {
    return [user.franchiseLocation];
  }
  
  return [];
};

// Get all sales (with franchise filtering)
router.get('/', authenticate, applyRoleDataFilter, async (req, res) => {
  try {
    const { description, finance, franchiseLocation, page = 1, limit = 20, startDate, endDate } = req.query;
    
    // Iniciamos query base desde el filtro aplicado por rol
    const query = { ...(req.roleFilter || {}) };

    // 🔍 Log para depuración
    console.log(`🧩 Usuario: ${req.user.username} (${req.user.role})`);
    console.log('📋 Filtro base (roleFilter):', query);

    // Solo roles superiores pueden aplicar filtros extra
    if (![ROLES.CASHIER, ROLES.SELLER].includes(req.user.role)) {

      if (description) {
        query.description = Array.isArray(description)
          ? { $in: description }
          : description;
      }

      if (finance) {
        query.finance = Array.isArray(finance)
          ? { $in: finance }
          : finance;
      }

      // Filtro de fechas (solo si no está usando el filtro diario del rol)
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      // Filtro por sucursal (solo admin/supervisores)
      if (req.user.role === ROLES.MASTER_ADMIN) {
        if (franchiseLocation) query.franchiseLocation = franchiseLocation;
      } else {
        const accessibleLocations = await getAccessibleLocations(req.user);
        const locationIds = accessibleLocations.map(loc => loc._id);

        if (franchiseLocation && locationIds.some(id => id.toString() === franchiseLocation)) {
          query.franchiseLocation = franchiseLocation;
        } else if (!query.franchiseLocation) {
          query.franchiseLocation = { $in: locationIds };
        }
      }
    }


    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };

    const sales = await Sale.find(query)
      .populate('franchiseLocation', 'name code type address contact')
      .populate('createdBy', 'firstName lastName username role')
      .limit(options.limit)
      .skip((options.page - 1) * options.limit)
      .sort(options.sort);

    const total = await Sale.countDocuments(query);

    res.json({
      sales,
      totalPages: Math.ceil(total / options.limit),
      currentPage: options.page,
      total
    });

  } catch (error) {
    console.error('❌ Error al obtener ventas:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export sales to Excel (with same filtering as GET /)
router.get('/export', authenticate, applyFranchiseFilter, applyRoleDataFilter, async (req, res) => {
  try {
    const { description, finance, franchiseLocation, startDate, endDate } = req.query;
    const query = {};
    
    // Handle array-based filters for multi-select support
    if (description) {
      if (Array.isArray(description) && description.length > 0) {
        query.description = { $in: description };
      } else if (!Array.isArray(description)) {
        // Handle single value (backward compatibility)
        query.description = description;
      }
    }
    
    if (finance) {
      if (Array.isArray(finance) && finance.length > 0) {
        query.finance = { $in: finance };
      } else if (!Array.isArray(finance)) {
        // Handle single value (backward compatibility)
        query.finance = finance;
      }
    }
    
    // Date filtering (disabled for Cajero/Vendedor)
    if (![ROLES.CASHIER, ROLES.SELLER].includes(req.user.role)) {
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }
    }
    
    // Apply franchise location filtering
    if (req.user.role === ROLES.MASTER_ADMIN) {
      // Master admin can filter by any location or see all
      if (franchiseLocation) query.franchiseLocation = franchiseLocation;
    } else {
      // Other users are restricted to their accessible locations
      const accessibleLocations = await getAccessibleLocations(req.user);
      const locationIds = accessibleLocations.map(loc => loc._id);
      
      if (franchiseLocation && locationIds.some(id => id.toString() === franchiseLocation)) {
        query.franchiseLocation = franchiseLocation;
      } else {
        query.franchiseLocation = { $in: locationIds };
      }
    }
    
    // Get all sales without pagination for export
    const sales = await Sale.find(query)
      .populate('franchiseLocation', 'name code type address contact')
      .populate('createdBy', 'firstName lastName username role')
      .sort({ createdAt: -1 });

    // Create Excel workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Ventas', {
      properties: { tabColor: { argb: 'FF00B050' } }
    });

    // Define columns
    worksheet.columns = [
      { header: 'Fecha', key: 'fecha', width: 12 },
      { header: 'Descripción', key: 'descripcion', width: 15 },
      { header: 'Financiamiento', key: 'financiamiento', width: 15 },
      { header: 'Concepto', key: 'concepto', width: 25 },
      { header: 'IMEI', key: 'imei', width: 18 },
      { header: 'Tipo de Pago', key: 'tipoPago', width: 15 },
      { header: 'Referencia', key: 'referencia', width: 15 },
      { header: 'Monto', key: 'monto', width: 12 },
      { header: 'Cliente', key: 'cliente', width: 20 },
      { header: 'Teléfono', key: 'telefono', width: 15 },
      { header: 'Creado Por', key: 'creadoPor', width: 20 },
      { header: 'Rol Creador', key: 'rolCreador', width: 18 },
      { header: 'Usuario Creador', key: 'usuarioCreador', width: 18 },
      { header: 'Sucursal', key: 'sucursal', width: 20 },
      { header: 'Código Sucursal', key: 'codigoSucursal', width: 15 },
      { header: 'Tipo Sucursal', key: 'tipoSucursal', width: 15 },
      { header: 'Notas', key: 'notas', width: 30 }
    ];

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF00B050' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // Add data rows
    sales.forEach(sale => {
      worksheet.addRow({
        fecha: sale.createdAt ? sale.createdAt.toLocaleDateString('es-ES') : '',
        descripcion: sale.description,
        financiamiento: sale.finance,
        concepto: sale.concept,
        imei: sale.imei || '',
        tipoPago: sale.paymentType,
        referencia: sale.reference,
        monto: sale.amount,
        cliente: sale.customerName || '',
        telefono: sale.customerPhone || '',
        creadoPor: sale.createdByName || '',
        rolCreador: sale.createdByRole || '',
        usuarioCreador: sale.createdByUsername || '',
        sucursal: sale.franchiseLocation?.name || '',
        codigoSucursal: sale.franchiseLocation?.code || '',
        tipoSucursal: sale.franchiseLocation?.type || '',
        notas: sale.notes || ''
      });
    });

    // Format amount column as currency
    const montoColumn = worksheet.getColumn('monto');
    montoColumn.numFmt = '$#,##0.00';
    montoColumn.alignment = { horizontal: 'right' };

    // Add borders to all cells
    const borderStyle = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };

    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = borderStyle;
      });
    });

    // Prepare filename with current date and applied filters
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    let filename = `ventas_${dateStr}`;
    
    if (description) filename += `_${description.toLowerCase()}`;
    if (finance) filename += `_${finance.toLowerCase()}`;
    if (startDate || endDate) {
      const dateRange = `${startDate || 'inicio'}_${endDate || 'fin'}`;
      filename += `_${dateRange}`;
    }
    filename += '.xlsx';

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');

    // Write the workbook to response
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single sale by ID (with franchise filtering)
router.get('/:id', authenticate, applyFranchiseFilter, async (req, res) => {
  try {
    const query = { _id: req.params.id };
    
    // Apply franchise location filtering
    if (req.user.role !== ROLES.MASTER_ADMIN) {
      const accessibleLocations = await getAccessibleLocations(req.user);
      const locationIds = accessibleLocations.map(loc => loc._id);
      query.franchiseLocation = { $in: locationIds };
    }
    
    const sale = await Sale.findOne(query).populate('franchiseLocation', 'name code type address contact');
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found or access denied' });
    }
    res.json(sale);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new sale (with franchise validation)
router.post('/', authenticate, async (req, res) => {
  try {
    const saleData = { ...req.body };

    // Obtener sucursal real desde Device Tracker
    const deviceBranch =
      req.user.deviceLocation ||
      req.user.franchiseLocation ||
      null;

    if (!deviceBranch) {
      return res.status(400).json({
        error: "Device Tracker did not attach location. Cannot create sale."
      });
    }

    // Verificar que la sucursal exista
    const location = await FranchiseLocation.findById(deviceBranch);
    if (!location) {
      return res.status(400).json({
        error: "Invalid branch from Device Tracker."
      });
    }

    // Ignorar cualquier sucursal enviada por el frontend
    delete saleData.branch;
    delete saleData.franchiseLocation;

    // Asignar sucursal real
    saleData.franchiseLocation = deviceBranch;

    // Datos del usuario creador
    saleData.createdBy = req.user._id;
    saleData.createdByName =
      req.user.firstName && req.user.lastName
        ? `${req.user.firstName} ${req.user.lastName}`
        : req.user.username;
    saleData.createdByRole = req.user.role;
    saleData.createdByUsername = req.user.username;

    const sale = new Sale(saleData);

    // Procesar IMEIs si es venta
    if (sale.description === 'Sale') {
      const imeisToProcess = [];

      if (sale.articles && sale.articles.length > 0) {
        sale.articles.forEach(article => {
          if (article.imei && article.imei.trim()) {
            imeisToProcess.push(article.imei.trim());
          }
        });
      } else if (sale.imei && sale.imei.trim()) {
        imeisToProcess.push(sale.imei.trim());
      }

      // Actualizar estado del inventario
      for (const imei of imeisToProcess) {
        const inventoryQuery = { imei };

        if (req.user.role !== ROLES.MASTER_ADMIN) {
          const accessibleLocations = await getAccessibleLocations(req.user);
          const locationIds = accessibleLocations.map(loc => loc._id);
          inventoryQuery.franchiseLocation = { $in: locationIds };
        }

        const item = await InventoryItem.findOne(inventoryQuery);
        if (item) {
          item.state = 'Sold';
          await item.save();
        }
      }
    }

    await sale.save();

    await sale.populate('franchiseLocation', 'name code type address contact');
    await sale.populate('createdBy', 'firstName lastName username role');

    res.status(201).json(sale);

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update sale (with franchise validation)
router.put('/:id', authenticate, handleBranchToFranchiseLocationConversion, async (req, res) => {
  try {
    const query = { _id: req.params.id };
    
    // Apply franchise location filtering for finding the sale
    if (req.user.role !== ROLES.MASTER_ADMIN) {
      const accessibleLocations = await getAccessibleLocations(req.user);
      const locationIds = accessibleLocations.map(loc => loc._id);
      query.franchiseLocation = { $in: locationIds };
    }
    
    // Validate franchise location access if being changed
    if (req.body.franchiseLocation && req.user.role !== ROLES.MASTER_ADMIN) {
      const accessibleLocations = await getAccessibleLocations(req.user);
      const locationIds = accessibleLocations.map(loc => loc._id.toString());
      
      if (!locationIds.includes(req.body.franchiseLocation)) {
        return res.status(403).json({ error: 'Access denied. Cannot move sale to this franchise location.' });
      }
    }
    
    const sale = await Sale.findOneAndUpdate(
      query,
      req.body,
      { new: true, runValidators: true }
    ).populate('franchiseLocation', 'name code type address contact');
    
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found or access denied' });
    }
    res.json(sale);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete sale (Master admin only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    // Only Master admin can delete sales
    if (req.user.role !== ROLES.MASTER_ADMIN) {
      return res.status(403).json({ 
        error: 'Access denied. Only Master admin can delete sales.' 
      });
    }
    
    const sale = await Sale.findByIdAndDelete(req.params.id);
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    
    res.json({ 
      message: 'Sale deleted successfully',
      deletedSale: {
        folio: sale.folio,
        amount: sale.amount,
        description: sale.description
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get sales statistics (with franchise filtering)
router.get('/stats/summary', authenticate, applyFranchiseFilter, applyRoleDataFilter, async (req, res) => {
  try {
    let matchQuery = req.roleFilter ? { ...req.roleFilter } : {};
    
    // Apply franchise location filtering
    if (req.user.role !== ROLES.MASTER_ADMIN) {
      const accessibleLocations = await getAccessibleLocations(req.user);
      const locationIds = accessibleLocations.map(loc => loc._id);
      matchQuery.franchiseLocation = { $in: locationIds };
    }
    
    const descriptionStats = await Sale.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$description',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);
    
    const financeStats = await Sale.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$finance',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);
    
    // Monthly sales
    const monthlySales = await Sale.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);
    
    // Location-based stats
    const locationStats = await Sale.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$franchiseLocation',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      {
        $lookup: {
          from: 'franchiselocations',
          localField: '_id',
          foreignField: '_id',
          as: 'location'
        }
      },
      {
        $project: {
          _id: 1,
          count: 1,
          totalAmount: 1,
          name: { $arrayElemAt: ['$location.name', 0] },
          code: { $arrayElemAt: ['$location.code', 0] },
          type: { $arrayElemAt: ['$location.type', 0] }
        }
      }
    ]);
    
    res.json({ 
      descriptionStats, 
      financeStats, 
      monthlySales,
      locationStats 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;