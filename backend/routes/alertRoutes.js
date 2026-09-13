const express = require('express');
const alertController = require('../controllers/alertController');
const { authenticateUser } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateUser);

router.get('/', alertController.getAlerts);
router.put('/:id/read', alertController.markRead);
router.put('/:id/dismiss', alertController.dismiss);

module.exports = router;
