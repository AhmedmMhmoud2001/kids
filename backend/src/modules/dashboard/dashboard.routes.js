const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const { checkAudience } = require('../../middlewares/audience.middleware');
const dashboardController = require('./dashboard.controller');

// KIDS Dashboard - Protected
router.get('/kids',
    authenticate,
    authorize(['ADMIN_KIDS', 'SYSTEM_ADMIN']), // Added SYSTEM_ADMIN explicitly if authorize doesn't inherit, but typically we want explicit allowed list
    checkAudience('kids'),
    dashboardController.getKidsStats
);

// NEXT Dashboard - Protected
router.get('/next',
    authenticate,
    authorize(['ADMIN_NEXT', 'SYSTEM_ADMIN']),
    checkAudience('next'),
    dashboardController.getNextStats
);

// SYSTEM ADMIN Dashboard
router.get('/system',
    authenticate,
    authorize(['SYSTEM_ADMIN']),
    dashboardController.getSystemStats
);

// Reports (SYSTEM_ADMIN) — query: preset (today|week|month|custom), from, to, status
router.get('/reports',
    authenticate,
    authorize(['SYSTEM_ADMIN']),
    dashboardController.getReports
);

module.exports = router;
