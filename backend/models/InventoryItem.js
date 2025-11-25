const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
  imei: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  imei2: {
    type: String,
    trim: true,
    sparse: true // Allows multiple nulls but unique when present
  },
  state: {
    type: String,
    required: true,
    enum: ['New', 'Repair', 'OnRepair', 'Repaired', 'Sold', 'OnSale', 'Lost', 'Clearance'], // Keep 'Repair' and 'Clearance' for backward compatibility
    default: 'New'
  },
  franchiseLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FranchiseLocation',
    required: true
  },
  productType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductType'
  },
  // Keep legacy fields for backward compatibility
  model: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    trim: true
  },
  storage: {
    type: String,
    trim: true
  },
  // New purchase-related fields
  provider: {
    type: String,
    trim: true
  },
  purchasePrice: {
    type: Number,
    min: 0
  },
  purchaseInvoiceId: {
    type: String,
    trim: true
  },
  purchaseInvoiceDate: {
    type: Date
  },
  // Existing fields
  price: {
    type: Number,
    min: 0
  }, // Sale price
  notes: {
    type: String,
    trim: true
  },
  hiddenDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for better performance
// Note: imei index is automatically created by unique: true
inventoryItemSchema.index({ state: 1 });
inventoryItemSchema.index({ franchiseLocation: 1 });
inventoryItemSchema.index({ productType: 1 });
// Index for imei2 with sparse option to allow multiple nulls but ensure uniqueness when present
inventoryItemSchema.index({ imei2: 1 }, { sparse: true, unique: true });

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