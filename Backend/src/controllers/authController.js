const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};

const authController = {
    async register(req, res) {
        try {
            const { email, password } = req.body;

            // Check if user already exists
            let user = await User.findOne({ email });
            if (user) {
                return res.status(400).json({
                    success: false,
                    message: 'User already exists'
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create user
            user = await User.create({
                email,
                password: hashedPassword
            });

            // Generate token
            const token = generateToken(user._id);

            res.status(201).json({
                success: true,
                token,
                user: {
                    id: user._id
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error in registration',
                error: error.message
            });
        }
    },

    async login(req, res) {
        try {
            const { email, password } = req.body;

            // Find user
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Check password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Generate token
            const token = generateToken(user._id);

            res.json({
                success: true,
                token,
                user: {
                    id: user._id,
                    email: user.email
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Error in login',
                error: error.message
            });
        }
    },

    async googleLogin(req, res) {
        try {
            const { access_token } = req.body;
            
            // Get user info from Google
            const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${access_token}` },
            });
            
            const data = await response.json();
            const { email, name } = data;

            if (!email) {
                return res.status(401).json({
                    success: false,
                    message: 'Failed to get user info from Google'
                });
            }

            // Find or create user
            let user = await User.findOne({ email });
            if (!user) {
                user = await User.create({
                    email,
                    name: name || email.split('@')[0],
                    password: Math.random().toString(36).slice(-8), // Random password for Google users
                });
            }

            // Generate JWT token
            const token = generateToken(user._id);

            res.json({
                success: true,
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name
                }
            });
        } catch (error) {
            console.error('Google auth error:', error);
            res.status(401).json({
                success: false,
                message: 'Google authentication failed'
            });
        }
    }
};

module.exports = authController;