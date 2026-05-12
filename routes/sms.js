const express = require('express');
const router = express.Router();
const smsController = require('../controllers/smsController');

router.post('/send-otp', smsController.sendOtp);
router.post('/verify-otp', smsController.verifyOtp);

module.exports = router;
