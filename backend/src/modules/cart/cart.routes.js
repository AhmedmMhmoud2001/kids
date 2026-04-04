const express = require('express');
const router = express.Router();
const controller = require('./cart.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

router.post('/add', authenticate, controller.addToCart);
router.put('/update/:itemId', authenticate, controller.updateItem);
router.delete('/remove/:itemId', authenticate, controller.removeItem);
router.get('/', authenticate, controller.getCart);

module.exports = router;
