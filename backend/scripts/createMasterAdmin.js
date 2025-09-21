const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createMasterAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check if a Master admin already exists
    const existingMasterAdmin = await User.findOne({ role: 'Master admin' });
    if (existingMasterAdmin) {
      console.log('Master admin already exists:', existingMasterAdmin.username);
      process.exit(0);
    }

    // Create a temporary Master admin to satisfy the createdBy requirement
    const tempAdmin = new User({
      username: 'temp-admin',
      email: 'temp@temp.com',
      password: 'temp-password',
      firstName: 'Temp',
      lastName: 'Admin',
      role: 'Master admin',
      createdBy: new mongoose.Types.ObjectId()
    });

    const savedTempAdmin = await tempAdmin.save();

    // Create the actual Master admin
    const masterAdmin = new User({
      username: 'admin',
      email: 'admin@laboratoirocelular.com',
      password: 'admin123',
      firstName: 'Master',
      lastName: 'Administrator',
      role: 'Master admin',
      createdBy: savedTempAdmin._id
    });

    await masterAdmin.save();
    
    // Delete the temporary admin
    await User.findByIdAndDelete(savedTempAdmin._id);

    // Update the master admin to be self-created
    masterAdmin.createdBy = masterAdmin._id;
    await masterAdmin.save();

    console.log('✅ Master admin created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Email: admin@laboratoirocelular.com');
    console.log('\n⚠️  Please change the default password after first login!');

  } catch (error) {
    console.error('Error creating Master admin:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

createMasterAdmin();