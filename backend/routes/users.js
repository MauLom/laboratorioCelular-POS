const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate, requireMasterAdmin } = require('../middleware/auth');

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
    const rolesThatNeedLocation = ['Cajero', 'Supervisor de sucursal', 'Oficina'];
    if (rolesThatNeedLocation.includes(userData.role) && !userData.franchiseLocation) {
      return res.status(400).json({ 
        error: `Role ${userData.role} requires a franchise location assignment.` 
      });
    }
    
    const user = new User(userData);
    await user.save();
    
    // Populate the created user for response
    await user.populate('franchiseLocation');
    await user.populate('createdBy', 'username firstName lastName');
    
    res.status(201).json({ 
      message: 'User created successfully', 
      user 
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
    const rolesThatNeedLocation = ['Cajero', 'Supervisor de sucursal', 'Oficina'];
    
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

// Reset user password (Master admin only)
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
    
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Password reset successfully' });
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