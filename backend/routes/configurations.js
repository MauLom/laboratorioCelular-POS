const express = require('express');
const Configuration = require('../models/Configuration');
const { authenticate } = require('../middleware/auth');
const { ROLES } = require("../utils/roles");

const router = express.Router();

// Get all configurations or specific configuration by key
router.get('/', authenticate, async (req, res) => {
  try {
    const { key } = req.query;
    
    let query = { isActive: true };
    if (key) {
      query.key = key;
    }
    
    const configurations = await Configuration.find(query);
    
    if (key && configurations.length === 0) {
      return res.status(404).json({ error: 'Configuration not found' });
    }
    
    res.json(key ? configurations[0] : configurations);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create or update configuration (Master admin only)
router.post('/', authenticate, async (req, res) => {
  try {
    // Check if user is Master admin
    if (req.user.role !== ROLES.MASTER_ADMIN) {
      return res.status(403).json({ error: 'Access denied. Master admin required.' });
    }

    const { key, name, description, values } = req.body;

    if (!key || !name || !values || !Array.isArray(values)) {
      return res.status(400).json({ error: 'Key, name, and values array are required' });
    }

    // Validate values array
    for (const value of values) {
      if (!value.value || !value.label) {
        return res.status(400).json({ error: 'Each value must have value and label properties' });
      }
    }

    const configuration = await Configuration.findOneAndUpdate(
      { key },
      { key, name, description, values },
      { new: true, upsert: true }
    );

    res.json(configuration);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update specific configuration values (Master admin only)
router.put('/:key', authenticate, async (req, res) => {
  try {
    // Check if user is Master admin
    if (req.user.role !== ROLES.MASTER_ADMIN) {
      return res.status(403).json({ error: 'Access denied. Master admin required.' });
    }

    const { key } = req.params;
    const { values } = req.body;

    if (!values || !Array.isArray(values)) {
      return res.status(400).json({ error: 'Values array is required' });
    }

    // Validate values array
    for (const value of values) {
      if (!value.value || !value.label) {
        return res.status(400).json({ error: 'Each value must have value and label properties' });
      }
    }

    const configuration = await Configuration.findOneAndUpdate(
      { key },
      { values },
      { new: true }
    );

    if (!configuration) {
      return res.status(404).json({ error: 'Configuration not found' });
    }

    res.json(configuration);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete configuration (Master admin only)
router.delete('/:key', authenticate, async (req, res) => {
  try {
    // Check if user is Master admin
    if (req.user.role !== ROLES.MASTER_ADMIN) {
      return res.status(403).json({ error: 'Access denied. Master admin required.' });
    }

    const { key } = req.params;

    const configuration = await Configuration.findOneAndUpdate(
      { key },
      { isActive: false },
      { new: true }
    );

    if (!configuration) {
      return res.status(404).json({ error: 'Configuration not found' });
    }

    res.json({ message: 'Configuration deactivated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;