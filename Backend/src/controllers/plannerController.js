const PlannerService = require('../services/plannerService');

class PlannerController {
    async generateSchedule(req, res) {
        try {
            const { startDate, endDate } = req.body;
            const userId = req.user.id; // Assuming you have authentication middleware

            const schedule = await PlannerService.generateSchedule(
                userId,
                new Date(startDate),
                new Date(endDate)
            );

            res.json({ success: true, schedule });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async acceptSuggestedTime(req, res) {
        try {
            const { taskId, scheduleId } = req.params;
            // Implementation to accept a suggested time
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async rejectSuggestedTime(req, res) {
        try {
            const { taskId, scheduleId } = req.params;
            // Implementation to reject a suggested time and request new suggestion
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = new PlannerController(); 