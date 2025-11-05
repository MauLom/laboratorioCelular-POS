require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

(async () => {
  try {
    console.log('📦 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const users = await User.find({}, 'username role franchiseLocation');
    console.log('📋 Usuarios encontrados:\n');
    users.forEach(u => {
      console.log(`👤 ${u.username} | Rol: ${u.role} | Sucursal: ${u.franchiseLocation ? u.franchiseLocation : '❌ Ninguna asignada'}`);
    });

    console.log('\n🔍 Total de usuarios:', users.length);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();