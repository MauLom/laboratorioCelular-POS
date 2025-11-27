const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/expensesController');
const { authenticate } = require('../middleware/auth');
const FranchiseLocation = require('../models/FranchiseLocation');

const validateDeviceTrackerLocation = async (req, res, next) => {
  try {
    const locationId = req.body.franchiseLocation || req.body.branch;

    if (!locationId) {
      return res.status(400).json({
        error: 'Debe enviarse franchiseLocation desde Device Tracker'
      });
    }

    const exists = await FranchiseLocation.findById(locationId);

    if (!exists) {
      return res.status(404).json({
        error: 'Sucursal inexistente para este GUID'
      });
    }

    req.body.franchiseLocation = locationId;
    delete req.body.branch;

    next();
  } catch (error) {
    console.error('Error validando sucursal:', error);
    res.status(500).json({ error: 'Error interno validando sucursal' });
  }
};

router.get('/', authenticate, ctrl.list);
router.get('/:id', authenticate, ctrl.getOne);

router.post('/', authenticate, validateDeviceTrackerLocation, ctrl.create);
router.put('/:id', authenticate, validateDeviceTrackerLocation, ctrl.update);

router.delete('/:id', authenticate, ctrl.remove);

module.exports = router;