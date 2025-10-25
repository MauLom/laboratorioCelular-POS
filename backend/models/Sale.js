const mongoose = require('mongoose');

const salesSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    enum: ['payment', 'sale', 'deposit']
  },
  finance: {
    type: String,
    required: true,
    enum: ['payjoy', 'lespago', 'repair', 'accessory', 'cash', 'other']
  },
  concept: {
    type: String,
    required: true,
    trim: true
  },
  imei: {
    type: String,
    trim: true,
    ref: 'InventoryItem' // Reference to inventory item if applicable
  },
  paymentType: {
    type: String,
    required: true,
    trim: true
  },
  reference: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentAmount: {
    type: Number,
    min: 0
  },
  // Additional fields for better sales tracking
  customerName: {
    type: String,
    trim: true
  },
  customerPhone: {
    type: String,
    trim: true
  },
  franchiseLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FranchiseLocation',
    required: true
  },
  notes: {
    type: String,
    trim: true
  },
  folio: {
    type: Number,
    unique: true
  }
}, {
  timestamps: true
});

salesSchema.pre('save', async function(next) {
  if (this.finance) {
    const financeMap = {
      'payjoy': 'Payjoy',
      'lespago': 'Lespago', 
      'repair': 'Repair',
      'accessory': 'Accessory',
      'cash': 'Cash',
      'other': 'Other'
    };
    
    const normalizedFinance = financeMap[this.finance.toLowerCase()];
    if (normalizedFinance) {
      this.finance = normalizedFinance;
    }
  }

  // Auto-increment folio
  if (this.isNew && !this.folio) {
    try {
      const lastSale = await this.constructor.findOne({}, {}, { sort: { folio: -1 } });
      this.folio = lastSale ? lastSale.folio + 1 : 1;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Indexes for better performance
salesSchema.index({ imei: 1 });
salesSchema.index({ description: 1 });
salesSchema.index({ finance: 1 });
salesSchema.index({ franchiseLocation: 1 });
salesSchema.index({ createdAt: -1 });

// Virtual field for backward compatibility
salesSchema.virtual('branch').get(function() {
  if (this.franchiseLocation && typeof this.franchiseLocation === 'object' && this.franchiseLocation.name) {
    return this.franchiseLocation.name;
  }
  return null;
});

// Ensure virtual fields are serialized
salesSchema.set('toJSON', { virtuals: true });
salesSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Sale', salesSchema);