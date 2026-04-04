const express = require('express');
const { sendMessage, getMessages, deleteMessage } = require('./contact.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');

const router = express.Router();

// Public – Contact Us form
router.post('/', sendMessage);

// Dashboard – any admin can view and delete contact messages
router.get(
    '/',
    authenticate,
    authorize(['SYSTEM_ADMIN', 'ADMIN_KIDS', 'ADMIN_NEXT']),
    getMessages
);

router.delete(
    '/:id',
    authenticate,
    authorize(['SYSTEM_ADMIN', 'ADMIN_KIDS', 'ADMIN_NEXT']),
    deleteMessage
);

module.exports = router;
