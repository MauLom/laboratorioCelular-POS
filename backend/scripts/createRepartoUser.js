require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a la base de datos');

    const masterAdmin = await User.findOne({ role: 'Master admin' });
    if (!masterAdmin) {
      console.error('❌ No se encontró ningún usuario con rol Master admin');
      process.exit(1);
    }

    const newUser = new User({
      username: 'reparto1',
      email: 'reparto1@empresa.com',
      password: '123456',
      firstName: 'Luis',
      lastName: 'Repartidor',
      role: 'Reparto',
      createdBy: masterAdmin._id,
      isActive: true
    });

    await newUser.save();

    console.log('✅ Usuario de Reparto creado correctamente:');
    console.log(newUser);

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error al crear usuario:', error);
    mongoose.connection.close();
  }
})();