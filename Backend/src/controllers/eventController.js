const Event = require('../models/eventModel');

const eventController = {
    async createEvent(req, res) {
        try {
            const event = new Event({
                ...req.body,
                userId: req.user._id  // Add the authenticated user's ID to the task
            });

                await event.save();
            res.status(201).json({
                success: true,
                event
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: 'Error creating event',
                error: error.message
            });
        }
    },

    async getEvents(req, res) {
        try {
            // Only get events for the authenticated user
            const events = await Event.find({ userId: req.user._id });
            res.json({
                success: true,
                events
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching events',
                error: error.message
            });
        }
    },

    async deleteEvent(req, res) {
        try {
            await Event.findByIdAndDelete(req.params.id);
            res.json({ success: true, message: 'Event deleted successfully' });
        } catch (error) {
            res.status(400).json({ success: false, message: 'Error deleting event', error: error.message });
        }
    },

    async updateEvent(req, res) {
        try {
            await Event.findByIdAndUpdate(req.params.id, req.body);
            res.json({ success: true, message: 'Event updated successfully' });
        } catch (error) {
            res.status(400).json({ success: false, message: 'Error updating event', error: error.message });
        }
    }

};

module.exports = eventController; 