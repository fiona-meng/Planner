const Task = require('../models/taskModel');
const User = require('../models/userModel');

class NotificationService {
    async scheduleNotifications(taskId) {
        const task = await Task.findById(taskId);
        const user = await User.findById(task.userId);
        
        // Schedule different types of notifications
        await this.scheduleTaskReminders(task, user);
        await this.scheduleDependencyNotifications(task, user);
        await this.scheduleDeadlineReminders(task, user);
    }

    async scheduleTaskReminders(task, user) {
        // Create reminders based on task type and user preferences
        const notifications = this.generateReminders(task, user.notificationPreferences);
        task.notifications.push(...notifications);
        await task.save();
    }

    async sendNotification(userId, notification) {
        const user = await User.findById(userId);
        
        if (user.notificationPreferences.email.enabled) {
            await this.sendEmailNotification(user.email, notification);
        }
        
        if (user.notificationPreferences.push.enabled) {
            await this.sendPushNotification(user.deviceTokens, notification);
        }
    }
}

module.exports = new NotificationService(); 