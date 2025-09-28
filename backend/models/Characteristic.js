const mongoose = require('mongoose');

const characteristicSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, trim: true },
  type: { type: String, enum: ['text', 'color', 'number', 'select'], default: 'text' },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

characteristicSchema.index({ name: 1, isActive: 1 });

module.exports = mongoose.model('Characteristic', characteristicSchema);
