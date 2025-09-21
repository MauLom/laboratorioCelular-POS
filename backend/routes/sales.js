const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const InventoryItem = require('../models/InventoryItem');
const FranchiseLocation = require('../models/FranchiseLocation');
const { authenticate, applyFranchiseFilter } = require('../middleware/auth');
const { handleBranchToFranchiseLocationConversion } = require('../middleware/branchCompatibility');

// Helper function to get accessible franchise locations for a user
const getAccessibleLocations = async (user) => {
  if (user.role === 'Master admin') {
    return await FranchiseLocation.find({ isActive: true });
  }
  
  if (user.role === 'Supervisor de sucursales') {
    return await FranchiseLocation.find({ type: 'Sucursal', isActive: true });
  }
  
  if (user.role === 'Supervisor de oficina') {
    return await FranchiseLocation.find({ type: 'Oficina', isActive: true });
  }
  
  // Other roles can only access their specific location
  if (user.franchiseLocation) {
    return [user.franchiseLocation];
  }
  
  return [];
};

// Get all sales (with franchise filtering)
router.get('/', authenticate, applyFranchiseFilter, async (req, res) => {
  try {
    const { description, finance, franchiseLocation, page = 1, limit = 10, startDate, endDate } = req.query;
    const query = {};
    
    if (description) query.description = description;
    if (finance) query.finance = finance;
    
    // Date filtering
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    // Apply franchise location filtering
    if (req.user.role === 'Master admin') {
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
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };
    
    const sales = await Sale.find(query)
      .populate('franchiseLocation', 'name code type')
      .limit(options.limit * 1)
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
    res.status(500).json({ error: error.message });
  }
});

// Get single sale by ID (with franchise filtering)
router.get('/:id', authenticate, applyFranchiseFilter, async (req, res) => {
  try {
    const query = { _id: req.params.id };
    
    // Apply franchise location filtering
    if (req.user.role !== 'Master admin') {
      const accessibleLocations = await getAccessibleLocations(req.user);
      const locationIds = accessibleLocations.map(loc => loc._id);
      query.franchiseLocation = { $in: locationIds };
    }
    
    const sale = await Sale.findOne(query).populate('franchiseLocation', 'name code type');
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found or access denied' });
    }
    res.json(sale);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new sale (with franchise validation)
router.post('/', authenticate, handleBranchToFranchiseLocationConversion, async (req, res) => {
  try {
    const saleData = { ...req.body };
    
    // Validate franchise location access
    if (req.user.role !== 'Master admin') {
      const accessibleLocations = await getAccessibleLocations(req.user);
      const locationIds = accessibleLocations.map(loc => loc._id.toString());
      
      if (!saleData.franchiseLocation || !locationIds.includes(saleData.franchiseLocation)) {
        return res.status(403).json({ error: 'Access denied. Cannot create sale for this franchise location.' });
      }
    }
    
    const sale = new Sale(saleData);
    
    // If IMEI is provided, check if it exists in accessible locations and update inventory status if it's a sale
    if (sale.imei && sale.description === 'Sale') {
      const inventoryQuery = { imei: sale.imei };
      
      // Apply same franchise filtering for inventory item
      if (req.user.role !== 'Master admin') {
        const accessibleLocations = await getAccessibleLocations(req.user);
        const locationIds = accessibleLocations.map(loc => loc._id);
        inventoryQuery.franchiseLocation = { $in: locationIds };
      }
      
      const inventoryItem = await InventoryItem.findOne(inventoryQuery);
      if (inventoryItem) {
        inventoryItem.state = 'Sold';
        await inventoryItem.save();
      }
    }
    
    await sale.save();
    
    // Populate franchise location for response
    await sale.populate('franchiseLocation', 'name code type');
    
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
    if (req.user.role !== 'Master admin') {
      const accessibleLocations = await getAccessibleLocations(req.user);
      const locationIds = accessibleLocations.map(loc => loc._id);
      query.franchiseLocation = { $in: locationIds };
    }
    
    // Validate franchise location access if being changed
    if (req.body.franchiseLocation && req.user.role !== 'Master admin') {
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
    ).populate('franchiseLocation', 'name code type');
    
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found or access denied' });
    }
    res.json(sale);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete sale (with franchise validation)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const query = { _id: req.params.id };
    
    // Apply franchise location filtering
    if (req.user.role !== 'Master admin') {
      const accessibleLocations = await getAccessibleLocations(req.user);
      const locationIds = accessibleLocations.map(loc => loc._id);
      query.franchiseLocation = { $in: locationIds };
    }
    
    const sale = await Sale.findOneAndDelete(query);
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found or access denied' });
    }
    res.json({ message: 'Sale deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get sales statistics (with franchise filtering)
router.get('/stats/summary', authenticate, applyFranchiseFilter, async (req, res) => {
  try {
    let matchQuery = {};
    
    // Apply franchise location filtering
    if (req.user.role !== 'Master admin') {
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