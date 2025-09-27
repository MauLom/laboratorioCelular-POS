const mongoose = require('mongoose');

const characteristicValueSchema = new mongoose.Schema({
  characteristic: { type: mongoose.Schema.Types.ObjectId, ref: 'Characteristic', required: true },
  brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
  value: { type: String, required: true, trim: true },
  displayName: { type: String, required: true, trim: true },
  hexColor: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

characteristicValueSchema.index({ characteristic: 1, brand: 1, value: 1 }, { unique: true });
characteristicValueSchema.index({ characteristic: 1, brand: 1, isActive: 1 });

module.exports = mongoose.model('CharacteristicValue', characteristicValueSchema);
