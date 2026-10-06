const express = require('express');
const router = express.Router();
const donorController = require('../controllers/donorController');
const authenticate = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

router.get('/', authenticate, donorController.getAllDonors);
router.post('/matches/:matchId/respond', authenticate, donorController.respondToMatch);

module.exports = router;
