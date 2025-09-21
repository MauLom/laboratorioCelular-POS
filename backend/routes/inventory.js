const express = require('express');
const router = express.Router();
const InventoryItem = require('../models/InventoryItem');
const FranchiseLocation = require('../models/FranchiseLocation');
const { authenticate, applyFranchiseFilter } = require('../middleware/auth');

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

// Get all inventory items (with franchise filtering)
router.get('/', authenticate, applyFranchiseFilter, async (req, res) => {
  try {
    const { state, franchiseLocation, page = 1, limit = 10 } = req.query;
    const query = {};
    
    if (state) query.state = state;
    
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

// Get single inventory item by IMEI (with franchise filtering)
router.get('/:imei', authenticate, applyFranchiseFilter, async (req, res) => {
  try {
    const query = { imei: req.params.imei };
    
    // Apply franchise location filtering
    if (req.user.role !== 'Master admin') {
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
router.post('/', authenticate, async (req, res) => {
  try {
    const itemData = { ...req.body };
    
    // Validate franchise location access
    if (req.user.role !== 'Master admin') {
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

// Update inventory item (with franchise validation)
router.put('/:imei', authenticate, async (req, res) => {
  try {
    const query = { imei: req.params.imei };
    
    // Apply franchise location filtering for finding the item
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
    if (req.user.role !== 'Master admin') {
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
router.get('/stats/summary', authenticate, applyFranchiseFilter, async (req, res) => {
  try {
    let matchQuery = {};
    
    // Apply franchise location filtering
    if (req.user.role !== 'Master admin') {
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