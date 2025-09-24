const mongoose = require('mongoose');

const configurationSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  values: [{
    value: {
      type: String,
      required: true
    },
    label: {
      type: String,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
configurationSchema.index({ key: 1 });
configurationSchema.index({ isActive: 1 });

module.exports = mongoose.model('Configuration', configurationSchema);