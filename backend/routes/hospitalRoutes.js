const express = require('express');
const router = express.Router();
const hospitalController = require('../controllers/hospitalController');
const { authenticateUser, requireAdmin, requireHospital, allowPendingHospital } = require('../middleware/auth');
const { requireBodyFields } = require('../middleware/validator');
const { registrationLimiter } = require('../middleware/rateLimiter');

const multer = require('multer');
const environment = require('../config/environment');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: environment.documents?.maxSizeBytes || (5 * 1024 * 1024),
  },
});

/**
 * 4-Step Hospital Registration System Endpoints
 */
router.post('/registration/step-1', registrationLimiter, requireBodyFields(['name', 'registrationNo', 'email', 'phone']), hospitalController.saveStep1);
router.post('/registration/step-2', registrationLimiter, requireBodyFields(['hospitalId', 'address', 'state', 'district', 'city', 'pincode']), hospitalController.saveStep2);
router.post('/registration/upload-document', registrationLimiter, upload.single('file'), hospitalController.uploadRegistrationDocument);
router.delete('/registration/documents/:documentId', hospitalController.deleteRegistrationDocument);
router.get('/registration/documents', hospitalController.getRegistrationDocuments);
router.get('/registration/documents/:documentId/view', hospitalController.getRegistrationDocumentViewUrl);
router.get('/registration/documents/:documentId/signed-url', hospitalController.getRegistrationDocumentViewUrl);
router.get('/registration/documents/:documentId/raw', hospitalController.streamRegistrationDocument);
router.post('/registration/submit', registrationLimiter, requireBodyFields(['hospitalId', 'password', 'confirmPassword']), hospitalController.submitRegistration);
router.get('/registration/status', hospitalController.getRegistrationStatus);
router.post('/registration/resubmit', registrationLimiter, hospitalController.resubmitRegistration);

/**
 * POST /api/hospitals/register (legacy / direct fallback)
 */
router.post('/register', registrationLimiter, hospitalController.registerHospital);

/**
 * GET /api/hospitals
 * Returns directory of approved/verified hospitals for network collaboration
 */
router.get('/', authenticateUser, hospitalController.getApprovedHospitals);

/**
 * GET /api/hospitals/me
 * Returns current authenticated hospital's institutional profile
 */
router.get('/me', authenticateUser, hospitalController.getMyHospital);

/**
 * PUT /api/hospitals/me
 * Updates current authenticated hospital's contact/location details
 */
router.put('/me', authenticateUser, hospitalController.updateMyHospital);

/**
 * GET /api/hospitals/operational-test
 * Gated operational test endpoint
 */
router.get('/operational-test', authenticateUser, requireHospital, hospitalController.getOperationalTest);

/**
 * GET /api/hospitals/pending-test
 * Onboarding test endpoint accessible to pending hospitals
 */
router.get('/pending-test', authenticateUser, allowPendingHospital, hospitalController.getPendingTest);

// Admin-only suspension and reactivation
router.put('/:id/suspend', authenticateUser, requireAdmin, requireBodyFields(['reason']), hospitalController.suspendHospital);
router.put('/:id/reactivate', authenticateUser, requireAdmin, hospitalController.reactivateHospital);

module.exports = router;
