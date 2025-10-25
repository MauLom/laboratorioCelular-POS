const mongoose = require('mongoose');

const salesSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    enum: ['Fair', 'Payment', 'Sale', 'Deposit']
  },
  finance: {
    type: String,
    required: true,
    enum: ['Payjoy', 'Lespago', 'Repair', 'Accessory', 'Cash', 'Other']
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
  // Articles array for multi-article sales
  articles: [{
    id: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    concept: {
      type: String,
      required: true
    },
    finance: {
      type: String,
      required: true
    },
    imei: {
      type: String,
      trim: true
    },
    reference: {
      type: String,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    }
  }],
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
  // User information who created the sale
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdByName: {
    type: String,
    required: true,
    trim: true
  },
  createdByRole: {
    type: String,
    required: true,
    trim: true
  },
  createdByUsername: {
    type: String,
    required: true,
    trim: true
  },
  folio: {
    type: Number,
    unique: true
  }
}, {
  timestamps: true
});

// Counter schema for atomic folio generation
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});
const Counter = mongoose.model('Counter', counterSchema);

// Function to get next folio atomically
async function getNextFolio() {
  const counter = await Counter.findByIdAndUpdate(
    'sale_folio',
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
}

// Auto-increment folio before saving with retry mechanism
salesSchema.pre('save', async function(next) {
  if (this.isNew && !this.folio) {
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        this.folio = await getNextFolio();
        
        // Check if folio already exists (rare case)
        const existingSale = await this.constructor.findOne({ folio: this.folio });
        if (!existingSale) {
          break; // Folio is unique, proceed
        }
        
        attempts++;
        if (attempts >= maxAttempts) {
          return next(new Error('Unable to generate unique folio after multiple attempts'));
        }
      } catch (error) {
        return next(error);
      }
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