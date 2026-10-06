const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donationController');
const authenticate = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

router.get('/my', authenticate, donationController.getMyDonations);
router.post('/', authenticate, authorize('ADMIN'), donationController.recordDonation);

module.exports = router;
