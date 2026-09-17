const express = require('express');
const router = express.Router();
const multer = require('multer');
const adminRegistrationController = require('../controllers/adminRegistrationController');
const { registrationLimiter } = require('../../shared/middleware/rateLimiter');
const environment = require('../../config/environment');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: environment.documents?.maxSizeBytes || (5 * 1024 * 1024),
  },
});

/**
 * 4-Step Administrator Registration Endpoints
 * All endpoints are public / unauthenticated during registration onboarding
 */
router.get('/config', adminRegistrationController.getConfig);
router.post('/check-username', registrationLimiter, adminRegistrationController.checkUsername);
router.post('/check-email', registrationLimiter, adminRegistrationController.checkEmail);
router.post('/send-otp', registrationLimiter, adminRegistrationController.sendOtp);
router.post('/verify-otp', registrationLimiter, adminRegistrationController.verifyOtp);
router.post('/upload-letter', registrationLimiter, upload.single('file'), adminRegistrationController.uploadAuthorizationLetter);
router.post('/submit', registrationLimiter, adminRegistrationController.submitRegistration);

module.exports = router;
