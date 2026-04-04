const express = require('express');
const router = express.Router();
const controller = require('./favorites.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

router.post('/add', authenticate, controller.add);
router.delete('/remove/:productId', authenticate, controller.remove);
router.get('/', authenticate, controller.getAll);

module.exports = router;
