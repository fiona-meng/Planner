const express = require('express');
const router = express.Router();
const cors = require('cors');
const authController = require('../controllers/authController');

// CORS configuration
const corsOptions = {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

// Apply CORS middleware to auth routes
router.use(cors(corsOptions));

router.post('/register', authController.register);
router.post('/login', authController.login);

module.exports = router; 