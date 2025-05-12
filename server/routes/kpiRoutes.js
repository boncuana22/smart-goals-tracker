const express = require('express');
const router = express.Router();
const kpiController = require('../controllers/kpiController');
const authMiddleware = require('../middleware/authMiddleware');
const { syncFinancialKPIs } = require('../utils/kpiFinancialUtils');

// Toate rutele necesită autentificare
router.use(authMiddleware);

// Rute pentru KPI-uri
router.get('/', kpiController.getAllKPIs);
router.get('/:id', kpiController.getKPIById);
router.post('/', kpiController.createKPI);
router.put('/:id', kpiController.updateKPI);
router.delete('/:id', kpiController.deleteKPI);
router.patch('/:id/value', kpiController.updateKPIValue);

// Route to sync financial KPIs with latest financial data
router.post('/sync-financial', async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await syncFinancialKPIs(userId);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Error in sync financial KPIs route:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while syncing financial KPIs' 
    });
  }
});

module.exports = router;