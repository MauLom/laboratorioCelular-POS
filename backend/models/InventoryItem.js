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
  franchiseLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FranchiseLocation',
    required: true
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
// Note: imei index is automatically created by unique: true
inventoryItemSchema.index({ state: 1 });
inventoryItemSchema.index({ franchiseLocation: 1 });

// Virtual field for backward compatibility
inventoryItemSchema.virtual('branch').get(function() {
  if (this.franchiseLocation && typeof this.franchiseLocation === 'object' && this.franchiseLocation.name) {
    return this.franchiseLocation.name;
  }
  return null;
});

// Ensure virtual fields are serialized
inventoryItemSchema.set('toJSON', { virtuals: true });
inventoryItemSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);