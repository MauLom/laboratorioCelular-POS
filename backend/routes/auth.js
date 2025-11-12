const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');
const { authenticate, requireMasterAdmin } = require('../middleware/auth');
const { validatePassword } = require('../utils/passwordValidator');

// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username }, { email: username }],
      isActive: true
    }).populate('franchiseLocation');

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    let requiresPasswordChange = false;
    let isAuthenticated = false;

    // First, check if user has a temporary password
    if (user.temporaryPassword) {
      const isTempPasswordMatch = await user.compareTemporaryPassword(password);
      if (isTempPasswordMatch) {
        // Temporary password is valid and not expired/used
        isAuthenticated = true;
        requiresPasswordChange = true;
      }
    }

    // If temporary password didn't match, check regular password
    if (!isAuthenticated) {
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials.' });
      }
      isAuthenticated = true;

      // Check if user must change password
      if (user.mustChangePassword) {
        requiresPasswordChange = true;
      }
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        role: user.role,
        franchiseLocation: user.franchiseLocation,
        lastLogin: user.lastLogin
      },
      requiresPasswordChange
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// Get current user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('franchiseLocation');
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user profile.' });
  }
});

// Update user profile (own profile only)
router.put('/profile', authenticate, async (req, res) => {
  try {
    const allowedUpdates = ['firstName', 'lastName', 'email'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).populate('franchiseLocation');

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Email already exists.' });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// Set new password (for temporary password or forced password change)
router.post('/set-new-password', authenticate, async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'New password and confirmation are required.' });
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Validate password strength
    const validation = await validatePassword(newPassword, user);
    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'Password validation failed.',
        errors: validation.errors
      });
    }

    // Check if new password is the same as temporary password
    if (user.temporaryPassword) {
      const isSameAsTemp = await user.compareTemporaryPassword(newPassword);
      if (isSameAsTemp) {
        return res.status(400).json({ 
          error: 'New password cannot be the same as the temporary password.' 
        });
      }
    }

    // Update password
    user.password = newPassword;
    
    // Invalidate temporary password if it exists
    if (user.temporaryPassword) {
      user.invalidateTemporaryPassword();
    }
    
    // Reset mustChangePassword flag
    user.mustChangePassword = false;
    
    // Save user (pre-save hook will handle password hashing and history)
    await user.save();

    res.json({ 
      message: 'Password set successfully. You can now log in with your new password.' 
    });
  } catch (error) {
    console.error('Set new password error:', error);
    res.status(500).json({ error: 'Error setting new password.' });
  }
});

// Change password (for users changing their own password)
router.put('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    // Validate password strength and history
    const validation = await validatePassword(newPassword, user);
    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'Password validation failed.',
        errors: validation.errors
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Error changing password.' });
  }
});

// Verify token (for frontend authentication checks)
router.get('/verify', authenticate, (req, res) => {
  res.json({ 
    valid: true, 
    user: {
      _id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      fullName: req.user.fullName,
      role: req.user.role,
      franchiseLocation: req.user.franchiseLocation
    }
  });
});

// Logout (for client-side token removal, server-side is stateless)
router.post('/logout', authenticate, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// ⚙️ Ruta temporal para asignar sucursal a un usuario
const FranchiseLocation = require('../models/FranchiseLocation');

router.post('/assign-location', async (req, res) => {
  try {
    const { username, franchiseLocationId } = req.body;

    if (!username || !franchiseLocationId) {
      return res.status(400).json({ error: 'Username y franchiseLocationId son requeridos.' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    // Verificar que la sucursal exista
    const location = await FranchiseLocation.findById(franchiseLocationId);
    if (!location) {
      return res.status(404).json({ error: 'Sucursal no encontrada.' });
    }

    // Asignar la sucursal al usuario
    user.franchiseLocation = location._id;
    await user.save();

    // Devolver usuario actualizado con populate
    const updatedUser = await User.findById(user._id).populate('franchiseLocation');

    res.json({
      message: 'Sucursal asignada correctamente ✅',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error al asignar sucursal:', error);
    res.status(500).json({ error: 'Error al asignar sucursal.' });
  }
});

module.exports = router;