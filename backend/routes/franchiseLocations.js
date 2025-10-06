const express = require('express');
const router = express.Router();
const FranchiseLocation = require('../models/FranchiseLocation');
const { authenticate, requireMasterAdmin } = require('../middleware/auth');

// Get all franchise locations (Master admin only)
router.get('/', authenticate, requireMasterAdmin, async (req, res) => {
  try {
    const { type, isActive, page = 1, limit = 10 } = req.query;
    const query = {};
    
    if (type) query.type = type;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };
    
    const locations = await FranchiseLocation.find(query)
      .populate('createdBy', 'username firstName lastName')
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit)
      .sort(options.sort);
      
    const total = await FranchiseLocation.countDocuments(query);
    
    res.json({
      locations,
      totalPages: Math.ceil(total / options.limit),
      currentPage: options.page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all active locations (simplified list for dropdowns)
router.get('/active', authenticate, async (req, res) => {
  try {
    const locations = await FranchiseLocation.find({ isActive: true })
      .select('_id name code type guid')
      .sort({ name: 1 });
    
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single franchise location by ID (Master admin only)
router.get('/:id', authenticate, requireMasterAdmin, async (req, res) => {
  try {
    const location = await FranchiseLocation.findById(req.params.id)
      .populate('createdBy', 'username firstName lastName');
      
    if (!location) {
      return res.status(404).json({ error: 'Franchise location not found' });
    }
    res.json(location);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new franchise location (Master admin only)
router.post('/', authenticate, requireMasterAdmin, async (req, res) => {
  try {
    const locationData = {
      ...req.body,
      createdBy: req.user._id
    };
    
    const location = new FranchiseLocation(locationData);
    await location.save();
    
    // Populate the created location for response
    await location.populate('createdBy', 'username firstName lastName');
    
    res.status(201).json({ 
      message: 'Franchise location created successfully', 
      location 
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      if (field === 'code') {
        res.status(400).json({ error: 'Location code already exists' });
      } else if (field === 'guid') {
        res.status(400).json({ error: 'Ya existe una sucursal con este GUID. Cada sucursal debe tener un identificador único.' });
      } else {
        res.status(400).json({ error: `${field} already exists` });
      }
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// Update franchise location (Master admin only)
router.put('/:id', authenticate, requireMasterAdmin, async (req, res) => {
  try {
    const allowedUpdates = [
      'name', 'code', 'address', 'contact', 'type', 'isActive', 'notes', 'guid'
    ];
    
    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });
    
    const updatedLocation = await FranchiseLocation.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('createdBy', 'username firstName lastName');
    
    if (!updatedLocation) {
      return res.status(404).json({ error: 'Franchise location not found' });
    }
    
    res.json({ 
      message: 'Franchise location updated successfully', 
      location: updatedLocation 
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      if (field === 'code') {
        res.status(400).json({ error: 'Location code already exists' });
      } else if (field === 'guid') {
        res.status(400).json({ error: 'Ya existe una sucursal con este GUID. Cada sucursal debe tener un identificador único.' });
      } else {
        res.status(400).json({ error: `${field} already exists` });
      }
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// Delete franchise location (Master admin only) - Soft delete by setting isActive to false
router.delete('/:id', authenticate, requireMasterAdmin, async (req, res) => {
  try {
    const location = await FranchiseLocation.findById(req.params.id);
    
    if (!location) {
      return res.status(404).json({ error: 'Franchise location not found' });
    }
    
    // Check if there are active users assigned to this location
    const User = require('../models/User');
    const usersCount = await User.countDocuments({ 
      franchiseLocation: req.params.id, 
      isActive: true 
    });
    
    if (usersCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete location with ${usersCount} active users assigned` 
      });
    }
    
    // Soft delete
    location.isActive = false;
    await location.save();
    
    res.json({ message: 'Franchise location deactivated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get franchise location statistics
router.get('/stats/summary', authenticate, requireMasterAdmin, async (req, res) => {
  try {
    const typeStats = await FranchiseLocation.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const totalLocations = await FranchiseLocation.countDocuments({ isActive: true });
    const inactiveLocations = await FranchiseLocation.countDocuments({ isActive: false });
    
    // Get user count per location
    const User = require('../models/User');
    const locationUserCounts = await User.aggregate([
      { $match: { isActive: true, franchiseLocation: { $exists: true } } },
      {
        $lookup: {
          from: 'franchiselocations',
          localField: 'franchiseLocation',
          foreignField: '_id',
          as: 'location'
        }
      },
      { $unwind: '$location' },
      {
        $group: {
          _id: {
            locationId: '$location._id',
            locationName: '$location.name',
            locationType: '$location.type'
          },
          userCount: { $sum: 1 }
        }
      },
      { $sort: { userCount: -1 } }
    ]);
    
    res.json({ 
      typeStats, 
      totalLocations, 
      inactiveLocations,
      locationUserCounts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;