const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const passwordConfig = require('../config/passwordConfig');
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

    // Generate temporary password
    const tempPassword = 'admin123';
    const salt = await bcrypt.genSalt(12);
    const hashedTempPassword = await bcrypt.hash(tempPassword, salt);
    
    // Set expiration date (from config)
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + passwordConfig.TEMP_PASSWORD_EXPIRY_DAYS);

    // Create the actual Master admin with temporary password
    const masterAdmin = new User({
      username: 'admin',
      email: 'admin@laboratoirocelular.com',
      password: tempPassword, // Will be hashed by pre-save hook, but user must use temp password first
      firstName: 'Master',
      lastName: 'Administrator',
      role: 'Master admin',
      createdBy: savedTempAdmin._id,
      temporaryPassword: hashedTempPassword,
      temporaryPasswordExpiresAt: expirationDate,
      temporaryPasswordUsed: false,
      mustChangePassword: true
    });

    await masterAdmin.save();
    
    // Delete the temporary admin
    await User.findByIdAndDelete(savedTempAdmin._id);

    // Update the master admin to be self-created
    masterAdmin.createdBy = masterAdmin._id;
    await masterAdmin.save();

    console.log('✅ Master admin created successfully!');
    console.log('Username: admin');
    console.log('Temporary Password: admin123');
    console.log('Email: admin@laboratoirocelular.com');
    console.log('\n⚠️  User must change password on first login!');
    console.log(`⚠️  Temporary password expires in ${passwordConfig.TEMP_PASSWORD_EXPIRY_DAYS} days.`);

  } catch (error) {
    console.error('Error creating Master admin:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

createMasterAdmin();