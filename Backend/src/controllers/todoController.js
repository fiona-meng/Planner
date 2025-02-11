const Todo = require('../models/todoModel');

const todoController = {
    async createTodo(req, res) {
        try {
            const todo = new Todo({
                ...req.body,
                userId: req.user._id
            });
            await todo.save();
            res.json({ success: true, todo });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    },

    async getTodos(req, res) {
        try {
            const todos = await Todo.find({ userId: req.user._id });
            res.json({ success: true, todos });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    },

    async updateTodo(req, res) {
        try {
            const todo = await Todo.findOneAndUpdate(
                { _id: req.params.id, userId: req.user._id },
                req.body,
                { new: true }
            );
            res.json({ success: true, todo });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    },

    async deleteTodo(req, res) {
        try {
            await Todo.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
            res.json({ success: true });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    },

    async toggleStatus(req, res) {
        try {
            const todo = await Todo.findOne({ _id: req.params.id, userId: req.user._id });
            if (!todo) {
                return res.status(404).json({ success: false, error: 'Todo not found' });
            }
    
            // Toggle between 'Completed' and 'Incomplete'
            todo.status = todo.status === 'Completed' ? 'Incomplete' : 'Completed';
            await todo.save();
            
            res.json({
                success: true,
                data: todo,
                message: `Todo marked as ${todo.status}`
            });
        } catch (error) {
            console.error('Toggle error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    async getTodosByStatus(req, res) {
        try {
            const status = req.params.status; // Should be 'Completed' or 'Incomplete'
            if (!['Completed', 'Incomplete'].includes(status)) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Status must be either Completed or Incomplete' 
                });
            }

            const todos = await Todo.find({ 
                userId: req.user._id,
                status: status
            });
            res.json({ success: true, data: todos });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    async getTodosByDate(req, res) {
        try {
            const date = new Date(req.params.date);
            const startOfDay = new Date(date.setHours(0, 0, 0, 0));
            const endOfDay = new Date(date.setHours(23, 59, 59, 999));

            const todos = await Todo.find({
                userId: req.user._id,
                dueDate: {
                    $gte: startOfDay,
                    $lte: endOfDay
                }
            });
            res.json({ success: true, data: todos });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    async getTodosByDateRange(req, res) {
        try {
            const { startDate, endDate } = req.query;
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            const todos = await Todo.find({
                userId: req.user._id,
                dueDate: {
                    $gte: start,
                    $lte: end
                }
            });
            res.json({ success: true, data: todos });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
};

module.exports = todoController;