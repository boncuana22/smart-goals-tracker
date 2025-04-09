const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Rute publice
router.post('/register', authController.register);
router.post('/login', authController.login);

// Rute protejate
router.get('/profile', authMiddleware, authController.getProfile);

module.exports = router;