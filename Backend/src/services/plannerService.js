const Task = require('../models/taskModel');
const User = require('../models/userModel');
const LearningService = require('./learningService');
const NotificationService = require('./notificationService');
const CalendarService = require('./calendarService');

class PlannerService {
    async generateSchedule(userId, startDate, endDate) {
        const user = await User.findById(userId);
        const tasks = await Task.find({ 
            userId,
            status: { $ne: 'Completed' }
        });

        // Collect different types of tasks
        const scheduledTasks = tasks.filter(task => task.taskType === 'scheduled');
        const deadlineTasks = tasks.filter(task => task.taskType === 'deadline');
        const flexibleTasks = tasks.filter(task => task.taskType === 'flexible');
        const habitTasks = tasks.filter(task => task.taskType === 'habit');

        // Consider dependencies when planning
        const sortedTasks = this.sortTasksByDependencies(tasks);
        
        // Consider energy levels when assigning times
        const userEnergyPattern = await this.getUserEnergyPattern(userId);
        
        // Get external calendar events
        const externalEvents = await this.getExternalCalendarEvents(userId, startDate, endDate);
        
        // Merge available slots with external calendar
        const availableSlots = this.mergeWithExternalCalendar(
            this.getAvailableTimeSlots(user.schedule, startDate, endDate),
            externalEvents
        );

        // Generate schedule considering all factors
        const schedule = await this.generateOptimalSchedule(
            sortedTasks,
            availableSlots,
            userEnergyPattern
        );

        // Schedule notifications for new tasks
        await this.scheduleNotifications(schedule);

        return schedule;
    }

    getAvailableTimeSlots(userSchedule, startDate, endDate) {
        // Implementation to get available time slots based on user's working hours
    }

    blockScheduledTasks(schedule, scheduledTasks) {
        // Implementation to block out already scheduled tasks
    }

    planDeadlineTasks(schedule, deadlineTasks, availableSlots) {
        // Implementation to schedule deadline tasks
        // Consider:
        // - Task priority
        // - Deadline proximity
        // - Task duration
        // - Available time slots
    }

    planFlexibleTasks(schedule, flexibleTasks, habitTasks, availableSlots) {
        // Implementation to distribute flexible and habit tasks
        // Consider:
        // - Preferred days and times
        // - Even distribution
        // - User's energy levels at different times
    }

    sortTasksByDependencies(tasks) {
        // Implement topological sort for tasks with dependencies
    }

    async getUserEnergyPattern(userId) {
        // Get user's energy patterns from completion history
    }

    async scheduleNotifications(schedule) {
        for (const task of schedule) {
            await NotificationService.scheduleNotifications(task._id);
        }
    }
}

module.exports = new PlannerService(); 