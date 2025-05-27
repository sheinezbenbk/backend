const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const authMiddleware = require('../middleware/authmiddleware');

// Route publique (accessible à tous)
router.get('/', eventController.getEvents);

// Routes protégées (admin uniquement)
router.post('/', authMiddleware.verifyToken, eventController.createEvent);
router.put('/:id', authMiddleware.verifyToken, eventController.updateEvent);
router.delete('/:id', authMiddleware.verifyToken, eventController.deleteEvent);

module.exports = router;