require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a la base de datos');

    const result = await User.deleteOne({ username: 'vendedor1' });
    if (result.deletedCount > 0) {
      console.log('🗑️ Usuario vendedor1 eliminado correctamente');
    } else {
      console.log('⚠️ No se encontró el usuario vendedor1');
    }

    await mongoose.connection.close();
    console.log('🔒 Conexión cerrada');
  } catch (error) {
    console.error('❌ Error al eliminar usuario:', error);
    mongoose.connection.close();
  }
})();