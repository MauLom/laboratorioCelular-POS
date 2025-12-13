const express = require('express');
const router = express.Router();
const InventoryItem = require('../models/InventoryItem');
const FranchiseLocation = require('../models/FranchiseLocation');
const { authenticate, authorize, applyFranchiseFilter, applyInventoryFilter } = require('../middleware/auth');
const { handleBranchToFranchiseLocationConversion } = require('../middleware/branchCompatibility');
const { ROLES } = require("../utils/roles");

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

// Get all inventory items (with franchise filtering)
router.get('/', authenticate, authorize([ROLES.MASTER_ADMIN, ROLES.ADMIN, ROLES.MULTI_BRANCH_SUPERVISOR, ROLES.OFFICE_SUPERVISOR, ROLES.SELLER, ROLES.CASHIER]), applyInventoryFilter, async (req, res) => {
  try {
    const { state, franchiseLocation, imei, page = 1, limit = 500 } = req.query;
    const query = {};
    
    if (state) query.state = state;

    if (imei && imei.trim() !== "") {
      query.imei = { $regex: imei.trim(), $options: "i" };
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
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };
    
    const items = await InventoryItem.find(query)
      .populate('franchiseLocation', 'name code type')
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit)
      .sort(options.sort);
      
    const total = await InventoryItem.countDocuments(query);
    
    res.json({
      items,
      totalPages: Math.ceil(total / options.limit),
      currentPage: options.page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Buscar por IMEI (parcial, con autenticación y filtro de franquicia)
router.get('/search', authenticate, applyInventoryFilter, async (req, res) => {
  const { imei } = req.query;
  if (!imei || imei.length < 4) {
    return res.status(400).json({ error: 'IMEI requerido (mínimo 4 caracteres)' });
  }
  try {
    // Construir query con filtro de franquicia
    const query = { imei: { $regex: imei, $options: 'i' } };
    if (req.franchiseFilter) {
      query.franchiseLocation = req.franchiseFilter.franchiseLocation;
    }
    const items = await InventoryItem.find(query).limit(10);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Error al buscar IMEI' });
  }
});

// Get single inventory item by IMEI (with franchise filtering)
router.get('/:imei', authenticate, applyInventoryFilter, async (req, res) => {
  try {
    const query = { imei: req.params.imei };
    
    // Apply franchise location filtering
    if (req.user.role !== ROLES.MASTER_ADMIN) {
      const accessibleLocations = await getAccessibleLocations(req.user);
      const locationIds = accessibleLocations.map(loc => loc._id);
      query.franchiseLocation = { $in: locationIds };
    }
    
    const item = await InventoryItem.findOne(query).populate('franchiseLocation', 'name code type');
    if (!item) {
      return res.status(404).json({ error: 'Item not found or access denied' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new inventory item (with franchise validation)
router.post('/', authenticate, handleBranchToFranchiseLocationConversion, async (req, res) => {
  try {
    const itemData = { ...req.body };
    
    // Validate franchise location access
    if (req.user.role !== ROLES.MASTER_ADMIN) {
      const accessibleLocations = await getAccessibleLocations(req.user);
      const locationIds = accessibleLocations.map(loc => loc._id.toString());
      
      if (!itemData.franchiseLocation || !locationIds.includes(itemData.franchiseLocation)) {
        return res.status(403).json({ error: 'Access denied. Cannot create item for this franchise location.' });
      }
    }
    
    const item = new InventoryItem(itemData);
    await item.save();
    
    // Populate franchise location for response
    await item.populate('franchiseLocation', 'name code type');
    
    res.status(201).json(item);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'IMEI already exists' });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// Create multiple inventory items (bulk)
router.post('/bulk', authenticate, handleBranchToFranchiseLocationConversion, async (req, res) => {
  try {
    const { items } = req.body; // Array of inventory items
    
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required' });
    }
    
    // Validate franchise location access
    if (req.user.role !== ROLES.MASTER_ADMIN) {
      const accessibleLocations = await getAccessibleLocations(req.user);
      const locationIds = accessibleLocations.map(loc => loc._id.toString());
      
      // Validate all items have accessible locations
      const invalidItems = items.filter(
        (item) =>
          !item.franchiseLocation ||
          !locationIds.includes(item.franchiseLocation)
      );
      
      if (invalidItems.length > 0) {
        return res.status(403).json({
          error: 'Access denied. Some items have invalid franchise locations.'
        });
      }
    }
    
    // Validate IMEIs are unique
    const imeis = items.map((item) => item.imei);
    const duplicateImeis = imeis.filter(
      (imei, index) => imeis.indexOf(imei) !== index
    );
    if (duplicateImeis.length > 0) {
      return res.status(400).json({
        error: `Duplicate IMEIs found: ${duplicateImeis.join(', ')}`
      });
    }
    
    // Check for existing IMEIs
    const existingItems = await InventoryItem.find({
      imei: { $in: imeis }
    });
    
    if (existingItems.length > 0) {
      const existingImeis = existingItems.map((item) => item.imei);
      return res.status(400).json({
        error: `IMEIs already exist: ${existingImeis.join(', ')}`
      });
    }
    
    // Create all items
    const createdItems = await InventoryItem.insertMany(items);
    
    // Populate franchise location
    await InventoryItem.populate(createdItems, {
      path: 'franchiseLocation',
      select: 'name code type'
    });
    
    res.status(201).json({
      message: `${createdItems.length} items created successfully`,
      items: createdItems
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'One or more IMEIs already exist' });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// Update inventory item (with franchise validation)
router.put('/:imei', authenticate, handleBranchToFranchiseLocationConversion, async (req, res) => {
  try {
    const query = { imei: req.params.imei };
    
    // Apply franchise location filtering for finding the item
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
        return res.status(403).json({ error: 'Access denied. Cannot move item to this franchise location.' });
      }
    }
    
    const item = await InventoryItem.findOneAndUpdate(
      query,
      req.body,
      { new: true, runValidators: true }
    ).populate('franchiseLocation', 'name code type');
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found or access denied' });
    }
    res.json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete inventory item (with franchise validation)
router.delete('/:imei', authenticate, async (req, res) => {
  try {
    const query = { imei: req.params.imei };
    
    // Apply franchise location filtering
    if (req.user.role !== ROLES.MASTER_ADMIN) {
      const accessibleLocations = await getAccessibleLocations(req.user);
      const locationIds = accessibleLocations.map(loc => loc._id);
      query.franchiseLocation = { $in: locationIds };
    }
    
    const item = await InventoryItem.findOneAndDelete(query);
    if (!item) {
      return res.status(404).json({ error: 'Item not found or access denied' });
    }
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get inventory statistics (with franchise filtering)
router.get('/stats/summary', authenticate, applyInventoryFilter, async (req, res) => {
  try {
    let matchQuery = {};
    
    // Apply franchise location filtering
    if (req.user.role !== ROLES.MASTER_ADMIN) {
      const accessibleLocations = await getAccessibleLocations(req.user);
      const locationIds = accessibleLocations.map(loc => loc._id);
      matchQuery.franchiseLocation = { $in: locationIds };
    }
    
    const stats = await InventoryItem.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$state',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const locationStats = await InventoryItem.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$franchiseLocation',
          count: { $sum: 1 }
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
          name: { $arrayElemAt: ['$location.name', 0] },
          code: { $arrayElemAt: ['$location.code', 0] },
          type: { $arrayElemAt: ['$location.type', 0] }
        }
      }
    ]);
    
    res.json({ stateStats: stats, locationStats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;