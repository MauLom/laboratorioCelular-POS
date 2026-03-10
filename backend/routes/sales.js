const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const InventoryItem = require('../models/InventoryItem');
const FranchiseLocation = require('../models/FranchiseLocation');
const { authenticate, applyFranchiseFilter, applyRoleDataFilter } = require('../middleware/auth');
const { handleBranchToFranchiseLocationConversion } = require('../middleware/branchCompatibility');
const ExcelJS = require('exceljs');
const { ROLES } = require('../utils/roles');
const mongoose = require('mongoose');

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

const getFranchiseByDeviceGuid = async (deviceGuid) => {
  if (!deviceGuid) return null;
  const location = await FranchiseLocation.findOne({ guid: deviceGuid, isActive: true });
  return location || null;
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
router.get(
  '/export',
  authenticate,
  async (req, res) => {
    try {
      const path = require('path');
      const fs = require('fs');
      const deviceGuid = req.headers['x-device-guid'];

      let { franchiseLocation, startDate, endDate } = req.query;

      let deviceFranchiseLocation = null;
      if (deviceGuid) {
        const locationByGuid = await getFranchiseByDeviceGuid(deviceGuid);
        if (locationByGuid) {
          deviceFranchiseLocation = locationByGuid._id.toString();
          console.log('Sucursal por GUID:', locationByGuid.name);
        }
      }

      if ([ROLES.CASHIER, ROLES.SELLER].includes(req.user.role)) {

        if (deviceFranchiseLocation) {
          franchiseLocation = deviceFranchiseLocation;
        } else {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const lastSale = await Sale.findOne({
            createdBy: req.user._id,
            createdAt: { $gte: today }
          }).sort({ createdAt: -1 });

          console.log('lastSale franchiseLocation:', lastSale?.franchiseLocation);

          franchiseLocation = lastSale?.franchiseLocation?.toString()
            || req.user.franchiseLocation?._id?.toString()
            || req.user.franchiseLocation?.toString();
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        startDate = today.toISOString();
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);
        endDate = endOfDay.toISOString();

      } else {
        if (!franchiseLocation && deviceFranchiseLocation) {
          franchiseLocation = deviceFranchiseLocation;
        }

        if (req.user.role !== ROLES.MASTER_ADMIN && franchiseLocation) {
          const accessibleLocations = await getAccessibleLocations(req.user);
          const locationIds = accessibleLocations.map(loc => loc._id.toString());

          if (!locationIds.includes(franchiseLocation.toString())) {
            return res.status(403).json({
              error: 'No tienes acceso a esta sucursal'
            });
          }
        }
      }

      const query = {};

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      if (franchiseLocation) {
        try {
          query.franchiseLocation = new mongoose.Types.ObjectId(franchiseLocation.toString());
        } catch (e) {
          query.franchiseLocation = franchiseLocation;
        }
      }

      const sales = await Sale.find(query)
        .populate('franchiseLocation', 'name code type address contact')
        .populate('createdBy', 'firstName lastName username role')
        .sort({ createdAt: 1 });

      const Expense = require('../models/Expense');
      const expenseQuery = {};

      if (startDate || endDate) {
        expenseQuery.createdAt = {};
        if (startDate) expenseQuery.createdAt.$gte = new Date(startDate);
        if (endDate) expenseQuery.createdAt.$lte = new Date(endDate);
      }

      if (franchiseLocation) {
        expenseQuery.franchiseLocation = franchiseLocation;
      }

      const expenses = await Expense.find(expenseQuery).sort({ createdAt: 1 });

      let sucursalName = 'Todas las sucursales';
      let fechaStr = 'Varios días';

      if (franchiseLocation) {
        try {
          const objId = new mongoose.Types.ObjectId(franchiseLocation.toString());
          const location = await FranchiseLocation.findById(objId);
          sucursalName = location?.name || 'Sucursal';
        } catch(e) {
          console.error('Error buscando sucursal:', e.message);
        }
      }    

      if (startDate) {
        const fecha = new Date(startDate);
        fechaStr = fecha.toLocaleDateString('es-MX', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      }

      const templatePath = path.join(__dirname, '../templates/CORTE_A.xlsx');

      if (!fs.existsSync(templatePath)) {
        return res.status(500).json({
          error: 'Plantilla de Excel no encontrada',
          path: templatePath
        });
      }

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(templatePath);
      const worksheet =
        workbook.getWorksheet('CORTE DIARIO') || workbook.worksheets[0];

      const rowsToDelete = [];
      worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
        if (rowNumber > 30) rowsToDelete.push(rowNumber);
      });
      rowsToDelete.reverse().forEach(r => worksheet.spliceRows(r, 1));

      worksheet.getCell('A1').value = fechaStr;
      worksheet.getCell('K4').value = sucursalName;

      for (let row = 2; row <= 30; row++) {
        ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach(col => {
          worksheet.getCell(`${col}${row}`).value = null;
        });
      }

      for (let row = 8; row <= 28; row++) {
        ['I', 'K', 'M', 'W'].forEach(col => {
          worksheet.getCell(`${col}${row}`).value = null;
        });
      }

      worksheet.getCell('X3').value = null;

      let ventaRow = 2;
      let notasRow = 8;
      let totalTransferencias = 0;

      sales.forEach(sale => {
        worksheet.getCell(`A${ventaRow}`).value = sale.createdAt
          ? sale.createdAt.toLocaleDateString('es-MX', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })
          : '';

        let descripcionArticulos = '';

        if (sale.articles?.length) {
          descripcionArticulos = sale.articles
            .map(a => a.description || a.concept || '')
            .filter(Boolean)
            .join(', ');
        }

        if (!descripcionArticulos) {
          descripcionArticulos =
            sale.notes || sale.customerName || sale.concept || '';
        }

        worksheet.getCell(`B${ventaRow}`).value = descripcionArticulos;
        worksheet.getCell(`C${ventaRow}`).value = sale.concept || '';
        worksheet.getCell(`D${ventaRow}`).value = sale.finance || '';
        worksheet.getCell(`E${ventaRow}`).value = sale.reference || '';
        worksheet.getCell(`F${ventaRow}`).value = sale.folio || '';
        worksheet.getCell(`G${ventaRow}`).value = sale.amount || 0;

        const metodos = sale.paymentMethods || [];
        const pagosTarjeta = metodos.filter(m => m.type === 'tarjeta');

        pagosTarjeta.forEach(p => {
          if (descripcionArticulos && notasRow <= 27) {
            worksheet.getCell(`W${notasRow}`).value = descripcionArticulos;
            totalTransferencias += p.amount;
            notasRow++;
          }
        });

        ventaRow++;
      });

      worksheet.getCell('X3').value = totalTransferencias;

      let gastoRow = 8;
      expenses.forEach(expense => {
        worksheet.getCell(`I${gastoRow}`).value = expense.folio || '';
        worksheet.getCell(`K${gastoRow}`).value =
          expense.reason || expense.motivo || '';
        worksheet.getCell(`M${gastoRow}`).value =
          expense.amount || expense.monto || 0;
        gastoRow++;
      });

      worksheet.getCell('I1').value = { formula: '=SUM(G2:G30)' };
      worksheet.getCell('I2').value = { formula: '=SUM(Q8:Q27)' };
      worksheet.getCell('I3').value = { formula: '=I1+I2-X3-SUM(M8:M27)' };
      worksheet.getCell('N30').value = { formula: '=SUM(M8:M28)' };

      const filename = `corte_${sucursalName.replace(/\s+/g, '_')}_${fechaStr.replace(/\//g, '-')}.xlsx`;

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Cache-Control', 'no-cache');

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error('Error generating Excel:', error);
      res.status(500).json({ error: error.message, stack: error.stack });
    }
  }
);

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

    const deviceGuid = req.headers['x-device-guid'];
    let deviceBranch = null;

    if (deviceGuid) {
      const locationByGuid = await getFranchiseByDeviceGuid(deviceGuid);
      if (locationByGuid) {
        deviceBranch = locationByGuid._id;
        console.log('Sucursal por GUID:', locationByGuid.name);
      }
    }

    if (!deviceBranch) {
      deviceBranch = req.user.deviceLocation || req.user.franchiseLocation || null;
    }

    if (!deviceBranch) {
      return res.status(400).json({
        error: "No se pudo determinar la sucursal del dispositivo."
      });
    }

    // Verificar que la sucursal exista
    const location = await FranchiseLocation.findById(deviceBranch);
    if (!location) {
      return res.status(400).json({
        error: "Sucursal no válida."
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