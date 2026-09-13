const express = require('express');
const requestController = require('../controllers/requestController');
const { authenticateUser } = require('../middleware/auth');
const { requireBodyFields } = require('../middleware/validator');

const router = express.Router();

router.use(authenticateUser);

router.get('/', requestController.getRequests);
router.post('/', requireBodyFields(['medicineName', 'quantity', 'toHospitalId']), requestController.createRequest);
router.put('/:id/respond', requireBodyFields(['action']), requestController.respondToRequest);
router.post('/:id/cancel', requestController.cancelRequest);

module.exports = router;
