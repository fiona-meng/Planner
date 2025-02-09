const express = require('express');
const router = express.Router();
const plannerController = require('../controllers/plannerController');
const auth = require('../middleware/auth');

router.post('/generate-schedule', auth, plannerController.generateSchedule);
router.post('/tasks/:taskId/schedule/:scheduleId/accept', auth, plannerController.acceptSuggestedTime);
router.post('/tasks/:taskId/schedule/:scheduleId/reject', auth, plannerController.rejectSuggestedTime);

module.exports = router; 