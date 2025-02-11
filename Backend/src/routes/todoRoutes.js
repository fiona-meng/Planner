const express = require('express');
const router = express.Router();
const todoController = require('../controllers/todoController');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

router.post('/', todoController.createTodo);
router.get('/', todoController.getTodos);
router.put('/:id', todoController.updateTodo);
router.delete('/:id', todoController.deleteTodo);
router.put('/:id/toggle', todoController.toggleStatus);
router.get('/status/:status', todoController.getTodosByStatus);
router.get('/date/:date', todoController.getTodosByDate);
router.get('/date-range', todoController.getTodosByDateRange);

module.exports = router; 