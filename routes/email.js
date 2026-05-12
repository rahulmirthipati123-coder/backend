
const emailController = require('../controllers/emailController');
const express = require('express');

const router = express.Router();

router.post('/send-otp', emailController.sendOtp);
router.post('/verify-otp', emailController.verifyOtp);

module.exports = router;