const Task = require('../models/taskModel');

const taskController = {
    async createTask(req, res) {
        try {
            const task = new Task({
                ...req.body,
                userId: req.user._id  // Add the authenticated user's ID to the task
            });

            await task.save();
            res.status(201).json({
                success: true,
                task
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: 'Error creating task',
                error: error.message
            });
        }
    },

    async getTasks(req, res) {
        try {
            // Only get tasks for the authenticated user
            const tasks = await Task.find({ userId: req.user._id });
            res.json({
                success: true,
                tasks
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching tasks',
                error: error.message
            });
        }
    },

    async deleteTask(req, res) {
        try {
            await Task.findByIdAndDelete(req.params.id);
            res.json({ success: true, message: 'Task deleted successfully' });
        } catch (error) {
            res.status(400).json({ success: false, message: 'Error deleting task', error: error.message });
        }
    },

    async updateTask(req, res) {
        try {
            await Task.findByIdAndUpdate(req.params.id, req.body);
            res.json({ success: true, message: 'Task updated successfully' });
        } catch (error) {
            res.status(400).json({ success: false, message: 'Error updating task', error: error.message });
        }
    }

};

module.exports = taskController; 