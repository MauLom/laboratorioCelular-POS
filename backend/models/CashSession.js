const mongoose = require('mongoose');
const moment = require('moment-timezone');

/**
 * Define el rango del día de caja para Monterrey
 * El día de caja va desde las 21:00 (9pm) hasta las 21:00 (9pm) del día siguiente
 * Esto permite que las cajas se cierren a las 9pm hora local
 */
function getMonterreyDayRange() {
  const timezone = 'America/Monterrey';
  const now = moment().tz(timezone);
  
  // Determinar el inicio del día de caja (9pm)
  const closingHour = 23; // 11pm en formato 24 horas
  
  let start;
  if (now.hour() < closingHour) {
    start = moment().tz(timezone).subtract(1, 'day').hour(closingHour).minute(0).second(0).millisecond(0);
  } else {
    start = moment().tz(timezone).hour(closingHour).minute(0).second(0).millisecond(0);
  }
  
  const end = moment(start).add(1, 'day');
  
  return { 
    start: start.toDate(), 
    end: end.toDate() 
  };
}

const cashSessionSchema = new mongoose.Schema({
  // Referencia a la sucursal
  franchiseLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FranchiseLocation',
    required: true
  },
  
  // Usuario que abre/cierra la sesión
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Fechas de apertura y cierre
  openDateTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  closeDateTime: {
    type: Date,
    default: null
  },
  
  // Efectivo en apertura
  opening_cash_mxn: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  
  opening_cash_usd: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  
  // Efectivo en cierre
  closing_cash_mxn: {
    type: Number,
    default: null,
    min: 0
  },
  
  closing_cash_usd: {
    type: Number,
    default: null,
    min: 0
  },
  
  // Cantidad en tarjeta (ventas con tarjeta del día)
  card_amount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Cantidad retirada de la caja
  withdrawn_amount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Tipo de cambio del dólar
  exchange_rate_usd_mxn: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Estado de la sesión
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open'
  },
  
  // Notas adicionales
  notes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Índice compuesto para evitar múltiples sesiones abiertas el mismo día por sucursal
cashSessionSchema.index({ 
  franchiseLocation: 1, 
  openDateTime: 1 
});

// Método estático para verificar si hay sesión abierta hoy
cashSessionSchema.statics.findTodaySession = function(franchiseLocationId) {
  const { start, end } = getMonterreyDayRange(new Date());
  
  return this.findOne({
    franchiseLocation: franchiseLocationId,
    status: 'open',
    openDateTime: {
      $gte: start,
      $lt: end
    }
  }).populate('franchiseLocation user');
};

// Obtener cualquier sesión abierta incluso si no es de hoy
cashSessionSchema.statics.findAnyOpenSession = function(franchiseLocationId) {
  return this.findOne({
    franchiseLocation: franchiseLocationId,
    status: 'open'
  }).sort({ openDateTime: -1 }).populate('franchiseLocation user');
};

// Método de instancia para cerrar sesión
cashSessionSchema.methods.closeSession = function(closeData) {
  this.closeDateTime = new Date();
  this.closing_cash_mxn = closeData.closing_cash_mxn;
  this.closing_cash_usd = closeData.closing_cash_usd;
  this.card_amount = closeData.card_amount || 0;
  this.withdrawn_amount = closeData.withdrawn_amount || 0;
  this.status = 'closed';
  if (closeData.notes) {
    this.notes = closeData.notes;
  }
  
  return this.save();
};

// Cierre forzado por admin (sin validar fechas)
cashSessionSchema.methods.forceCloseSession = function(closeData) {
  this.status = 'closed';
  this.closeDateTime = new Date();

  if (closeData) {
    this.closing_cash_mxn = closeData.closing_cash_mxn ?? this.closing_cash_mxn;
    this.closing_cash_usd = closeData.closing_cash_usd ?? this.closing_cash_usd;
    this.card_amount = closeData.card_amount ?? this.card_amount;
    this.withdrawn_amount = closeData.withdrawn_amount ?? this.withdrawn_amount;
    this.notes = closeData.notes ?? this.notes;
  }

  return this.save();
};

// Validación: no permitir múltiples sesiones abiertas el mismo día por sucursal
cashSessionSchema.pre('save', async function(next) {
  if (this.isNew) {
    const { start, end } = getMonterreyDayRange();
    
    const existingSession = await this.constructor.findOne({
      franchiseLocation: this.franchiseLocation,
      status: 'open',
      openDateTime: {
        $gte: start,
        $lt: end
      }
    });
    
    if (existingSession) {
      return next(new Error('Ya existe una sesión de caja abierta para hoy en esta sucursal'));
    }
  }
  next();
});

module.exports = mongoose.model('CashSession', cashSessionSchema);