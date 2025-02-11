const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Debug middleware
router.use((req, res, next) => {
    console.log('Auth route hit:', req.method, req.url);
    next();
});

// Public routes (no auth required)
router.post('/login', authController.login);
router.post('/register', authController.register);

// Protected routes (auth required)
router.use(auth);
// Add any protected auth routes here

module.exports = router; 