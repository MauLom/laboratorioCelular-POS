const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
  imei: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    enum: ['New', 'Repair', 'Repaired', 'Sold', 'Lost', 'Clearance'],
    default: 'New'
  },
  branch: {
    type: String,
    required: true,
    trim: true
  },
  hiddenDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Additional fields for better inventory management
  model: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    min: 0
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
inventoryItemSchema.index({ imei: 1 });
inventoryItemSchema.index({ state: 1 });
inventoryItemSchema.index({ branch: 1 });

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);