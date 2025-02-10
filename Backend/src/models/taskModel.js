const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    taskType: {
        type: String,
        enum: ['scheduled', 'deadline', 'flexible', 'habit', 'normal', 'exercise', 'long-term'],
        required: true
    },
    duration: {
        type: Number, // in minutes
        min: 5,
        required: true
    },
    scheduledTime: {
        type: Date,
        required: function() {
            return this.taskType === 'scheduled';
        }
    },
    deadline: {
        type: Date,
        required: function() {
            return this.taskType === 'deadline';
        }
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    status: {
        type: String,
        enum: ['Todo', 'In Progress', 'Completed', 'pending', 'scheduled'],
        default: 'Todo'
    },
    category: {
        type: String,
        trim: true,
        default: 'General'
    },
    tags: [{
        type: String,
        trim: true
    }],
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Smart Scheduling
    scheduledSlot: {
        start: Date,
        end: Date
    },
    // One-Click Rescheduling
    rescheduleHistory: [{
        originalSlot: { start: Date, end: Date },
        newSlot: { start: Date, end: Date },
        changedAt: { type: Date, default: Date.now }
    }],
    // Progress Wings
    parentTask: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
    },
    progress: {
        current: { type: Number, default: 0 },
        target: { type: Number, default: 1 },
        unit: { type: String, default: 'ratio' }
    },
    // Energy Level and ML features
    energyLevel: {
        required: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium'
        },
        preferred: {
            type: String,
            enum: ['morning', 'afternoon', 'evening'],
            default: 'morning'
        }
    },
    completionHistory: [{
        scheduledStart: Date,
        actualStart: Date,
        scheduledEnd: Date,
        actualEnd: Date,
        energyLevelReported: {
            type: String,
            enum: ['low', 'medium', 'high']
        },
        productivity: {
            type: Number,
            min: 1,
            max: 5
        }
    }],
    notifications: [{
        type: {
            type: String,
            enum: ['reminder', 'deadline', 'dependency', 'suggestion'],
            required: true
        },
        time: Date,
        message: String,
        status: {
            type: String,
            enum: ['pending', 'sent', 'read'],
            default: 'pending'
        }
    }]
}, {
    timestamps: true
});

// Indexes for fast querying
taskSchema.index({ userId: 1, status: 1 });
taskSchema.index({ deadline: 1 });
taskSchema.index({ 'scheduledSlot.start': 1 });
taskSchema.index({ 'scheduledTime': 1 });

module.exports = mongoose.model('Task', taskSchema);
