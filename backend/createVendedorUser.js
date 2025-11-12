// createVendedorUser.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
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

    // Generate temporary password
    const tempPassword = '123456';
    const salt = await bcrypt.genSalt(12);
    const hashedTempPassword = await bcrypt.hash(tempPassword, salt);
    
    // Set expiration date (7 days from now)
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);

    // Crear usuario vendedor con contraseña temporal
    const newUser = new User({
      username: 'vendedor1',
      email: 'vendedor1@empresa.com',
      password: tempPassword, // Se hasheará automáticamente, pero el usuario debe usar la temp primero
      firstName: 'Juan',
      lastName: 'Pérez',
      role: 'Vendedor',
      createdBy: masterAdmin._id,
      isActive: true,
      temporaryPassword: hashedTempPassword,
      temporaryPasswordExpiresAt: expirationDate,
      temporaryPasswordUsed: false,
      mustChangePassword: true
    });

    await newUser.save();

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error al crear usuario:', error);
    mongoose.connection.close();
  }
})();