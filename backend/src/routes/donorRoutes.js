const express = require('express');
const router = express.Router();
const donorController = require('../controllers/donorController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, donorController.getAllDonors);
router.get('/my-matches', verifyToken, donorController.getMyMatches);
router.post('/matches/:matchId/respond', verifyToken, donorController.respondToMatch);

module.exports = router;

