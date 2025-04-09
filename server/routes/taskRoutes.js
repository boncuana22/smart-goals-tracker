const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/authMiddleware');

// Toate rutele necesită autentificare
router.use(authMiddleware);

// Rute pentru task-uri
router.get('/', taskController.getAllTasks);
router.get('/status/:status', taskController.getTasksByStatus);
router.get('/:id', taskController.getTaskById);
router.post('/', taskController.createTask);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;