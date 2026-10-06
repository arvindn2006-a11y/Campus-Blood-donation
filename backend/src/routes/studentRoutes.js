const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const authenticate = require('../middleware/authMiddleware');

router.get('/profile', authenticate, studentController.getProfile);
router.put('/profile', authenticate, studentController.updateProfile);
router.put('/availability', authenticate, studentController.toggleAvailability);

module.exports = router;
