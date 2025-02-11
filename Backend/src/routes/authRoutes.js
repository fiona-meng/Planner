const express = require('express');
const router = express.Router();
const cors = require('cors');
const authController = require('../controllers/authController');
const eventController = require('../controllers/eventController');
const todoController = require('../controllers/todoController');

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
router.post('/events', eventController.createEvent);
router.get('/events', eventController.getEvents);
router.delete('/events/:id', eventController.deleteEvent);
router.put('/events/:id', eventController.updateEvent);
router.post('/todos', todoController.createTodo);
router.get('/todos', todoController.getAllTodos);
router.delete('/todos/:id', todoController.deleteTodo);
router.put('/todos/:id', todoController.updateTodo);
router.get('/todos/:id', todoController.getTodoById);
router.put('/todos/:id/toggle', todoController.toggleStatus);
router.get('/todos/status/:status', todoController.getTodosByStatus);
router.get('/todos/date/:date', todoController.getTodosByDate);
router.get('/todos/date-range', todoController.getTodosByDateRange);


module.exports = router; 