const mongoose = require('mongoose');

const workingHoursSchema = new mongoose.Schema({
    startTime: {
        type: String,  // Format: "HH:mm" (24-hour format)
        required: true,
        validate: {
            validator: function(v) {
                return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: props => `${props.value} is not a valid time format! Use HH:mm`
        }
    },
    endTime: {
        type: String,  // Format: "HH:mm" (24-hour format)
        required: true,
        validate: {
            validator: function(v) {
                return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: props => `${props.value} is not a valid time format! Use HH:mm`
        }
    },
    isWorkingDay: {
        type: Boolean,
        default: true
    },
    energyLevel: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    }
});

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    schedule: {
        monday: workingHoursSchema,
        tuesday: workingHoursSchema,
        wednesday: workingHoursSchema,
        thursday: workingHoursSchema,
        friday: workingHoursSchema,
        saturday: workingHoursSchema,
        sunday: workingHoursSchema
    },
    notificationPreferences: {
        email: {
            enabled: { type: Boolean, default: true },
            frequency: {
                type: String,
                enum: ['immediate', 'daily', 'weekly'],
                default: 'immediate'
            }
        },
        push: {
            enabled: { type: Boolean, default: true },
            quietHours: {
                start: String,
                end: String
            }
        }
    },
    externalCalendars: [{
        type: {
            type: String,
            enum: ['google', 'outlook', 'apple'],
            required: true
        },
        accessToken: String,
        refreshToken: String,
        calendarId: String,
        syncEnabled: {
            type: Boolean,
            default: true
        }
    }],
    learningPreferences: {
        adaptToRejections: { type: Boolean, default: true },
        trackProductivity: { type: Boolean, default: true },
        suggestOptimalTimes: { type: Boolean, default: true }
    }
}, {
    timestamps: true
});

// Add a pre-save middleware to set default schedule
userSchema.pre('save', function(next) {
    if (!this.isNew) return next();

    const defaultWorkDay = {
        startTime: "09:00",
        endTime: "17:00",
        isWorkingDay: true
    };

    const defaultWeekend = {
        startTime: "09:00",
        endTime: "17:00",
        isWorkingDay: false
    };

    if (!this.schedule) {
        this.schedule = {
            monday: defaultWorkDay,
            tuesday: defaultWorkDay,
            wednesday: defaultWorkDay,
            thursday: defaultWorkDay,
            friday: defaultWorkDay,
            saturday: defaultWeekend,
            sunday: defaultWeekend
        };
    }
    next();
});

module.exports = mongoose.model('User', userSchema);