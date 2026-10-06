const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authenticate = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

router.get('/dashboard', authenticate, authorize('ADMIN'), adminController.getDashboardMetrics);
router.get('/reports', authenticate, authorize('ADMIN'), adminController.getReports);

module.exports = router;
