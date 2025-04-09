const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const authMiddleware = require('../middleware/authMiddleware');

// Toate rutele necesită autentificare
router.use(authMiddleware);

// Rute pentru calendar
router.get('/', calendarController.getAllEvents);
router.get('/range', calendarController.getEventsByRange);
router.post('/', calendarController.createEvent);
router.put('/:id', calendarController.updateEvent);
router.delete('/:id', calendarController.deleteEvent);
router.post('/sync', calendarController.syncEvents);

module.exports = router;