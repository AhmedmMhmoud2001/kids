const express = require('express');
const router = express.Router();
const controller = require('./next-push.controller');
const { authenticate } = require('../../../middlewares/auth.middleware');
const { authorize } = require('../../../middlewares/role.middleware');

const nextAdmins = authorize(['SYSTEM_ADMIN', 'ADMIN_NEXT']);

// Literal-path routes go FIRST so Express doesn't bind "next-push" / "fulfill-batch" as a UUID for /:id/...
// Merged push: queue NEXT items from many orders under one correlationId.
router.post('/next-push/start-batch', authenticate, nextAdmins, controller.startBatch);

// Cross-order push history for a single correlationId (powers merged-push polling).
router.get('/next-push/correlation/:correlationId', authenticate, nextAdmins, controller.historyByCorrelation);

// Start a new push run for this order — returns the payload the extension consumes.
router.post('/:id/next-push/start', authenticate, nextAdmins, controller.start);

// Extension reports back per-item outcome.
router.post('/:id/next-push/result', authenticate, nextAdmins, controller.result);

// Admin UI reads history to render progress + past runs.
router.get('/:id/next-push', authenticate, nextAdmins, controller.history);

module.exports = router;
