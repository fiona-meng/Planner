const User = require('../models/userModel');
const Task = require('../models/taskModel');

class CalendarService {
    async syncExternalCalendars(userId) {
        const user = await User.findById(userId);
        
        for (const calendar of user.externalCalendars) {
            if (calendar.syncEnabled) {
                await this.syncCalendar(calendar);
            }
        }
    }

    async syncCalendar(calendarConfig) {
        switch (calendarConfig.type) {
            case 'google':
                await this.syncGoogleCalendar(calendarConfig);
                break;
            case 'outlook':
                await this.syncOutlookCalendar(calendarConfig);
                break;
            case 'apple':
                await this.syncAppleCalendar(calendarConfig);
                break;
        }
    }

    async createExternalCalendarEvent(task, calendarConfig) {
        // Create event in external calendar and store the event ID
        const eventId = await this.createEvent(task, calendarConfig);
        task.externalCalendarEventId = eventId;
        await task.save();
    }
}

module.exports = new CalendarService(); 