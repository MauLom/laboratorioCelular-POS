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
    date: {
      type: Date,
      required: [true, 'La fecha es obligatoria']
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

module.exports = mongoose.model('Expense', ExpenseSchema);