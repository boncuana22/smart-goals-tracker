const express = require('express');
const router = express.Router();
const kpiController = require('../controllers/kpiController');
const authMiddleware = require('../middleware/authMiddleware');

// Toate rutele necesită autentificare
router.use(authMiddleware);

// Rute pentru KPI-uri
router.get('/', kpiController.getAllKPIs);
router.get('/:id', kpiController.getKPIById);
router.post('/', kpiController.createKPI);
router.put('/:id', kpiController.updateKPI);
router.delete('/:id', kpiController.deleteKPI);
router.patch('/:id/value', kpiController.updateKPIValue);

module.exports = router;