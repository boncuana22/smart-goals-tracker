const express = require('express');
const router = express.Router();
const financialController = require('../controllers/financialController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Toate rutele necesită autentificare
router.use(authMiddleware);

// Rute pentru date financiare
router.get('/', financialController.getAllFinancialData);
router.get('/:id', financialController.getFinancialDataById);
router.post('/upload', upload.single('file'), financialController.uploadFinancialData);
router.delete('/:id', financialController.deleteFinancialData);

module.exports = router;