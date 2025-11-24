const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema(
  {
    reason: {
      type: String,
      required: [true, 'El motivo es obligatorio'],
      trim: true,
      minlength: [2, 'El motivo debe tener al menos 2 caracteres']
    },

    amount: {
      type: Number,
      required: [true, 'El monto es obligatorio'],
      min: [0, 'El monto no puede ser negativo']
    },

    user: {
      type: String,
      required: [true, 'El usuario es obligatorio'],
      trim: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    franchiseLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FranchiseLocation',
      required: false,
      index: true
    },

    deviceGuid: {
      type: String,
      required: false,
      index: true
    },

    date: {
      type: Date,
      required: [true, 'La fecha es obligatoria'],
      index: true
    },

    notes: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { timestamps: true }
);

ExpenseSchema.index({ date: -1 });
ExpenseSchema.index({ user: 1, date: -1 });
ExpenseSchema.index({ franchiseLocation: 1, date: -1 });
ExpenseSchema.index({ createdBy: 1, date: -1 });
ExpenseSchema.index({ deviceGuid: 1, date: -1 });

module.exports = mongoose.model('Expense', ExpenseSchema);