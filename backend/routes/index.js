const express = require('express');

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const hospitalRoutes = require('./hospitalRoutes');
const adminRoutes = require('./adminRoutes');
const verificationRoutes = require('./verificationRoutes');
const documentRoutes = require('./documentRoutes');
const medicineRoutes = require('./medicineRoutes');
const inventoryRoutes = require('./inventoryRoutes');
const marketplaceRoutes = require('./marketplaceRoutes');
const requestRoutes = require('./requestRoutes');
const alertRoutes = require('./alertRoutes');
const auditRoutes = require('./auditRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/hospitals', hospitalRoutes);
router.use('/admin', adminRoutes);
router.use('/hospital-verification', verificationRoutes);
router.use('/documents', documentRoutes);
router.use('/medicines', medicineRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/marketplace', marketplaceRoutes);
router.use('/requests', requestRoutes);
router.use('/alerts', alertRoutes);
router.use('/audit', auditRoutes);

module.exports = router;
