const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');
const authMiddleware = require('../middleware/authMiddleware');

// Toate rutele necesită autentificare
router.use(authMiddleware);

// Rute pentru obiective
router.get('/', goalController.getAllGoals);
router.get('/:id', goalController.getGoalById);
router.post('/', goalController.createGoal);
router.put('/:id', goalController.updateGoal);
router.delete('/:id', goalController.deleteGoal);
router.patch('/:id/progress', goalController.updateGoalProgress);

module.exports = router;