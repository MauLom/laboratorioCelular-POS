const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const router = express.Router();
const User = require('../models/User');
const { authenticate, requireMasterAdmin } = require('../middleware/auth');
const passwordConfig = require('../config/passwordConfig');
const { ROLES } = require('../utils/roles');

// Generate a secure random password
function generateSecurePassword(length = 12) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const randomBytes = crypto.randomBytes(length);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }
  return password;
}

// Helper function to set temporary password for a user
async function setTemporaryPassword(plainPassword, daysUntilExpiration = passwordConfig.TEMP_PASSWORD_EXPIRY_DAYS) {
  const salt = await bcrypt.genSalt(12);
  const hashedTempPassword = await bcrypt.hash(plainPassword, salt);
  
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + daysUntilExpiration);
  
  return {
    temporaryPassword: hashedTempPassword,
    temporaryPasswordExpiresAt: expirationDate,
    temporaryPasswordUsed: false,
    mustChangePassword: true
  };
}

// Get all users (Master admin only)
router.get('/', authenticate, requireMasterAdmin, async (req, res) => {
  try {
    const { role, franchiseLocation, isActive, page = 1, limit = 10 } = req.query;
    const query = {};
    
    if (role) query.role = role;
    if (franchiseLocation) query.franchiseLocation = franchiseLocation;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };
    
    const users = await User.find(query)
      .populate('franchiseLocation')
      .populate('createdBy', 'username firstName lastName')
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit)
      .sort(options.sort);
      
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      totalPages: Math.ceil(total / options.limit),
      currentPage: options.page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single user by ID (Master admin only)
router.get('/:id', authenticate, requireMasterAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('franchiseLocation')
      .populate('createdBy', 'username firstName lastName');
      
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new user (Master admin only)
router.post('/', authenticate, requireMasterAdmin, async (req, res) => {
  try {
    const userData = {
      ...req.body,
      createdBy: req.user._id
    };
    
    // Validate role-location requirement
    const rolesThatNeedLocation = [ROLES.CASHIER, ROLES.BRANCH_SUPERVISOR, ROLES.OFFICE];
    if (rolesThatNeedLocation.includes(userData.role) && !userData.franchiseLocation) {
      return res.status(400).json({ 
        error: `Role ${userData.role} requires a franchise location assignment.` 
      });
    }
    
    // Generate temporary password (use provided password or generate secure random one)
    // If password is provided in request, use it; otherwise generate a secure random password
    const tempPassword = userData.password || generateSecurePassword(12);
    
    // Set temporary password fields
    const tempPasswordData = await setTemporaryPassword(tempPassword, passwordConfig.TEMP_PASSWORD_EXPIRY_DAYS);
    userData.temporaryPassword = tempPasswordData.temporaryPassword;
    userData.temporaryPasswordExpiresAt = tempPasswordData.temporaryPasswordExpiresAt;
    userData.temporaryPasswordUsed = tempPasswordData.temporaryPasswordUsed;
    userData.mustChangePassword = tempPasswordData.mustChangePassword;
    
    // Set main password (will be hashed by pre-save hook, but user must use temp password first)
    // The main password is set to the same value, but user must login with temp password first
    userData.password = tempPassword;
    
    const user = new User(userData);
    await user.save();
    
    // Populate the created user for response
    await user.populate('franchiseLocation');
    await user.populate('createdBy', 'username firstName lastName');
    
    res.status(201).json({ 
      message: 'User created successfully with temporary password', 
      user,
      temporaryPassword: tempPassword // Include in response for admin to share with user
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      res.status(400).json({ error: `${field} already exists` });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// Update user (Master admin only)
router.put('/:id', authenticate, requireMasterAdmin, async (req, res) => {
  try {
    const allowedUpdates = [
      'firstName', 'lastName', 'email', 'role', 
      'franchiseLocation', 'isActive'
    ];
    
    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });
    
    // Validate role-location requirement
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const finalRole = updates.role || user.role;
    const finalLocation = updates.franchiseLocation || user.franchiseLocation;
    const rolesThatNeedLocation = [ROLES.CASHIER, ROLES.BRANCH_SUPERVISOR, ROLES.OFFICE];
    
    if (rolesThatNeedLocation.includes(finalRole) && !finalLocation) {
      return res.status(400).json({ 
        error: `Role ${finalRole} requires a franchise location assignment.` 
      });
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('franchiseLocation').populate('createdBy', 'username firstName lastName');
    
    res.json({ 
      message: 'User updated successfully', 
      user: updatedUser 
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      res.status(400).json({ error: `${field} already exists` });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// Delete user (Master admin only) - Soft delete by setting isActive to false
router.delete('/:id', authenticate, requireMasterAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Prevent master admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    // Soft delete
    user.isActive = false;
    await user.save();
    
    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset user password (Master admin only) - Sets temporary password
router.post('/:id/reset-password', authenticate, requireMasterAdmin, async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Invalidate old temporary password if it exists
    if (user.temporaryPassword) {
      user.invalidateTemporaryPassword();
    }
    
    // Set new temporary password
    const tempPassword = newPassword;
    const tempPasswordData = await setTemporaryPassword(tempPassword, passwordConfig.TEMP_PASSWORD_EXPIRY_DAYS);
    
    user.temporaryPassword = tempPasswordData.temporaryPassword;
    user.temporaryPasswordExpiresAt = tempPasswordData.temporaryPasswordExpiresAt;
    user.temporaryPasswordUsed = tempPasswordData.temporaryPasswordUsed;
    user.mustChangePassword = tempPasswordData.mustChangePassword;
    
    // Don't change the main password - user must use temporary password first
    // The main password will be updated when user sets new password via /auth/set-new-password
    
    await user.save();
    
    res.json({ 
      message: 'Temporary password set successfully. User must change password on next login.',
      temporaryPassword: tempPassword // Include in response for admin to share with user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user statistics
router.get('/stats/summary', authenticate, requireMasterAdmin, async (req, res) => {
  try {
    const roleStats = await User.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const locationStats = await User.aggregate([
      { $match: { isActive: true, franchiseLocation: { $exists: true } } },
      {
        $lookup: {
          from: 'franchiselocations',
          localField: 'franchiseLocation',
          foreignField: '_id',
          as: 'location'
        }
      },
      { $unwind: '$location' },
      {
        $group: {
          _id: '$location.name',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const totalUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });
    
    res.json({ 
      roleStats, 
      locationStats, 
      totalUsers, 
      inactiveUsers 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;