// createVendedorUser.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

(async () => {
  try {
    // Conexión a la base
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a la base de datos');

    // Buscar el Master admin existente
    const masterAdmin = await User.findOne({ role: 'Master admin' });
    if (!masterAdmin) {
      console.error('❌ No se encontró ningún usuario con rol Master admin');
      process.exit(1);
    }

    console.log(`👑 Master admin encontrado: ${masterAdmin.username} (${masterAdmin._id})`);

    // Crear usuario vendedor (usa el pre('save') para hash automático)
    const newUser = new User({
      username: 'vendedor1',
      email: 'vendedor1@empresa.com',
      password: '123456', // ⚠️ se hasheará automáticamente
      firstName: 'Juan',
      lastName: 'Pérez',
      role: 'Vendedor',
      createdBy: masterAdmin._id,
      isActive: true
    });

    await newUser.save();
    console.log('✅ Usuario Vendedor creado correctamente:');
    console.log(newUser);

    await mongoose.connection.close();
    console.log('🔒 Conexión cerrada');
  } catch (error) {
    console.error('❌ Error al crear usuario:', error);
    mongoose.connection.close();
  }
})();