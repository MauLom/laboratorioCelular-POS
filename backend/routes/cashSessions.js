const express = require('express');
const router = express.Router();
const CashSession = require('../models/CashSession');
const { authenticate } = require('../middleware/auth');
const { ROLES } = require('../utils/roles');

// POST /api/cash-session/open - Registra apertura de caja
router.post('/open', authenticate, async (req, res) => {
  try {
    const {
      franchiseLocationId,
      opening_cash_mxn,
      opening_cash_usd,
      exchange_rate_usd_mxn,
      notes
    } = req.body;

    // Validaciones
    if (!franchiseLocationId) {
      return res.status(400).json({ 
        error: 'franchiseLocationId es requerido' 
      });
    }

    if (opening_cash_mxn === undefined || opening_cash_mxn < 0) {
      return res.status(400).json({ 
        error: 'opening_cash_mxn debe ser un número mayor o igual a 0' 
      });
    }

    if (opening_cash_usd === undefined || opening_cash_usd < 0) {
      return res.status(400).json({ 
        error: 'opening_cash_usd debe ser un número mayor o igual a 0' 
      });
    }

    if (!exchange_rate_usd_mxn || exchange_rate_usd_mxn <= 0) {
      return res.status(400).json({ 
        error: 'exchange_rate_usd_mxn debe ser un número mayor a 0' 
      });
    }

    const anyOpenSession = await CashSession.findOne({
      franchiseLocation: franchiseLocationId,
      status: "open"
    });

    if (anyOpenSession) {
      const today = new Date();
      const sessionDate = new Date(anyOpenSession.openDateTime);

      const isSameDay =
        sessionDate.getFullYear() === today.getFullYear() &&
        sessionDate.getMonth() === today.getMonth() &&
        sessionDate.getDate() === today.getDate();

      if (!isSameDay) {
        return res.status(400).json({
          error:
            "No puedes abrir caja porque hay una sesión pendiente de cierre del día anterior. Contacta al administrador.",
          session: anyOpenSession
        });
      }
    }     

    // Verificar si ya existe una sesión abierta hoy
    const existingSession = await CashSession.findTodaySession(franchiseLocationId);
    if (existingSession) {
      return res.status(400).json({ 
        error: 'Ya existe una sesión de caja abierta para hoy en esta sucursal',
        session: existingSession
      });
    }

    // Crear nueva sesión
    const newSession = new CashSession({
      franchiseLocation: franchiseLocationId,
      user: req.user.id,
      opening_cash_mxn: parseFloat(opening_cash_mxn),
      opening_cash_usd: parseFloat(opening_cash_usd),
      exchange_rate_usd_mxn: parseFloat(exchange_rate_usd_mxn),
      notes: notes || ''
    });

    const savedSession = await newSession.save();
    await savedSession.populate('franchiseLocation user');

    res.status(201).json({
      message: 'Sesión de caja abierta exitosamente',
      session: savedSession
    });

  } catch (error) {
    
    if (error.message.includes('Ya existe una sesión')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ 
      error: 'Error interno del servidor al abrir la sesión de caja' 
    });
  }
});

// POST /api/cash-session/close - Registra cierre de caja
router.post('/close', authenticate, async (req, res) => {
  try {
    const {
      franchiseLocationId,
      closing_cash_mxn,
      closing_cash_usd,
      card_amount,
      withdrawn_amount,
      notes
    } = req.body;

    // Validaciones
    if (!franchiseLocationId) {
      return res.status(400).json({ 
        error: 'franchiseLocationId es requerido' 
      });
    }

    if (closing_cash_mxn === undefined || closing_cash_mxn < 0) {
      return res.status(400).json({ 
        error: 'closing_cash_mxn debe ser un número mayor o igual a 0' 
      });
    }

    if (closing_cash_usd === undefined || closing_cash_usd < 0) {
      return res.status(400).json({ 
        error: 'closing_cash_usd debe ser un número mayor o igual a 0' 
      });
    }

    // Buscar sesión abierta de hoy
    const session = await CashSession.findTodaySession(franchiseLocationId);
    
    if (!session) {
      return res.status(404).json({ 
        error: 'No se encontró una sesión de caja abierta para hoy en esta sucursal' 
      });
    }

    if (session.status === 'closed') {
      return res.status(400).json({ 
        error: 'La sesión de caja ya está cerrada' 
      });
    }

    // Cerrar sesión
    const closeData = {
      closing_cash_mxn: parseFloat(closing_cash_mxn),
      closing_cash_usd: parseFloat(closing_cash_usd),
      card_amount: card_amount ? parseFloat(card_amount) : 0,
      withdrawn_amount: withdrawn_amount ? parseFloat(withdrawn_amount) : 0,
      notes: notes || ''
    };

    const closedSession = await session.closeSession(closeData);

    res.json({
      message: 'Sesión de caja cerrada exitosamente',
      session: closedSession
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Error interno del servidor al cerrar la sesión de caja' 
    });
  }
});

// GET /api/cash-session/status/:franchiseId - Verifica si existe una sesión abierta hoy
router.get('/status/:franchiseId', authenticate, async (req, res) => {
  try {
    const { franchiseId } = req.params;

    if (!franchiseId) {
      return res.status(400).json({ 
        error: 'franchiseId es requerido' 
      });
    }

    // Buscar sesión de hoy
    const session = await CashSession.findTodaySession(franchiseId);

    if (!session) {
      return res.json({
        hasSession: false,
        message: 'No hay sesión de caja abierta para hoy'
      });
    }

    res.json({
      hasSession: session.status === 'open',
      status: session.status,
      session: {
        _id: session._id,
        openDateTime: session.openDateTime,
        closeDateTime: session.closeDateTime,
        opening_cash_mxn: session.opening_cash_mxn,
        opening_cash_usd: session.opening_cash_usd,
        closing_cash_mxn: session.closing_cash_mxn,
        closing_cash_usd: session.closing_cash_usd,
        card_amount: session.card_amount,
        withdrawn_amount: session.withdrawn_amount,
        exchange_rate_usd_mxn: session.exchange_rate_usd_mxn,
        status: session.status,
        franchiseLocation: session.franchiseLocation,
        user: session.user
      }
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Error interno del servidor al verificar el estado de la sesión' 
    });
  }
});

// GET /api/cash-session/history/:franchiseId - Obtener historial de sesiones (bonus)
router.get('/history/:franchiseId', authenticate, async (req, res) => {
  try {
    const { franchiseId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const sessions = await CashSession.find({ 
      franchiseLocation: franchiseId 
    })
    .populate('franchiseLocation user')
    .sort({ openDateTime: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await CashSession.countDocuments({ 
      franchiseLocation: franchiseId 
    });

    res.json({
      sessions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Error interno del servidor al obtener el historial' 
    });
  }
});

router.post('/force-close/:sessionId', authenticate, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const allowedRoles = [
      ROLES.MASTER_ADMIN,
      ROLES.ADMIN,
      ROLES.OFFICE_SUPERVISOR,
      ROLES.MULTI_BRANCH_SUPERVISOR
    ];

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'No tienes permiso para cerrar sesiones antiguas'
      });
    }

    const session = await CashSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }

    if (session.status === 'closed') {
      return res.status(400).json({ error: 'La sesión ya está cerrada' });
    }

    session.status = 'closed';
    session.closeDateTime = new Date();
    session.forceClosed = true;
    session.closedBy = req.user._id;
    session.notes = session.notes || 'Cierre forzado por administrador';

    await session.save();
    await session.populate('franchiseLocation user');

    res.json({
      message: 'Sesión cerrada exitosamente (forzado por administrador)',
      session
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Error interno del servidor al cerrar la sesión de forma forzada'
    });
  }
});

router.get('/any-open/:franchiseId', authenticate, async (req, res) => {
  try {
    const { franchiseId } = req.params;

    if (!franchiseId) {
      return res.status(400).json({ error: 'franchiseId es requerido' });
    }

    const session = await CashSession.findAnyOpenSession(franchiseId);

    return res.json(session || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al buscar sesiones abiertas' });
  }
});

module.exports = router;