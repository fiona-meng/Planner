const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const auth = require('../middleware/auth');

// All routes are protected with auth middleware
router.post('/', auth, taskController.createTask);
router.get('/', auth, taskController.getTasks);
router.delete('/:id', auth, taskController.deleteTask);
router.put('/:id', auth, taskController.updateTask);

module.exports = router;
