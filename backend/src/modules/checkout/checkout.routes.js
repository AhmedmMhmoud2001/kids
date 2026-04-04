const express = require('express');
const router = express.Router();
const controller = require('./checkout.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

router.post('/', authenticate, controller.checkout);

module.exports = router;
