const Todo = require('../models/todoModel');

const todoController = {
    // Create a new todo
    createTodo: async (req, res) => {
        try {
            const newTodo = new Todo({
                ...req.body,
                userId: req.user.id // Assuming user info is added by auth middleware
            });
            const savedTodo = await newTodo.save();
            res.status(201).json(savedTodo);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    // Get all todos for a user
    getAllTodos: async (req, res) => {
        try {
            const todos = await Todo.find({ userId: req.user.id })
                .sort({ dueDate: 1 }); // Sort by due date ascending
            res.json(todos);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Get a specific todo
    getTodoById: async (req, res) => {
        try {
            const todo = await Todo.findOne({
                _id: req.params.id,
                userId: req.user.id
            });
            if (!todo) {
                return res.status(404).json({ message: 'Todo not found' });
            }
            res.json(todo);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Update a todo
    updateTodo: async (req, res) => {
        try {
            const updatedTodo = await Todo.findOneAndUpdate(
                {
                    _id: req.params.id,
                    userId: req.user.id
                },
                req.body,
                { new: true, runValidators: true }
            );
            if (!updatedTodo) {
                return res.status(404).json({ message: 'Todo not found' });
            }
            res.json(updatedTodo);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    // Delete a todo
    deleteTodo: async (req, res) => {
        try {
            const deletedTodo = await Todo.findOneAndDelete({
                _id: req.params.id,
                userId: req.user.id
            });
            if (!deletedTodo) {
                return res.status(404).json({ message: 'Todo not found' });
            }
            res.json({ message: 'Todo deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Toggle todo status
    toggleStatus: async (req, res) => {
        try {
            const todo = await Todo.findOne({
                _id: req.params.id,
                userId: req.user.id
            });
            if (!todo) {
                return res.status(404).json({ message: 'Todo not found' });
            }
            todo.status = todo.status === 'Incomplete' ? 'Completed' : 'Incomplete';
            await todo.save();
            res.json(todo);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    // Get todos by status
    getTodosByStatus: async (req, res) => {
        try {
            const todos = await Todo.find({
                userId: req.user.id,
                status: req.params.status
            }).sort({ dueDate: 1 });
            res.json(todos);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Get todos by due date range
    getTodosByDateRange: async (req, res) => {
        try {
            const { startDate, endDate } = req.query;
            const todos = await Todo.find({
                userId: req.user.id,
                dueDate: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            }).sort({ dueDate: 1 });
            res.json(todos);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = todoController;  