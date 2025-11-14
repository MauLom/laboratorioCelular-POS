const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const passwordConfig = require('../config/passwordConfig');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  role: {
    type: String,
    required: true,
    enum: [
      'Cajero',
      'Vendedor',
      'Supervisor de sucursal', 
      'Supervisor de sucursales',
      'Oficina',
      'Supervisor de oficina',
      'Master admin',
      'Reparto'
    ]
  },
  franchiseLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FranchiseLocation',
    required: function() {
      // Required for roles that need to be linked to a location
      return ['Cajero', 'Supervisor de sucursal', 'Oficina'].includes(this.role);
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  temporaryPassword: {
    type: String,
    default: null
  },
  temporaryPasswordExpiresAt: {
    type: Date,
    default: null
  },
  temporaryPasswordUsed: {
    type: Boolean,
    default: false
  },
  passwordHistory: [{
    password: String,
    changedAt: { type: Date, default: Date.now }
  }],
  mustChangePassword: {
    type: Boolean,
    default: false
  },
  passwordChangedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    // Add current password to history before changing it (only for existing users)
    if (!this.isNew) {
      // Get the old password hash from the database
      const oldUser = await this.constructor.findById(this._id).select('password');
      if (oldUser && oldUser.password) {
        await this.addToPasswordHistory(oldUser.password);
      }
    }
    
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    this.passwordChangedAt = new Date();
    this.mustChangePassword = false;
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Add password to history (keeps last N passwords, configurable)
userSchema.methods.addToPasswordHistory = async function(oldPasswordHash) {
  const MAX_HISTORY = passwordConfig.PASSWORD_HISTORY_COUNT;
  
  if (!oldPasswordHash) {
    // If no old password provided, use current password
    oldPasswordHash = this.password;
  }
  
  // Add current password to history
  if (!this.passwordHistory) {
    this.passwordHistory = [];
  }
  
  this.passwordHistory.push({
    password: oldPasswordHash,
    changedAt: new Date()
  });
  
  // Keep only the last N passwords
  if (this.passwordHistory.length > MAX_HISTORY) {
    this.passwordHistory = this.passwordHistory.slice(-MAX_HISTORY);
  }
};

// Check if password was used before (in history or current password)
userSchema.methods.checkPasswordHistory = async function(candidatePassword) {
  // First check against current password
  const isCurrentPassword = await bcrypt.compare(candidatePassword, this.password);
  if (isCurrentPassword) {
    return true; // Password matches current password
  }
  
  // Then check against password history
  if (!this.passwordHistory || this.passwordHistory.length === 0) {
    return false;
  }
  
  // Check against all passwords in history
  for (const historyEntry of this.passwordHistory) {
    const isMatch = await bcrypt.compare(candidatePassword, historyEntry.password);
    if (isMatch) {
      return true; // Password was used before
    }
  }
  
  return false; // Password not found in history
};

// Compare against temporary password
userSchema.methods.compareTemporaryPassword = async function(candidatePassword) {
  // Check if temporary password exists and is not expired
  if (!this.temporaryPassword) {
    return false;
  }
  
  // Check if temporary password has expired
  if (this.temporaryPasswordExpiresAt && this.temporaryPasswordExpiresAt < new Date()) {
    return false;
  }
  
  // Check if temporary password was already used
  if (this.temporaryPasswordUsed) {
    return false;
  }
  
  // Compare the candidate password with the temporary password
  return await bcrypt.compare(candidatePassword, this.temporaryPassword);
};

// Invalidate temporary password (mark as used)
userSchema.methods.invalidateTemporaryPassword = function() {
  this.temporaryPasswordUsed = true;
  this.temporaryPassword = null;
  this.temporaryPasswordExpiresAt = null;
};

// Get full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Remove password and sensitive fields from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.temporaryPassword;
  delete user.passwordHistory;
  return user;
};

// Indexes for better performance
// Note: username and email indexes are automatically created by unique: true
userSchema.index({ role: 1 });
userSchema.index({ franchiseLocation: 1 });
userSchema.index({ isActive: 1 });

module.exports = mongoose.model('User', userSchema);