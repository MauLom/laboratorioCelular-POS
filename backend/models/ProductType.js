const mongoose = require('mongoose');

const productTypeSchema = new mongoose.Schema({
  company: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Brand', 
    required: true 
  },
  model: { 
    type: String, 
    required: true, 
    trim: true 
  },
  minInventoryThreshold: { 
    type: Number, 
    required: true, 
    min: 0,
    default: 0
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }
}, { timestamps: true });

// Ensure unique combination of company and model
productTypeSchema.index({ company: 1, model: 1, isActive: 1 }, { unique: true });
productTypeSchema.index({ company: 1, isActive: 1 });
productTypeSchema.index({ isActive: 1 });

module.exports = mongoose.model('ProductType', productTypeSchema);

