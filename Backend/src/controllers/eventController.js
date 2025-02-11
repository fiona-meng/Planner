const Event = require('../models/eventModel');

const eventController = {
    async createEvent(req, res) {
        try {
            const event = new Event({
                ...req.body,
                userId: req.user._id
            });
            await event.save();
            res.json({ success: true, event });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    },

    async getEvents(req, res) {
        try {
            const events = await Event.find({ userId: req.user._id });
            res.json({ success: true, events });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    },

    async updateEvent(req, res) {
        try {
            const event = await Event.findOneAndUpdate(
                { _id: req.params.id, userId: req.user._id },
                req.body,
                { new: true }
            );
            res.json({ success: true, event });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    },

    async deleteEvent(req, res) {
        try {
            await Event.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
            res.json({ success: true });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
};

module.exports = eventController; 