const express = require('express');
const documentController = require('../controllers/documentController');
const { authenticateUser } = require('../middleware/auth');
const { requireBodyFields } = require('../middleware/validator');

const router = express.Router();

router.use(authenticateUser);

router.post('/upload', requireBodyFields(['documentType', 'documentName']), documentController.uploadDocument);
router.get('/:id/signed-url', documentController.getSignedUrl);

module.exports = router;
