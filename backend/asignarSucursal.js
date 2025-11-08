require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const FranchiseLocation = require('./models/FranchiseLocation');

(async () => {
  try {
    console.log('📦 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const location = await FranchiseLocation.findOne();
    if (!location) {
      return process.exit(0);
    }


    const result = await User.updateMany(
      { role: { $in: ['Cajero', 'Vendedor'] }, $or: [{ franchiseLocation: null }, { franchiseLocation: { $exists: false } }] },
      { $set: { franchiseLocation: location._id } }
    );

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();