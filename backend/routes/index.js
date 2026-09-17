const express = require('express');

// Shared Routes
const authRoutes = require('../shared/routes/authRoutes');
const userRoutes = require('../shared/routes/userRoutes');
const documentRoutes = require('../shared/routes/documentRoutes');
const medicineRoutes = require('../shared/routes/medicineRoutes');
const refundRoutes = require('../shared/routes/refundRoutes');
const paymentRoutes = require('../shared/routes/paymentRoutes');
const alertRoutes = require('../shared/routes/alertRoutes');
const notificationRoutes = require('../shared/routes/notificationRoutes');
const auditRoutes = require('../shared/routes/auditRoutes');
const tradeRoutes = require('../shared/routes/tradeRoutes');
const transferRoutes = require('../shared/routes/transferRoutes');
const feedbackRoutes = require('../shared/routes/feedbackRoutes');
const abdmRoutes = require('../shared/routes/abdmRoutes');

// Hospital Routes
const hospitalRoutes = require('../hospital/routes/hospitalRoutes');
const inventoryRoutes = require('../hospital/routes/inventoryRoutes');
const marketplaceRoutes = require('../hospital/routes/marketplaceRoutes');
const requestRoutes = require('../hospital/routes/requestRoutes');

// Admin Routes
const adminRoutes = require('../admin/routes/adminRoutes');
const verificationRoutes = require('../admin/routes/verificationRoutes');

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
router.use('/refunds', refundRoutes);
router.use('/payments', paymentRoutes);
router.use('/trades', tradeRoutes);
router.use('/transfers', transferRoutes);
router.use('/tracking', transferRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/alerts', alertRoutes);
router.use('/notifications', notificationRoutes);
router.use('/audit', auditRoutes);
router.use('/abdm', abdmRoutes);

module.exports = router;
