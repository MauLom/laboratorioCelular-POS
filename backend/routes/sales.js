const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const InventoryItem = require('../models/InventoryItem');

// Get all sales
router.get('/', async (req, res) => {
  try {
    const { description, finance, page = 1, limit = 10, startDate, endDate } = req.query;
    const query = {};
    
    if (description) query.description = description;
    if (finance) query.finance = finance;
    
    // Date filtering
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };
    
    const sales = await Sale.find(query)
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

// Get single sale by ID
router.get('/:id', async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    res.json(sale);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new sale
router.post('/', async (req, res) => {
  try {
    const sale = new Sale(req.body);
    
    // If IMEI is provided, check if it exists and update inventory status if it's a sale
    if (sale.imei && sale.description === 'Sale') {
      const inventoryItem = await InventoryItem.findOne({ imei: sale.imei });
      if (inventoryItem) {
        inventoryItem.state = 'Sold';
        await inventoryItem.save();
      }
    }
    
    await sale.save();
    res.status(201).json(sale);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update sale
router.put('/:id', async (req, res) => {
  try {
    const sale = await Sale.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    res.json(sale);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete sale
router.delete('/:id', async (req, res) => {
  try {
    const sale = await Sale.findByIdAndDelete(req.params.id);
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    res.json({ message: 'Sale deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get sales statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const descriptionStats = await Sale.aggregate([
      {
        $group: {
          _id: '$description',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);
    
    const financeStats = await Sale.aggregate([
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
    
    res.json({ 
      descriptionStats, 
      financeStats, 
      monthlySales 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;