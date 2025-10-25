const mongoose = require('mongoose');
const Configuration = require('../models/Configuration');
require('dotenv').config();

const salesConfigurations = [
  {
    key: 'concepts_concepts',
    name: 'Conceptos de Venta',
    description: 'Conceptos predefinidos para ventas de equipos celulares',
    values: [
      { value: 'phone_new', label: 'Teléfono Nuevo' },
      { value: 'phone_used', label: 'Teléfono Usado' },
      { value: 'phone_refurbished', label: 'Teléfono Reacondicionado' },
      { value: 'accessories', label: 'Accesorios' },
      { value: 'case', label: 'Funda' },
      { value: 'screen_protector', label: 'Protector de Pantalla' },
      { value: 'charger', label: 'Cargador' },
      { value: 'cable', label: 'Cable' },
      { value: 'headphones', label: 'Audífonos' },
      { value: 'memory_card', label: 'Tarjeta de Memoria' },
      { value: 'sim_card', label: 'Tarjeta SIM' },
      { value: 'repair_service', label: 'Servicio de Reparación' },
      { value: 'screen_repair', label: 'Reparación de Pantalla' },
      { value: 'battery_replacement', label: 'Cambio de Batería' },
      { value: 'software_service', label: 'Servicio de Software' },
      { value: 'unlock_service', label: 'Servicio de Liberación' },
      { value: 'plan_activation', label: 'Activación de Plan' },
      { value: 'plan_recharge', label: 'Recarga de Plan' },
      { value: 'other', label: 'Otro' }
    ]
  },
  {
    key: 'finance_types',
    name: 'Tipos de Financiamiento',
    description: 'Opciones de financiamiento disponibles para ventas',
    values: [
      { value: 'cash', label: 'Efectivo' },
      { value: 'card', label: 'Tarjeta de Débito/Crédito' },
      { value: 'transfer', label: 'Transferencia Bancaria' },
      { value: 'financing_3', label: 'Financiamiento 3 meses' },
      { value: 'financing_6', label: 'Financiamiento 6 meses' },
      { value: 'financing_9', label: 'Financiamiento 9 meses' },
      { value: 'financing_12', label: 'Financiamiento 12 meses' },
      { value: 'financing_18', label: 'Financiamiento 18 meses' },
      { value: 'financing_24', label: 'Financiamiento 24 meses' },
      { value: 'trade_in', label: 'Intercambio' },
      { value: 'layaway', label: 'Apartado' },
      { value: 'credit_line', label: 'Línea de Crédito' },
      { value: 'mixed', label: 'Pago Mixto' }
    ]
  }
];

async function seedSalesConfigurations() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');
    console.log('🌱 Seeding sales configurations...');

    for (const configData of salesConfigurations) {
      try {
        // Check if configuration already exists
        const existingConfig = await Configuration.findOne({ key: configData.key });
        
        if (existingConfig) {
          console.log(`⚠️  Configuration '${configData.key}' already exists, skipping...`);
          continue;
        }

        // Create new configuration
        const configuration = new Configuration(configData);
        await configuration.save();
        
        console.log(`✅ Created configuration: ${configData.key} (${configData.name})`);
        console.log(`   - Values: ${configData.values.length} items`);
      } catch (error) {
        console.error(`❌ Error creating configuration ${configData.key}:`, error.message);
      }
    }

    console.log('\n🎉 Sales configurations seeding completed!');
    
  } catch (error) {
    console.error('❌ Database connection error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📦 Disconnected from MongoDB');
  }
}

// Run the seeding function if this script is executed directly
if (require.main === module) {
  seedSalesConfigurations();
}

module.exports = { seedSalesConfigurations, salesConfigurations };