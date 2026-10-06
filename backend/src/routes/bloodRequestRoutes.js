const express = require('express');
const router = express.Router();
const bloodRequestController = require('../controllers/bloodRequestController');
const authenticate = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

router.get('/', bloodRequestController.getAllRequests);
router.post('/', authenticate, bloodRequestController.createRequest);
router.get('/:id', authenticate, bloodRequestController.getRequestById);
router.put('/:id/status', authenticate, authorize('ADMIN'), bloodRequestController.updateStatus);

module.exports = router;
