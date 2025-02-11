const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
    },
    status: {
        type: String,
        enum: ['Incomplete', 'Completed'],
        default: 'Incomplete'
    },
    dueDate: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});

// Index for faster queries
todoSchema.index({ userId: 1, status: 1 });
todoSchema.index({ userId: 1, dueDate: 1 });

module.exports = mongoose.model('Todo', todoSchema);