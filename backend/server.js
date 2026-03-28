const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const cron = require('node-cron');
const moment = require('moment-timezone');
require('dotenv').config();

// Validate environment variables
const validateEnv = require('./validateEnv');
validateEnv();

const app = express();

mongoose.set('bufferCommands', false);
mongoose.set('bufferTimeoutMS', 0);

let isConnected = false;
let cronRegistered = false;

async function connectDB() {
  if (isConnected) return;

  const db = await mongoose.connect(process.env.MONGODB_URI, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
  });

  isConnected = db.connections[0].readyState === 1;
  console.log('MongoDB connected');
}

console.log('🌐 CORS Configuration:');
console.log('- Environment:', process.env.NODE_ENV || 'development');
console.log('- Allowed Frontend URL:', process.env.FRONTEND_URL || 'not set');
if (process.env.NODE_ENV === 'development') {
  console.log('- Development mode: Also allowing localhost and Vercel deployments');
}

// Middleware
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const allowedOrigin = process.env.FRONTEND_URL;

    if (origin === allowedOrigin) {
      return callback(null, true);
    }

    if (process.env.NODE_ENV === 'development') {
      if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('.vercel.app')) {
        return callback(null, true);
      }
    }

    const msg = `CORS policy violation: Origin ${origin} not allowed. Expected: ${allowedOrigin}`;
    console.warn(msg);
    return callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-branch-id', 'x-device-guid']
}));
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database not ready:', err);
    return res.status(503).json({
      error: 'Database not ready, please try again in a moment'
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Endpoint de diagnostico para verificar que el cron esta registrado
app.get('/api/debug/cron-status', async (req, res) => {
  const CashSession = require('./models/CashSession');

  try {
    const openSessions = await CashSession.findAllOpenSessions();
    const monterreyTime = moment().tz('America/Monterrey').format('YYYY-MM-DD HH:mm:ss');

    res.json({
      serverTime: new Date().toISOString(),
      monterreyTime,
      cronRegistered,
      openCashSessions: openSessions.map(s => ({
        id: s._id,
        branch: s.franchiseLocation?.name || 'Desconocida',
        openedAt: moment(s.openDateTime).tz('America/Monterrey').format('YYYY-MM-DD HH:mm:ss'),
        status: s.status
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/franchise-locations', require('./routes/franchiseLocations'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/configurations', require('./routes/configurations'));
app.use('/api/brands', require('./routes/brands'));
app.use('/api/characteristics', require('./routes/characteristics'));
app.use('/api/product-types', require('./routes/productTypes'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/cash-session', require('./routes/cashSessions'));
app.use('/api/transfers', require('./routes/transfers'));

async function compensateMissedAutoClose(CashSession) {
  try {
    const now = moment().tz('America/Monterrey');
    const openSessions = await CashSession.findAllOpenSessions();

    const staleSessions = openSessions.filter(session => {
      const openedAt = moment(session.openDateTime).tz('America/Monterrey');
      return openedAt.isBefore(now, 'day');
    });

    if (staleSessions.length === 0) {
      console.log('[COMPENSATE] No hay cajas pendientes de días anteriores');
      return;
    }

    console.log(`[COMPENSATE] Se encontraron ${staleSessions.length} cajas sin cerrar de días anteriores`);

    for (const session of staleSessions) {
      try {
        await session.autoCloseSession();
        const franchiseName = session.franchiseLocation?.name || 'Desconocida';
        console.log(`[COMPENSATE] ✓ Caja cerrada retroactivamente - Sucursal: ${franchiseName}`);
      } catch (error) {
        const franchiseName = session.franchiseLocation?.name || 'Desconocida';
        console.error(`[COMPENSATE] ✗ Error - Sucursal: ${franchiseName}`, error.message);
      }
    }
  } catch (error) {
    console.error('[COMPENSATE] Error en cierre compensatorio:', error);
  }
}

function startAutoCloseCashJob() {
  const CashSession = require('./models/CashSession');
  compensateMissedAutoClose(CashSession);

  const now = moment().tz('America/Monterrey').format('YYYY-MM-DD HH:mm:ss');
  console.log(`✓ Cron registrado a las ${now} hora Monterrey`);

  // Ejecutar todos los dias a las 11:59 PM (hora de Monterrey)
  cron.schedule('59 23 * * *', async () => {
    const monterreyTime = moment().tz('America/Monterrey').format('YYYY-MM-DD HH:mm:ss');
    console.log(`[AUTO-CLOSE] Iniciando cierre automático de cajas - ${monterreyTime}`);

    try {
      const openSessions = await CashSession.findAllOpenSessions();

      if (openSessions.length === 0) {
        console.log('[AUTO-CLOSE] No hay cajas abiertas para cerrar');
        return;
      }

      console.log(`[AUTO-CLOSE] Se encontraron ${openSessions.length} cajas abiertas`);

      for (const session of openSessions) {
        try {
          await session.autoCloseSession();
          const franchiseName = session.franchiseLocation?.name || 'Desconocida';
          console.log(`[AUTO-CLOSE] ✓ Caja cerrada - Sucursal: ${franchiseName}`);
        } catch (error) {
          const franchiseName = session.franchiseLocation?.name || 'Desconocida';
          console.error(`[AUTO-CLOSE] ✗ Error - Sucursal: ${franchiseName}`, error.message);
        }
      }

      console.log('[AUTO-CLOSE] Proceso completado');

    } catch (error) {
      console.error('[AUTO-CLOSE] Error general en cierre automático:', error);
    }
  }, {
    timezone: 'America/Monterrey'
  });

  cronRegistered = true;
  console.log('✓ Cron job de cierre automático iniciado (11:59 PM diario - Monterrey)');
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);

  try {
    await connectDB();
    startAutoCloseCashJob();
  } catch (err) {
    console.error('Error al inicializar:', err);
  }
});

module.exports = app;