const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authmiddleware');

// Routes publiques
router.post('/login', authController.login);

router.post('/logout', authMiddleware.verifyToken, authController.logout);

// Routes protégées
router.post('/change-password', authMiddleware.verifyToken, authController.changePassword);

module.exports = router;