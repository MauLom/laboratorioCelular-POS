const express = require('express');
const router = express.Router();
const InventoryItem = require('../models/InventoryItem');

// Get all inventory items
router.get('/', async (req, res) => {
  try {
    const { state, branch, page = 1, limit = 10 } = req.query;
    const query = {};
    
    if (state) query.state = state;
    if (branch) query.branch = branch;
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };
    
    const items = await InventoryItem.find(query)
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

// Get single inventory item by IMEI
router.get('/:imei', async (req, res) => {
  try {
    const item = await InventoryItem.findOne({ imei: req.params.imei });
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new inventory item
router.post('/', async (req, res) => {
  try {
    const item = new InventoryItem(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'IMEI already exists' });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// Update inventory item
router.put('/:imei', async (req, res) => {
  try {
    const item = await InventoryItem.findOneAndUpdate(
      { imei: req.params.imei },
      req.body,
      { new: true, runValidators: true }
    );
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete inventory item
router.delete('/:imei', async (req, res) => {
  try {
    const item = await InventoryItem.findOneAndDelete({ imei: req.params.imei });
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get inventory statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await InventoryItem.aggregate([
      {
        $group: {
          _id: '$state',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const branchStats = await InventoryItem.aggregate([
      {
        $group: {
          _id: '$branch',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({ stateStats: stats, branchStats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;