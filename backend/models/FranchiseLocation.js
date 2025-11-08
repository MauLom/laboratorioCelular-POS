const mongoose = require('mongoose');

const franchiseLocationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: 10,
    match: [/^[A-Z0-9]+$/, 'Code must contain only uppercase letters and numbers']
  },
  address: {
    street: {
      type: String,
      trim: true,
      maxlength: 200
    },
    city: {
      type: String,
      trim: true,
      maxlength: 100
    },
    state: {
      type: String,
      trim: true,
      maxlength: 100
    },
    zipCode: {
      type: String,
      trim: true,
      maxlength: 20
    },
    country: {
      type: String,
      trim: true,
      maxlength: 100,
      default: 'Mexico'
    }
  },
  contact: {
    phone: {
      type: String,
      trim: true,
      maxlength: 20
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    }
  },
  type: {
    type: String,
    required: true,
    enum: ['Sucursal', 'Oficina'],
    default: 'Sucursal'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  guid: {
    type: String,
    trim: true,
    unique: true,
    sparse: true // Permite valores null/undefined duplicados, pero no strings duplicados
  }
}, {
  timestamps: true
});

// Indexes for better performance
// Note: code and guid indexes are automatically created by unique: true
franchiseLocationSchema.index({ name: 1 });
franchiseLocationSchema.index({ type: 1 });
franchiseLocationSchema.index({ isActive: 1 });

// Virtual to get full address
franchiseLocationSchema.virtual('fullAddress').get(function() {
  const addr = this.address;
  if (!addr.street && !addr.city && !addr.state) return '';
  
  const parts = [addr.street, addr.city, addr.state, addr.zipCode].filter(Boolean);
  return parts.join(', ');
});

module.exports = mongoose.model('FranchiseLocation', franchiseLocationSchema);