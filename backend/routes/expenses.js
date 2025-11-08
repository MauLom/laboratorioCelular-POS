const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/expensesController');
const { authenticate, applyFranchiseFilter, applyRoleDataFilter } = require('../middleware/auth');

// 🔐 Todas las rutas pasan por autenticación y filtro por rol
router.get('/', authenticate, applyFranchiseFilter, applyRoleDataFilter, ctrl.list);
router.get('/:id', authenticate, applyFranchiseFilter, ctrl.getOne);
router.post('/', authenticate, applyRoleDataFilter, ctrl.create);
router.put('/:id', authenticate, applyRoleDataFilter, ctrl.update);
router.delete('/:id', authenticate, ctrl.remove);

module.exports = router;