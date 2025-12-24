const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Validate environment variables
const validateEnv = require('./validateEnv');
validateEnv();

const app = express();

mongoose.set('bufferCommands', false);
mongoose.set('bufferTimeoutMS', 0);

let isConnected = false;

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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;