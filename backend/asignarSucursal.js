require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const FranchiseLocation = require('./models/FranchiseLocation');

(async () => {
  try {
    console.log('📦 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Busca una sucursal activa
    const location = await FranchiseLocation.findOne();
    if (!location) {
      console.log('❌ No se encontró ninguna sucursal en FranchiseLocation.');
      return process.exit(0);
    }

    console.log(`🏪 Sucursal seleccionada: ${location.name || location._id}`);

    // Actualiza usuarios sin sucursal
    const result = await User.updateMany(
      { role: { $in: ['Cajero', 'Vendedor'] }, $or: [{ franchiseLocation: null }, { franchiseLocation: { $exists: false } }] },
      { $set: { franchiseLocation: location._id } }
    );

    console.log(`✅ Usuarios actualizados: ${result.modifiedCount}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();