const mongoose = require('mongoose');
const Configuration = require('../models/Configuration');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/laboratorioCelular';

const defaultConfigurations = [
  {
    key: 'sales_descriptions',
    name: 'Descripciones de Ventas',
    description: 'Tipos de descripción para las ventas',
    values: [
      { value: 'Fair', label: 'Justo', isActive: true },
      { value: 'Payment', label: 'Pago', isActive: true },
      { value: 'Sale', label: 'Venta', isActive: true },
      { value: 'Deposit', label: 'Depósito', isActive: true }
    ]
  },
  {
    key: 'finance_types',
    name: 'Tipos de Financiamiento',
    description: 'Tipos de financiamiento disponibles',
    values: [
      { value: 'Payjoy', label: 'Payjoy', isActive: true },
      { value: 'Lespago', label: 'Lespago', isActive: true },
      { value: 'Repair', label: 'Reparación', isActive: true },
      { value: 'Accessory', label: 'Accesorio', isActive: true },
      { value: 'Cash', label: 'Efectivo', isActive: true },
      { value: 'Other', label: 'Otro', isActive: true }
    ]
  }
];

async function seedConfigurations() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    for (const config of defaultConfigurations) {
      const existingConfig = await Configuration.findOne({ key: config.key });
      
      if (!existingConfig) {
        const newConfig = new Configuration(config);
        await newConfig.save();
        console.log(`✅ Created configuration: ${config.name}`);
      } else {
        console.log(`⚠️  Configuration already exists: ${config.name}`);
      }
    }

    console.log('Configuration seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding configurations:', error);
    process.exit(1);
  }
}

seedConfigurations();