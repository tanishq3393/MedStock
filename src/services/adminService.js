import { getStoredItem, setStoredItem, KEYS } from './storage.js';
import { ADMIN_ANALYTICS } from './mockData.js';
import { auditService } from './auditService.js';
import { calculateMedicineExpiry } from '../utils/expiryUtils.js';

const assertAdminSession = () => {
  const session = getStoredItem(KEYS.AUTH, null);
  if (session?.user?.role !== 'admin') throw new Error('Admin authorization is required for this action');
};

export const adminService = {
  // ==========================================
  // 1. DASHBOARD & SUPERVISORY ANALYTICS
  // ==========================================
  async getDashboard() {
    await new Promise((r) => setTimeout(r, 200));
    const hospitals = getStoredItem(KEYS.HOSPITALS, []);
    const medicines = getStoredItem(KEYS.MEDICINES, []);
    const requests = getStoredItem(KEYS.REQUESTS, []);
    const payments = getStoredItem(KEYS.PAYMENTS, []);
    const feedbacks = getStoredItem(KEYS.FEEDBACKS, []);
    const auditLogs = getStoredItem(KEYS.AUDIT_TRAIL, []);

    // Medicine stock metrics
    let inStockCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let expiredCount = 0;
    let expiringSoonCount = 0;

    medicines.forEach((med) => {
      const exp = calculateMedicineExpiry(med.expiryDate, med.mfgDate, med.quantity, med.minStockLevel || 20);
      if (exp.isExpired) {
        expiredCount += 1;
      } else if (Number(med.quantity || 0) === 0) {
        outOfStockCount += 1;
      } else if (exp.isLowStock || Number(med.quantity || 0) <= (med.minStockLevel || 20)) {
        lowStockCount += 1;
      } else {
        inStockCount += 1;
      }

      if (exp.isNearExpiry && !exp.isExpired) {
        expiringSoonCount += 1;
      }
    });

    // Orders status counts
    const ordersCounts = {
      pending: requests.filter((r) => r.status === 'pending').length,
      processing: requests.filter((r) => r.status === 'accepted' || r.status === 'processing').length,
      shipped: requests.filter((r) => r.status === 'dispatched' || r.status === 'shipped').length,
      delivered: requests.filter((r) => r.status === 'delivered' || r.status === 'paid').length,
      cancelled: requests.filter((r) => r.status === 'rejected' || r.status === 'cancelled').length,
    };

    const verifiedHospitalsCount = hospitals.filter((h) => h.status === 'verified').length;
    const pendingHospitalsCount = hospitals.filter((h) => h.status === 'pending' || h.status === 'under_review').length;

    // 8 Required Summary Cards
    const summaryCards = {
      totalHospitals: hospitals.length,
      verifiedHospitals: verifiedHospitalsCount,
      pendingVerification: pendingHospitalsCount,
      totalMedicines: medicines.length,
      lowStock: lowStockCount,
      expiringSoon: expiringSoonCount,
      pendingOrders: ordersCounts.pending,
      totalOrders: requests.length,
    };

    // Visual Analytics A: Medicine Stock Overview
    const medicineStockOverview = [
      { name: 'In Stock', value: inStockCount, color: '#0A6E79' },
      { name: 'Low Stock', value: lowStockCount, color: '#F59E0B' },
      { name: 'Out of Stock', value: outOfStockCount, color: '#EF4444' },
      { name: 'Expired', value: expiredCount, color: '#94A3B8' },
    ];

    // Visual Analytics B: Orders Overview
    const ordersOverview = [
      { status: 'Pending', count: ordersCounts.pending, color: '#F59E0B' },
      { status: 'Processing', count: ordersCounts.processing, color: '#06B6D4' },
      { status: 'Shipped', count: ordersCounts.shipped, color: '#3B82F6' },
      { status: 'Delivered', count: ordersCounts.delivered, color: '#10B981' },
      { status: 'Cancelled', count: ordersCounts.cancelled, color: '#EF4444' },
    ];

    // Visual Analytics C: Hospital Registration Trend
    const hospitalRegistrationTrend = [
      { month: 'Apr', count: 4, verified: 3 },
      { month: 'May', count: 6, verified: 5 },
      { month: 'Jun', count: 9, verified: 8 },
      { month: 'Jul', count: 12, verified: 10 },
      { month: 'Aug', count: 18, verified: 15 },
      { month: 'Sep', count: hospitals.length || 24, verified: verifiedHospitalsCount || 20 },
    ];

    // Visual Analytics D: Recent Activity (synthesized from audit trail & events)
    const recentActivity = auditLogs.slice(0, 7).map((log, idx) => ({
      id: log.id || `act-${idx}`,
      type: log.action || 'ACTIVITY',
      title: log.description || log.summary || 'Administrative event logged',
      hospital: log.hospitalName || 'Health Facility',
      time: log.timestamp || new Date(Date.now() - idx * 3600000).toISOString(),
      status: log.status || log.resultingStatus || 'Completed',
    }));

    // Hospital Feedback Summary Card
    const fbTotal = feedbacks.length;
    const fbNew = feedbacks.filter((f) => !f.status || f.status === 'new').length;
    const fbUnderReview = feedbacks.filter((f) => f.status === 'under_review').length;
    const fbResolved = feedbacks.filter((f) => f.status === 'resolved').length;
    const fbAvgRating = fbTotal > 0
      ? (feedbacks.reduce((sum, f) => sum + Number(f.rating || 5), 0) / fbTotal).toFixed(1)
      : '4.8';

    const feedbackSummary = {
      total: fbTotal,
      new: fbNew,
      underReview: fbUnderReview,
      resolved: fbResolved,
      averageRating: fbAvgRating,
    };

    return {
      stats: summaryCards,
      medicineStockOverview,
      ordersOverview,
      hospitalRegistrationTrend,
      recentActivity,
      feedbackSummary,
      transferTrends: ADMIN_ANALYTICS.transferTrends,
      systemPerformance: ADMIN_ANALYTICS.systemPerformance,
      topHotMedicines: ADMIN_ANALYTICS.topHotMedicines,
    };
  },

  // ==========================================
  // 2. HOSPITAL MANAGEMENT & VERIFICATION (ABDM Integration-Ready Architecture)
  // ==========================================
  async getHospitals(filterStatus = null) {
    await new Promise((r) => setTimeout(r, 200));
    const hospitals = getStoredItem(KEYS.HOSPITALS, []);
    if (!filterStatus || filterStatus === 'all') return hospitals;
    return hospitals.filter((h) => h.status === filterStatus);
  },

  async verifyHospital(hospitalId) {
    await new Promise((r) => setTimeout(r, 300));
    assertAdminSession();
    const hospitals = getStoredItem(KEYS.HOSPITALS, []);
    const index = hospitals.findIndex((h) => h.id === hospitalId);
    if (index === -1) throw new Error('Hospital not found');

    const hospital = hospitals[index];
    hospital.status = 'verified';
    hospital.verifiedDate = new Date().toISOString().split('T')[0];
    hospital.rejectionReason = null;
    hospital.isDemoSimulation = true;

    setStoredItem(KEYS.HOSPITALS, hospitals);

    auditService.logEvent({
      action: 'HOSPITAL_APPLICATION_APPROVED',
      entityType: 'Hospitals',
      entityId: hospital.id,
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      adminUser: 'Super Administrator',
      summary: `Hospital application approved for ${hospital.name} (${hospital.registrationNo}). Institutional trading privileges and centralized inventory access activated.`,
      resultingStatus: 'verified',
      metadata: { registrationNo: hospital.registrationNo },
    });

    return hospital;
  },

  async rejectHospital(hospitalId, reason) {
    await new Promise((r) => setTimeout(r, 300));
    assertAdminSession();
    const hospitals = getStoredItem(KEYS.HOSPITALS, []);
    const index = hospitals.findIndex((h) => h.id === hospitalId);
    if (index === -1) throw new Error('Hospital not found');

    const hospital = hospitals[index];
    hospital.status = 'rejected';
    hospital.rejectionReason = reason || 'Statutory documentation incomplete or failed compliance verification.';
    hospital.verifiedDate = null;
    hospital.isDemoSimulation = true;

    setStoredItem(KEYS.HOSPITALS, hospitals);

    auditService.logEvent({
      action: 'HOSPITAL_APPLICATION_REJECTED',
      entityType: 'Hospitals',
      entityId: hospital.id,
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      adminUser: 'Super Administrator',
      summary: `Hospital application rejected for ${hospital.name}. Rejection reason: ${hospital.rejectionReason}`,
      resultingStatus: 'rejected',
      metadata: { reason: hospital.rejectionReason },
    });

    return hospital;
  },

  async setReviewStatus(hospitalId, status, note = '') {
    await new Promise((r) => setTimeout(r, 250));
    assertAdminSession();
    const hospitals = getStoredItem(KEYS.HOSPITALS, []);
    const index = hospitals.findIndex((h) => h.id === hospitalId);
    if (index === -1) throw new Error('Hospital not found');

    const hospital = hospitals[index];
    hospital.status = status; // 'under_review' | 'documents_missing' | etc.
    hospital.reviewNote = note;
    setStoredItem(KEYS.HOSPITALS, hospitals);

    auditService.logEvent({
      action: 'VERIFICATION_STATUS_CHANGED',
      entityType: 'VERIFICATION',
      entityId: hospital.id,
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      summary: `Verification status for ${hospital.name} transitioned to "${status}".`,
      resultingStatus: status,
      metadata: { note },
    });

    return hospital;
  },

  async suspendHospital(hospitalId, reason) {
    await new Promise((r) => setTimeout(r, 300));
    assertAdminSession();
    const trimmedReason = reason?.trim();
    if (!trimmedReason) throw new Error('Suspension reason is required');

    const hospitals = getStoredItem(KEYS.HOSPITALS, []);
    const index = hospitals.findIndex((h) => h.id === hospitalId);
    if (index === -1) throw new Error('Hospital not found');

    const hospital = hospitals[index];
    hospitals[index] = {
      ...hospital,
      status: 'suspended',
      statusBeforeSuspension: hospital.status === 'suspended' ? hospital.statusBeforeSuspension || 'verified' : hospital.status,
      suspensionReason: trimmedReason,
      suspendedAt: new Date().toISOString(),
    };
    setStoredItem(KEYS.HOSPITALS, hospitals);

    auditService.logEvent({
      action: 'HOSPITAL_SUSPENDED',
      entityType: 'VERIFICATION',
      entityId: hospital.id,
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      summary: `Operational suspension placed on ${hospital.name}. Reason: ${trimmedReason}`,
      resultingStatus: 'suspended',
      metadata: { reason: trimmedReason },
    });

    return hospitals[index];
  },

  async reactivateHospital(hospitalId) {
    await new Promise((r) => setTimeout(r, 300));
    assertAdminSession();
    const hospitals = getStoredItem(KEYS.HOSPITALS, []);
    const index = hospitals.findIndex((h) => h.id === hospitalId);
    if (index === -1) throw new Error('Hospital not found');

    const hospital = hospitals[index];
    hospitals[index] = {
      ...hospital,
      status: hospital.statusBeforeSuspension && hospital.statusBeforeSuspension !== 'suspended'
        ? hospital.statusBeforeSuspension
        : 'verified',
      statusBeforeSuspension: null,
      suspensionReason: null,
      suspendedAt: null,
    };
    setStoredItem(KEYS.HOSPITALS, hospitals);

    auditService.logEvent({
      action: 'HOSPITAL_REACTIVATED',
      entityType: 'VERIFICATION',
      entityId: hospital.id,
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      summary: `Hospital ${hospital.name} reactivated with trading privileges restored.`,
      resultingStatus: hospitals[index].status,
      metadata: {},
    });

    return hospitals[index];
  },

  async verifyHospitalDocument(hospitalId, documentId) {
    await new Promise((r) => setTimeout(r, 200));
    assertAdminSession();
    const hospitals = getStoredItem(KEYS.HOSPITALS, []);
    const hospIndex = hospitals.findIndex((h) => h.id === hospitalId);
    if (hospIndex === -1) throw new Error('Hospital not found');

    const hospital = hospitals[hospIndex];
    const docs = hospital.documents || [];
    const docIndex = docs.findIndex((d) => d.id === documentId || d.name === documentId || d.documentName === documentId);
    if (docIndex === -1) throw new Error('Document not found');

    docs[docIndex] = {
      ...docs[docIndex],
      documentStatus: 'verified',
      verified: true,
      reviewedAt: new Date().toISOString().split('T')[0],
      rejectionReason: null,
    };

    hospital.documents = docs;
    hospitals[hospIndex] = hospital;
    setStoredItem(KEYS.HOSPITALS, hospitals);

    return { hospital, document: docs[docIndex] };
  },

  async rejectHospitalDocument(hospitalId, documentId, reason) {
    await new Promise((r) => setTimeout(r, 200));
    assertAdminSession();
    const trimmedReason = reason?.trim();
    if (!trimmedReason) throw new Error('Rejection reason is required');

    const hospitals = getStoredItem(KEYS.HOSPITALS, []);
    const hospIndex = hospitals.findIndex((h) => h.id === hospitalId);
    if (hospIndex === -1) throw new Error('Hospital not found');

    const hospital = hospitals[hospIndex];
    const docs = hospital.documents || [];
    const docIndex = docs.findIndex((d) => d.id === documentId || d.name === documentId || d.documentName === documentId);
    if (docIndex === -1) throw new Error('Document not found');

    docs[docIndex] = {
      ...docs[docIndex],
      documentStatus: 'rejected',
      verified: false,
      reviewedAt: new Date().toISOString().split('T')[0],
      rejectionReason: trimmedReason,
    };

    hospital.documents = docs;
    hospitals[hospIndex] = hospital;
    setStoredItem(KEYS.HOSPITALS, hospitals);

    return { hospital, document: docs[docIndex] };
  },

  async getHospitalDetails(hospitalId) {
    await new Promise((r) => setTimeout(r, 150));
    const hospitals = getStoredItem(KEYS.HOSPITALS, []);
    return hospitals.find((h) => h.id === hospitalId) || hospitals[0] || null;
  },

  async updateHospitalDetails(hospitalId, updateData) {
    await new Promise((r) => setTimeout(r, 250));
    assertAdminSession();
    const hospitals = getStoredItem(KEYS.HOSPITALS, []);
    const index = hospitals.findIndex((h) => h.id === hospitalId);
    if (index === -1) throw new Error('Hospital not found');

    hospitals[index] = {
      ...hospitals[index],
      ...updateData,
    };
    setStoredItem(KEYS.HOSPITALS, hospitals);
    return hospitals[index];
  },

  // ==========================================
  // 3. MASTER MEDICINES CATALOGUE OVERSIGHT
  // ==========================================
  async getMedicineData() {
    await new Promise((r) => setTimeout(r, 150));
    return getStoredItem(KEYS.MASTER_MEDICINES, []);
  },

  async addMedicineToHospital(medicineData) {
    // Admin creates medicine in the Master Catalogue ONLY
    await new Promise((r) => setTimeout(r, 200));
    assertAdminSession();

    if (!medicineData.medicineName && !medicineData.brandName) {
      throw new Error('Medicine name is required for master catalogue registration');
    }

    const masterMeds = getStoredItem(KEYS.MASTER_MEDICINES, []);
    const name = (medicineData.medicineName || medicineData.brandName).trim();
    const generic = (medicineData.genericName || '').trim();
    const form = medicineData.dosageForm || medicineData.form || 'Tablet';
    const strength = medicineData.strength || medicineData.power || '';

    // Generate standard medicine code if not specified
    let code = medicineData.medicineCode;
    if (!code) {
      const prefix = name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() || 'MED';
      const strengthNum = strength.replace(/[^0-9]/g, '') || '100';
      code = `MED-${prefix}-${strengthNum}`;
    }

    const newMasterMed = {
      id: 'master-med-' + Date.now(),
      medicineCode: code,
      medicineName: name,
      brandName: name,
      genericName: generic,
      category: medicineData.category || 'General Therapeutics',
      dosageForm: form,
      form: form,
      strength: strength,
      power: strength,
      unit: medicineData.unit || 'mg',
      manufacturer: medicineData.manufacturer || 'Approved Pharmaceutical Lab',
      storageType: medicineData.storageType || 'Room Temperature (15°C - 25°C)',
      description: medicineData.description || 'Registered pharmaceutical formulation in MEDEX central master formulary.',
      status: 'active',
      dateAdded: new Date().toISOString().split('T')[0],
    };

    masterMeds.unshift(newMasterMed);
    setStoredItem(KEYS.MASTER_MEDICINES, masterMeds);

    auditService.logEvent({
      action: 'MASTER_MEDICINE_ADDED',
      entityType: 'MEDICINE',
      entityId: newMasterMed.id,
      actorRole: 'admin',
      summary: `Registered new medicine "${newMasterMed.medicineName}" (${newMasterMed.medicineCode}) in central master catalogue.`,
      resultingStatus: 'active',
      metadata: { code: newMasterMed.medicineCode, category: newMasterMed.category, manufacturer: newMasterMed.manufacturer },
    });

    return newMasterMed;
  },

  async updateMedicineData(id, updatedData) {
    await new Promise((r) => setTimeout(r, 200));
    assertAdminSession();
    const masterMeds = getStoredItem(KEYS.MASTER_MEDICINES, []);
    const index = masterMeds.findIndex((m) => m.id === id);
    if (index === -1) throw new Error('Master medicine record not found');

    const name = updatedData.medicineName || updatedData.brandName || masterMeds[index].medicineName;
    const form = updatedData.dosageForm || updatedData.form || masterMeds[index].dosageForm;
    const strength = updatedData.strength || updatedData.power || masterMeds[index].strength;

    masterMeds[index] = {
      ...masterMeds[index],
      ...updatedData,
      medicineName: name,
      brandName: name,
      genericName: updatedData.genericName ?? masterMeds[index].genericName,
      category: updatedData.category ?? masterMeds[index].category,
      dosageForm: form,
      form: form,
      strength: strength,
      power: strength,
      unit: updatedData.unit ?? masterMeds[index].unit,
      manufacturer: updatedData.manufacturer ?? masterMeds[index].manufacturer,
      storageType: updatedData.storageType ?? masterMeds[index].storageType,
      medicineCode: updatedData.medicineCode ?? masterMeds[index].medicineCode,
      description: updatedData.description ?? masterMeds[index].description,
    };

    setStoredItem(KEYS.MASTER_MEDICINES, masterMeds);

    auditService.logEvent({
      action: 'MASTER_MEDICINE_UPDATED',
      entityType: 'MEDICINE',
      entityId: id,
      actorRole: 'admin',
      summary: `Updated master formulary entry for "${masterMeds[index].medicineName}".`,
      resultingStatus: 'active',
      metadata: { code: masterMeds[index].medicineCode },
    });

    return masterMeds[index];
  },

  async deleteMedicineData(id) {
    await new Promise((r) => setTimeout(r, 200));
    assertAdminSession();
    const masterMeds = getStoredItem(KEYS.MASTER_MEDICINES, []);
    const target = masterMeds.find((m) => m.id === id);
    const filtered = masterMeds.filter((m) => m.id !== id);
    setStoredItem(KEYS.MASTER_MEDICINES, filtered);

    if (target) {
      auditService.logEvent({
        action: 'MASTER_MEDICINE_DELETED',
        entityType: 'MEDICINE',
        entityId: id,
        actorRole: 'admin',
        summary: `Removed "${target.medicineName}" (${target.medicineCode}) from central master catalogue.`,
        resultingStatus: 'deleted',
      });
    }

    return true;
  },

  // ==========================================
  // 4. TRANSFERS & BIO-WASTE OVERSIGHT
  // ==========================================
  async getTransfers() {
    await new Promise((r) => setTimeout(r, 150));
    return getStoredItem(KEYS.TRACKING, []);
  },

  async updateTransferStatus(transactionId, newStatus) {
    await new Promise((r) => setTimeout(r, 250));
    assertAdminSession();
    const trackingList = getStoredItem(KEYS.TRACKING, []);
    const index = trackingList.findIndex((t) => t.transactionId === transactionId);
    if (index === -1) throw new Error('Transfer record not found');

    trackingList[index].status = newStatus;
    if (trackingList[index].timeline) {
      const match = trackingList[index].timeline.find((t) => t.step.toLowerCase().includes(newStatus.toLowerCase()));
      if (match) match.completed = true;
    }

    setStoredItem(KEYS.TRACKING, trackingList);

    auditService.logEvent({
      action: 'SHIPMENT_STATUS_UPDATED',
      entityType: 'TRANSFER',
      entityId: trackingList[index].trackingNumber || transactionId,
      hospitalId: trackingList[index].senderHospitalId || 'hosp-admin',
      hospitalName: trackingList[index].senderHospital,
      summary: `Transfer status updated to "${newStatus}" for consignment ${trackingList[index].trackingNumber || transactionId}.`,
      resultingStatus: newStatus,
      metadata: { transactionId, status: newStatus },
    });

    return trackingList[index];
  },

  async getDisposals() {
    await new Promise((r) => setTimeout(r, 150));
    return getStoredItem(KEYS.DISPOSALS, []);
  },

  async updateDisposalStatus(id, newStatus, certificateNo = null) {
    await new Promise((r) => setTimeout(r, 250));
    assertAdminSession();
    const disposals = getStoredItem(KEYS.DISPOSALS, []);
    const index = disposals.findIndex((d) => d.id === id);
    if (index === -1) throw new Error('Disposal record not found');

    disposals[index].status = newStatus;
    if (certificateNo) {
      disposals[index].certificateNo = certificateNo;
      disposals[index].certificateDate = new Date().toISOString().split('T')[0];
    }
    if (newStatus === 'Incinerated & Certified' && !disposals[index].certificateNo) {
      disposals[index].certificateNo = 'BMW-INC-2024-' + Math.floor(10000 + Math.random() * 90000);
      disposals[index].certificateDate = new Date().toISOString().split('T')[0];
    }

    setStoredItem(KEYS.DISPOSALS, disposals);

    auditService.logEvent({
      action: 'WASTE_STATUS_UPDATED',
      entityType: 'WASTE',
      entityId: disposals[index].id,
      hospitalId: disposals[index].hospitalId,
      hospitalName: disposals[index].hospitalName,
      summary: `Bio-waste disposal status updated to "${newStatus}" for ${disposals[index].medicineName}.`,
      resultingStatus: newStatus,
      metadata: { certificateNo: disposals[index].certificateNo },
    });

    return disposals[index];
  },

  // ==========================================
  // 5. ADMIN FEEDBACK MODERATION
  // ==========================================
  async getFeedback(ratingFilter = null) {
    await new Promise((r) => setTimeout(r, 150));
    const feedbacks = getStoredItem(KEYS.FEEDBACKS, []);
    if (!ratingFilter || ratingFilter === 'all') return feedbacks;
    return feedbacks.filter((f) => f.rating === Number(ratingFilter));
  },

  async replyFeedback(id, replyText) {
    await new Promise((r) => setTimeout(r, 250));
    assertAdminSession();
    const feedbacks = getStoredItem(KEYS.FEEDBACKS, []);
    const index = feedbacks.findIndex((f) => f.id === id);
    if (index === -1) throw new Error('Feedback not found');

    feedbacks[index].adminReply = replyText;
    feedbacks[index].repliedDate = new Date().toISOString().split('T')[0];
    if (feedbacks[index].status === 'new') {
      feedbacks[index].status = 'under_review';
    }

    setStoredItem(KEYS.FEEDBACKS, feedbacks);

    auditService.logEvent({
      action: 'FEEDBACK_REPLIED',
      entityType: 'Feedback',
      entityId: id,
      hospitalId: feedbacks[index].hospitalId,
      hospitalName: feedbacks[index].hospitalName,
      summary: `Admin replied to hospital feedback from ${feedbacks[index].hospitalName}`,
      resultingStatus: feedbacks[index].status,
    });

    return feedbacks[index];
  },

  async updateFeedbackStatus(id, newStatus) {
    await new Promise((r) => setTimeout(r, 200));
    assertAdminSession();
    const feedbacks = getStoredItem(KEYS.FEEDBACKS, []);
    const index = feedbacks.findIndex((f) => f.id === id);
    if (index === -1) throw new Error('Feedback record not found');

    feedbacks[index].status = newStatus;
    setStoredItem(KEYS.FEEDBACKS, feedbacks);

    auditService.logEvent({
      action: newStatus === 'resolved' ? 'FEEDBACK_RESOLVED' : 'FEEDBACK_STATUS_UPDATED',
      entityType: 'Feedback',
      entityId: id,
      hospitalId: feedbacks[index].hospitalId,
      hospitalName: feedbacks[index].hospitalName,
      summary: `Admin updated feedback from ${feedbacks[index].hospitalName} to "${newStatus}"`,
      resultingStatus: newStatus,
    });

    return feedbacks[index];
  },

  // ==========================================
  // 6. CENTRAL INVENTORY OVERSIGHT
  // ==========================================
  async getInventory(statusFilter = 'all', searchTerm = '', hospitalFilter = 'all', categoryFilter = 'all', expiryFilter = 'all') {
    await new Promise((r) => setTimeout(r, 150));
    const medicines = getStoredItem(KEYS.MEDICINES, []);
    const hospitals = getStoredItem(KEYS.HOSPITALS, []);
    const requests = getStoredItem(KEYS.REQUESTS, []);

    // Active reservations: requests with status in ['pending', 'accepted', 'processing']
    const reservedMap = {};
    requests.forEach((req) => {
      if (['pending', 'accepted', 'processing'].includes(req.status)) {
        reservedMap[req.medicineId] = (reservedMap[req.medicineId] || 0) + Number(req.quantity || 0);
      }
    });

    let totalUnits = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let expiredUnits = 0;
    let expiringSoonCount = 0;
    const uniqueMedicinesSet = new Set();

    const items = medicines.map((med) => {
      const hosp = hospitals.find((h) => h.id === med.hospitalId) || { name: med.hospitalName || 'Health Facility', city: 'District' };
      const exp = calculateMedicineExpiry(med.expiryDate, med.mfgDate, med.quantity, med.minStockLevel || 20);
      const qty = Number(med.quantity || 0);
      const reserved = reservedMap[med.id] || 0;
      const available = Math.max(0, qty - reserved);

      const medName = med.brandName || med.medicineName || 'Pharmaceutical';
      uniqueMedicinesSet.add(medName.trim().toLowerCase());

      let computedStatus = 'in_stock';
      if (exp.isExpired) {
        computedStatus = 'expired';
        expiredUnits += 1;
      } else if (available === 0 || qty === 0) {
        computedStatus = 'out_of_stock';
        outOfStockCount += 1;
      } else if (available <= (med.minStockLevel || 20) || exp.isLowStock) {
        computedStatus = 'low_stock';
        lowStockCount += 1;
      } else {
        computedStatus = 'in_stock';
      }

      if (exp.isNearExpiry && !exp.isExpired) {
        expiringSoonCount += 1;
      }

      totalUnits += qty;

      return {
        id: med.id,
        medicine: medName,
        medicineName: medName,
        medicineId: med.medicineId || med.id,
        masterMedicineId: med.masterMedicineId || med.medicineId,
        genericName: med.genericName || 'Active Pharmaceutical Ingredient',
        category: med.category || 'Essential Medicines',
        dosageForm: med.dosageForm || med.form || 'Tablet',
        form: med.form || med.dosageForm || 'Tablet',
        strength: med.strength || med.power || '',
        power: med.power || med.strength || '',
        manufacturer: med.manufacturer || 'Authorized Manufacturer',
        hospital: hosp.name,
        hospitalName: hosp.name,
        hospitalId: med.hospitalId,
        hospitalCity: hosp.city || 'Metro',
        hospitalState: hosp.state || 'India',
        availableStock: available,
        availableQuantity: available,
        totalStock: qty,
        quantity: qty,
        reservedStock: reserved,
        reservedQuantity: reserved,
        expiredStock: exp.isExpired ? qty : 0,
        minimumStock: med.minStockLevel || 20,
        minStockLevel: med.minStockLevel || 20,
        mfgDate: med.mfgDate || '2024-01-01',
        expiryDate: med.expiryDate,
        daysUntilExpiry: exp.daysUntilExpiry,
        isExpired: exp.isExpired,
        isNearExpiry: exp.isNearExpiry,
        status: computedStatus,
        stockStatus: computedStatus,
        lastUpdated: med.lastUpdated || med.dateAdded || '2024-09-01',
        batchNumber: med.batchNo || 'BATCH-2024',
        batchNo: med.batchNo || 'BATCH-2024',
        unitOriginalPrice: med.unitOriginalPrice || 50,
        notes: med.notes || '',
        storageType: med.storageType || 'Room Temperature (15°C - 25°C)',
      };
    });

    // Summary counts calculated from real centralized inventory
    const summary = {
      totalMedicines: uniqueMedicinesSet.size || medicines.length,
      totalUnits,
      totalStockUnits: totalUnits,
      lowStock: lowStockCount,
      outOfStock: outOfStockCount,
      expiringSoon: expiringSoonCount,
      expired: expiredUnits,
      totalStock: totalUnits,
      lowStockCount,
      outOfStockCount,
      expiredCount: expiredUnits,
    };

    // Filter items
    const filtered = items.filter((item) => {
      const matchSearch =
        !searchTerm ||
        item.medicine.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.hospital.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.hospitalId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.batchNumber?.toLowerCase().includes(searchTerm.toLowerCase());

      let matchStatus = true;
      if (statusFilter && statusFilter !== 'all') {
        const normFilter = statusFilter.toLowerCase().replace(/[\s_-]+/g, '');
        if (normFilter === 'expiringsoon') {
          matchStatus = item.isNearExpiry && !item.isExpired;
        } else {
          const normItemStatus = (item.status || '').toLowerCase().replace(/[\s_-]+/g, '');
          matchStatus = normItemStatus === normFilter;
        }
      }

      let matchExpiry = true;
      if (expiryFilter && expiryFilter !== 'all') {
        const normExp = expiryFilter.toLowerCase().replace(/[\s_-]+/g, '');
        if (normExp === 'good') {
          matchExpiry = !item.isExpired && (item.daysUntilExpiry === undefined || item.daysUntilExpiry > 90);
        } else if (normExp === 'expiringsoon' || normExp === 'within90') {
          matchExpiry = !item.isExpired && item.daysUntilExpiry !== undefined && item.daysUntilExpiry <= 90;
        } else if (normExp === 'within60') {
          matchExpiry = !item.isExpired && item.daysUntilExpiry !== undefined && item.daysUntilExpiry <= 60;
        } else if (normExp === 'within30') {
          matchExpiry = !item.isExpired && item.daysUntilExpiry !== undefined && item.daysUntilExpiry <= 30;
        } else if (normExp === 'expired') {
          matchExpiry = item.isExpired;
        }
      }

      const matchHosp =
        !hospitalFilter ||
        hospitalFilter === 'all' ||
        item.hospitalId === hospitalFilter;

      const matchCategory =
        !categoryFilter ||
        categoryFilter === 'all' ||
        item.category.toLowerCase() === categoryFilter.toLowerCase();

      return matchSearch && matchStatus && matchExpiry && matchHosp && matchCategory;
    });

    return {
      items: filtered,
      summary,
    };
  },

  async adminAddStock({
    hospitalId,
    masterMedicineId,
    medicineName,
    genericName,
    category,
    dosageForm,
    form,
    strength,
    power,
    manufacturer,
    batchNo,
    quantity,
    mfgDate,
    expiryDate,
    minStockLevel,
    notes,
    unitOriginalPrice
  }) {
    await new Promise((r) => setTimeout(r, 200));
    assertAdminSession();
    if (!hospitalId) throw new Error('Hospital must be selected');
    if (!medicineName?.trim()) throw new Error('Medicine name must be specified');
    if (!batchNo?.trim()) throw new Error('Batch number is required');
    const addQty = Number(quantity);
    if (isNaN(addQty) || addQty <= 0) throw new Error('Quantity must be greater than 0');
    if (!expiryDate) throw new Error('Expiry date is required');

    const medicines = getStoredItem(KEYS.MEDICINES, []);
    const hospitals = getStoredItem(KEYS.HOSPITALS, []);
    const hosp = hospitals.find((h) => h.id === hospitalId) || { name: 'Hospital Facility', city: 'District' };

    const normBatch = batchNo.trim().toLowerCase();
    const normName = medicineName.trim().toLowerCase();

    // Section 6 Duplicate Medicine/Batch Logic:
    // Hospital + Medicine + Batch
    const existingIndex = medicines.findIndex((m) => {
      if (m.hospitalId !== hospitalId) return false;
      const matchBatch = (m.batchNo || '').trim().toLowerCase() === normBatch;
      const matchName = (m.brandName || m.medicineName || '').trim().toLowerCase() === normName ||
        (masterMedicineId && (m.masterMedicineId === masterMedicineId || m.medicineId === masterMedicineId));
      return matchBatch && matchName;
    });

    let resultItem;
    let isNewRecord = false;
    let prevQuantity = 0;

    if (existingIndex !== -1) {
      // Merge into existing batch (do NOT create duplicate row)
      prevQuantity = Number(medicines[existingIndex].quantity || 0);
      medicines[existingIndex].quantity = prevQuantity + addQty;
      medicines[existingIndex].lastUpdated = new Date().toISOString().split('T')[0];
      if (mfgDate) medicines[existingIndex].mfgDate = mfgDate;
      if (expiryDate) medicines[existingIndex].expiryDate = expiryDate;
      if (minStockLevel) medicines[existingIndex].minStockLevel = Number(minStockLevel);
      resultItem = medicines[existingIndex];
    } else {
      // Create separate batch record
      isNewRecord = true;
      resultItem = {
        id: 'med-' + Date.now(),
        masterMedicineId: masterMedicineId || undefined,
        medicineId: masterMedicineId || ('med-' + Date.now()),
        brandName: medicineName.trim(),
        medicineName: medicineName.trim(),
        genericName: genericName?.trim() || 'Active Formulation',
        category: category || 'Essential Medicines',
        form: dosageForm || form || 'Tablet',
        power: strength || power || 'Standard',
        manufacturer: manufacturer || 'Authorized Manufacturer',
        batchNo: batchNo.trim(),
        quantity: addQty,
        minStockLevel: Number(minStockLevel) || 20,
        mfgDate: mfgDate || new Date().toISOString().split('T')[0],
        expiryDate: expiryDate,
        unitOriginalPrice: Number(unitOriginalPrice) || 50,
        hospitalId,
        hospitalName: hosp.name,
        location: `${hosp.city || 'District'}, ${hosp.state || 'India'}`,
        dateAdded: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString().split('T')[0],
        notes: notes || 'Admin override stock addition',
        addedBy: 'Admin (Override)',
      };
      medicines.unshift(resultItem);
    }

    setStoredItem(KEYS.MEDICINES, medicines);

    // Record in Stock History (Section 12)
    const stockHistory = getStoredItem(KEYS.STOCK_HISTORY, []);
    stockHistory.unshift({
      id: 'sh-admin-' + Date.now(),
      medicineId: resultItem.id,
      medicineName: resultItem.brandName || resultItem.medicineName,
      batchNo: resultItem.batchNo,
      hospitalId,
      hospitalName: hosp.name,
      action: 'Stock Added',
      actionType: 'Intake',
      quantityDelta: addQty,
      previousStock: prevQuantity,
      resultingStock: resultItem.quantity,
      performedBy: 'Admin',
      reason: notes || 'Admin override authorized batch addition',
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
    });
    setStoredItem(KEYS.STOCK_HISTORY, stockHistory);

    // Audit Trail
    auditService.logEvent({
      action: 'ADMIN_STOCK_ADDED',
      entityType: 'Inventory',
      entityId: resultItem.id,
      hospitalId,
      hospitalName: hosp.name,
      adminUser: 'Super Administrator',
      summary: `Admin added ${addQty} units of ${resultItem.brandName} (Batch: ${resultItem.batchNo}) to ${hosp.name}. Total balance: ${resultItem.quantity} units.`,
      resultingStatus: 'Completed',
      metadata: {
        isNewRecord,
        quantityDelta: addQty,
        resultingQuantity: resultItem.quantity,
        batchNo: resultItem.batchNo,
      }
    });

    return resultItem;
  },

  async adjustStock({ medicineId, quantityDelta, type = 'Intake', reason = 'Inventory adjustment' }) {
    await new Promise((r) => setTimeout(r, 200));
    assertAdminSession();
    const medicines = getStoredItem(KEYS.MEDICINES, []);
    const index = medicines.findIndex((m) => m.id === medicineId);
    if (index === -1) throw new Error('Medicine not found in inventory');

    const med = medicines[index];
    const prevStock = Number(med.quantity || 0);
    const newStock = Math.max(0, prevStock + Number(quantityDelta));
    med.quantity = newStock;
    med.lastUpdated = new Date().toISOString().split('T')[0];
    setStoredItem(KEYS.MEDICINES, medicines);

    // Record stock movement history
    const stockHistory = getStoredItem(KEYS.STOCK_HISTORY, []);
    stockHistory.unshift({
      id: 'sh-' + Date.now(),
      medicineId,
      medicineName: med.brandName || med.medicineName,
      batchNo: med.batchNo,
      hospitalId: med.hospitalId,
      hospitalName: med.hospitalName,
      action: Number(quantityDelta) >= 0 ? 'Stock Added' : 'Stock Adjustment',
      actionType: type,
      quantityDelta: Number(quantityDelta),
      previousStock: prevStock,
      resultingStock: newStock,
      performedBy: 'Admin',
      reason,
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      adminUser: 'Super Administrator',
    });
    setStoredItem(KEYS.STOCK_HISTORY, stockHistory);

    auditService.logEvent({
      action: 'STOCK_ADJUSTED',
      entityType: 'Inventory',
      entityId: medicineId,
      hospitalId: med.hospitalId,
      hospitalName: med.hospitalName,
      summary: `Admin adjusted stock for ${med.brandName} (${quantityDelta > 0 ? '+' : ''}${quantityDelta} units). Reason: ${reason}`,
      resultingStatus: 'Completed',
    });

    return med;
  },

  async transferStock({ medicineId, sourceHospitalId, targetHospitalId, quantity, note }) {
    await new Promise((r) => setTimeout(r, 250));
    assertAdminSession();
    const medicines = getStoredItem(KEYS.MEDICINES, []);
    const hospitals = getStoredItem(KEYS.HOSPITALS, []);

    const sourceMedIndex = medicines.findIndex((m) => m.id === medicineId);
    if (sourceMedIndex === -1) throw new Error('Source inventory record not found');
    const sourceMed = medicines[sourceMedIndex];

    const transferQty = Number(quantity);
    if (isNaN(transferQty) || transferQty <= 0) throw new Error('Transfer quantity must be greater than 0');
    
    const currentQty = Number(sourceMed.quantity || 0);
    if (currentQty <= 0) {
      throw new Error('Cannot transfer out-of-stock inventory (Current balance: 0 units)');
    }
    if (currentQty < transferQty) {
      throw new Error(`Insufficient stock. Available to transfer: ${currentQty} units`);
    }

    // Block transfer of expired stock (Section 21)
    const exp = calculateMedicineExpiry(sourceMed.expiryDate, sourceMed.mfgDate, currentQty, sourceMed.minStockLevel || 20);
    if (exp.isExpired) {
      throw new Error('Expired medicines cannot be transferred for redistribution under patient safety protocols.');
    }

    const sourceHosp = hospitals.find((h) => h.id === (sourceHospitalId || sourceMed.hospitalId)) || { name: sourceMed.hospitalName, id: sourceMed.hospitalId };
    const targetHosp = hospitals.find((h) => h.id === targetHospitalId);
    if (!targetHosp) throw new Error('Target destination hospital not found');
    if (targetHosp.id === sourceHosp.id) throw new Error('Destination hospital must be different from source hospital');

    // Deduct from source hospital
    sourceMed.quantity = currentQty - transferQty;
    sourceMed.lastUpdated = new Date().toISOString().split('T')[0];

    // Target hospital duplicate rule: Hospital + Medicine + Batch (Section 11)
    const normBatch = (sourceMed.batchNo || '').trim().toLowerCase();
    const normName = (sourceMed.brandName || sourceMed.medicineName || '').trim().toLowerCase();

    let targetMedIndex = medicines.findIndex((m) => {
      if (m.hospitalId !== targetHospitalId) return false;
      const matchBatch = (m.batchNo || '').trim().toLowerCase() === normBatch;
      const matchName = (m.brandName || m.medicineName || '').trim().toLowerCase() === normName ||
        (sourceMed.masterMedicineId && (m.masterMedicineId === sourceMed.masterMedicineId || m.medicineId === sourceMed.masterMedicineId));
      return matchBatch && matchName;
    });

    let targetMed;
    if (targetMedIndex !== -1) {
      // Increase existing batch quantity in target hospital
      targetMed = medicines[targetMedIndex];
      targetMed.quantity = Number(targetMed.quantity || 0) + transferQty;
      targetMed.lastUpdated = new Date().toISOString().split('T')[0];
    } else {
      // Create new inventory record in target hospital keeping same batch, mfg, and expiry
      targetMed = {
        ...sourceMed,
        id: 'med-' + Date.now() + '-xfr',
        hospitalId: targetHospitalId,
        hospitalName: targetHosp.name,
        location: `${targetHosp.city || ''}, ${targetHosp.state || 'India'}`,
        quantity: transferQty,
        batchNo: sourceMed.batchNo,
        mfgDate: sourceMed.mfgDate,
        expiryDate: sourceMed.expiryDate,
        dateAdded: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString().split('T')[0],
      };
      medicines.unshift(targetMed);
    }

    setStoredItem(KEYS.MEDICINES, medicines);

    // Create tracking consignment
    const txnId = 'TXN-XFR-' + Date.now().toString().slice(-6);
    const trackingList = getStoredItem(KEYS.TRACKING, []);
    trackingList.unshift({
      transactionId: txnId,
      trackingNumber: 'MED-TRK-' + Math.floor(100000 + Math.random() * 900000),
      medicineName: sourceMed.brandName || sourceMed.medicineName,
      batchNo: sourceMed.batchNo,
      quantity: transferQty,
      senderHospital: sourceHosp.name,
      senderHospitalId: sourceHosp.id,
      receiverHospital: targetHosp.name,
      receiverHospitalId: targetHosp.id,
      status: 'In Transit',
      temperature: '4.2°C',
      timeline: [
        { step: 'Transfer Authorized', timestamp: new Date().toISOString(), completed: true },
        { step: 'Cold-Chain Dispatch', timestamp: new Date().toISOString(), completed: true },
        { step: 'In Transit', timestamp: new Date().toISOString(), completed: true },
        { step: 'Delivered', timestamp: null, completed: false },
      ]
    });
    setStoredItem(KEYS.TRACKING, trackingList);

    // Log to Stock History for BOTH source and target (Section 12)
    const stockHistory = getStoredItem(KEYS.STOCK_HISTORY, []);
    
    // Source deduction
    stockHistory.unshift({
      id: 'sh-xfr-src-' + Date.now(),
      medicineId: sourceMed.id,
      medicineName: sourceMed.brandName || sourceMed.medicineName,
      batchNo: sourceMed.batchNo,
      hospitalId: sourceHosp.id,
      hospitalName: sourceHosp.name,
      partnerHospitalId: targetHosp.id,
      partnerHospitalName: targetHosp.name,
      action: 'Stock Transferred',
      actionType: 'Transfer',
      quantityDelta: -transferQty,
      previousStock: currentQty,
      resultingStock: sourceMed.quantity,
      performedBy: 'Admin',
      reason: `Transferred ${transferQty} units to ${targetHosp.name}. Note: ${note || 'Admin quota redistribution'}`,
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
    });

    // Destination addition
    stockHistory.unshift({
      id: 'sh-xfr-dest-' + Date.now(),
      medicineId: targetMed.id,
      medicineName: sourceMed.brandName || sourceMed.medicineName,
      batchNo: sourceMed.batchNo,
      hospitalId: targetHosp.id,
      hospitalName: targetHosp.name,
      partnerHospitalId: sourceHosp.id,
      partnerHospitalName: sourceHosp.name,
      action: 'Stock Received',
      actionType: 'Received',
      quantityDelta: transferQty,
      resultingStock: targetMed.quantity,
      performedBy: 'Admin',
      reason: `Received ${transferQty} units transferred from ${sourceHosp.name}. Note: ${note || 'Admin quota redistribution'}`,
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
    });

    setStoredItem(KEYS.STOCK_HISTORY, stockHistory);

    // Audit Trail
    auditService.logEvent({
      action: 'STOCK_TRANSFERRED',
      entityType: 'Inventory',
      entityId: txnId,
      hospitalId: sourceHosp.id,
      hospitalName: sourceHosp.name,
      partnerHospitalId: targetHosp.id,
      partnerHospitalName: targetHosp.name,
      adminUser: 'Super Administrator',
      summary: `Admin transferred ${transferQty} units of ${sourceMed.brandName} (Batch: ${sourceMed.batchNo}) from ${sourceHosp.name} to ${targetHosp.name}.`,
      resultingStatus: 'In Transit',
      metadata: {
        sourceHospital: sourceHosp.name,
        destinationHospital: targetHosp.name,
        medicine: sourceMed.brandName,
        batchNo: sourceMed.batchNo,
        quantity: transferQty,
      }
    });

    return { success: true, txnId, targetMed, sourceMed };
  },

  async getStockHistory(medicineId = null, batchNo = null, hospitalId = null) {
    await new Promise((r) => setTimeout(r, 100));
    const stockHistory = getStoredItem(KEYS.STOCK_HISTORY, []);
    
    let filtered = stockHistory;
    if (medicineId && medicineId !== 'all') {
      filtered = filtered.filter((h) => 
        h.medicineId === medicineId || 
        (h.medicineName && h.medicineName.toLowerCase() === medicineId.toLowerCase())
      );
    }
    if (batchNo && batchNo !== 'all') {
      filtered = filtered.filter((h) => (h.batchNo || '').toLowerCase() === batchNo.toLowerCase());
    }
    if (hospitalId && hospitalId !== 'all') {
      filtered = filtered.filter((h) => h.hospitalId === hospitalId || h.partnerHospitalId === hospitalId);
    }

    if (filtered.length === 0) {
      return [
        {
          id: 'sh-fallback-1',
          medicineName: 'Pharmaceutical Inventory Batch',
          batchNo: batchNo || 'BATCH-001',
          action: 'Stock Added',
          actionType: 'Intake',
          quantityDelta: 100,
          resultingStock: 100,
          performedBy: 'Apollo Hospital',
          reason: 'Initial verified stock intake registration',
          timestamp: new Date(Date.now() - 48 * 3600000).toISOString(),
          date: new Date(Date.now() - 48 * 3600000).toISOString().split('T')[0],
        }
      ];
    }

    return filtered;
  },

  // ==========================================
  // 7. CENTRAL ORDERS OVERSIGHT
  // ==========================================
  async getOrders(statusFilter = 'all') {
    await new Promise((r) => setTimeout(r, 150));
    const requests = getStoredItem(KEYS.REQUESTS, []);
    const hospitals = getStoredItem(KEYS.HOSPITALS, []);
    const medicines = getStoredItem(KEYS.MEDICINES, []);

    const orders = requests.map((req, idx) => {
      const fromHosp = hospitals.find((h) => h.id === req.fromHospitalId) || {
        name: req.fromHospitalName || 'Apollo Hospital',
        city: 'Mumbai',
        phone: '+91 98201 54321',
        email: 'apollo@smartmedishare.org',
      };
      const toHosp = hospitals.find((h) => h.id === req.toHospitalId) || {
        name: req.toHospitalName || 'Fortis Memorial',
        city: 'Gurgaon',
        phone: '+91 98112 33445',
        email: 'fortis@smartmedishare.org',
      };
      const med = medicines.find((m) => m.id === req.medicineId);

      let normStatus = req.status || 'pending';
      if (normStatus === 'accepted') normStatus = 'processing';
      if (normStatus === 'dispatched') normStatus = 'shipped';
      if (normStatus === 'paid') normStatus = 'delivered';
      if (normStatus === 'rejected') normStatus = 'cancelled';

      const unitPrice = Number(req.pricePerUnit || med?.unitOriginalPrice || 48);
      const qty = Number(req.quantity || 10);
      const totalAmt = Number(req.totalAmount || qty * unitPrice);

      const timeline = req.timeline || [
        { step: 'Order Placed', timestamp: req.requestDate || '2024-08-20', completed: true },
        { step: 'Processing & Batch Validation', timestamp: req.requestDate || '2024-08-21', completed: ['processing', 'shipped', 'delivered'].includes(normStatus) },
        { step: 'Cold-Chain Dispatch', timestamp: '2024-08-22', completed: ['shipped', 'delivered'].includes(normStatus) },
        { step: 'Delivered to Receiving Facility', timestamp: '2024-08-23', completed: normStatus === 'delivered' },
      ];

      return {
        id: req.id,
        orderId: (req.id || `req-${idx}`).toUpperCase().replace('REQ-', 'ORD-MED-'),
        hospital: {
          id: fromHosp.id,
          name: fromHosp.name,
          city: fromHosp.city || 'Mumbai',
          contact: fromHosp.phone || '+91 98201 54321',
          email: fromHosp.email || 'hospital@smartmedishare.org',
          partnerName: toHosp.name,
        },
        items: [
          {
            name: req.medicineName || med?.brandName || 'Essential Pharmaceutical Compound',
            genericName: req.genericName || med?.genericName || 'Active Formulation',
            quantity: qty,
            unitPrice,
            total: totalAmt,
          }
        ],
        totalItems: qty,
        totalAmount: totalAmt,
        orderDate: req.requestDate || '2024-08-20',
        status: normStatus,
        statusHistory: timeline,
      };
    });

    if (!statusFilter || statusFilter === 'all') return orders;
    return orders.filter((o) => o.status.toLowerCase() === statusFilter.toLowerCase());
  },

  async updateOrderStatus(orderId, targetStatus, note = '') {
    await new Promise((r) => setTimeout(r, 200));
    assertAdminSession();
    const requests = getStoredItem(KEYS.REQUESTS, []);
    const index = requests.findIndex((r) => r.id === orderId || r.id?.toUpperCase().replace('REQ-', 'ORD-MED-') === orderId);
    if (index === -1) throw new Error('Order record not found');

    const req = requests[index];
    const prevStatus = req.status;

    let rawStatus = targetStatus;
    if (targetStatus === 'processing') rawStatus = 'accepted';
    if (targetStatus === 'shipped') rawStatus = 'dispatched';
    if (targetStatus === 'delivered') rawStatus = 'delivered';
    if (targetStatus === 'cancelled') rawStatus = 'rejected';

    req.status = rawStatus;
    req.statusNote = note;
    if (!req.timeline) {
      req.timeline = [
        { step: 'Order Placed', timestamp: req.requestDate || '2024-08-20', completed: true },
        { step: 'Processing & Batch Validation', timestamp: new Date().toISOString(), completed: ['processing', 'shipped', 'delivered'].includes(targetStatus) },
        { step: 'Cold-Chain Dispatch', timestamp: new Date().toISOString(), completed: ['shipped', 'delivered'].includes(targetStatus) },
        { step: 'Delivered to Receiving Facility', timestamp: new Date().toISOString(), completed: targetStatus === 'delivered' },
      ];
    } else {
      req.timeline.push({
        step: `Status transitioned to ${targetStatus}`,
        timestamp: new Date().toISOString(),
        completed: true,
        note,
      });
    }
    setStoredItem(KEYS.REQUESTS, requests);

    const displayId = (req.id || '').toUpperCase().replace('REQ-', 'ORD-MED-');
    auditService.logEvent({
      action: 'ORDER_STATUS_UPDATED',
      entityType: 'Orders',
      entityId: displayId,
      hospitalId: req.fromHospitalId,
      hospitalName: req.fromHospitalName,
      summary: `Admin updated Order #${displayId} to ${targetStatus.toUpperCase()}`,
      resultingStatus: targetStatus,
      metadata: { previousStatus: prevStatus, note },
    });

    return req;
  },

  // ==========================================
  // 8. REPORTS & ANALYTICS
  // ==========================================
  async getReports(range = '30d') {
    await new Promise((r) => setTimeout(r, 200));
    const hospitals = getStoredItem(KEYS.HOSPITALS, []);
    const medicines = getStoredItem(KEYS.MEDICINES, []);
    const requests = getStoredItem(KEYS.REQUESTS, []);
    const feedbacks = getStoredItem(KEYS.FEEDBACKS, []);

    // 1. Hospital reports
    const totalHospitals = hospitals.length;
    const verifiedHospitals = hospitals.filter((h) => h.status === 'verified').length;
    const rejectedHospitals = hospitals.filter((h) => h.status === 'rejected').length;
    const suspendedHospitals = hospitals.filter((h) => h.status === 'suspended').length;
    const newRegistrations = hospitals.filter((h) => h.status === 'pending' || h.status === 'under_review').length;

    // 2. Medicine reports
    let lowStock = 0;
    let outOfStock = 0;
    let expired = 0;
    let expiringSoon = 0;

    medicines.forEach((m) => {
      const exp = calculateMedicineExpiry(m.expiryDate, m.mfgDate, m.quantity, m.minStockLevel || 20);
      if (exp.isExpired) expired += 1;
      else if (Number(m.quantity || 0) === 0) outOfStock += 1;
      else if (Number(m.quantity || 0) <= (m.minStockLevel || 20)) lowStock += 1;

      if (exp.isNearExpiry && !exp.isExpired) expiringSoon += 1;
    });

    const mostRequested = medicines.slice(0, 5).map((m, idx) => ({
      name: m.brandName,
      units: 140 + idx * 85,
    }));

    // 3. Order reports
    const totalOrders = requests.length;
    const dailyOrders = Math.max(2, Math.round(totalOrders / 15));
    const weeklyOrders = Math.max(8, Math.round(totalOrders / 3));
    const monthlyOrders = totalOrders;

    const hospitalOrdersMap = {};
    requests.forEach((r) => {
      const name = r.fromHospitalName || 'Apollo Hospital';
      hospitalOrdersMap[name] = (hospitalOrdersMap[name] || 0) + 1;
    });
    const hospitalWiseOrders = Object.entries(hospitalOrdersMap).map(([name, count]) => ({
      hospital: name,
      orders: count,
    }));

    return {
      hospitals: {
        total: totalHospitals,
        verified: verifiedHospitals,
        newRegistrations,
        rejected: rejectedHospitals,
        suspended: suspendedHospitals,
      },
      medicines: {
        total: medicines.length,
        mostRequested,
        lowStock,
        outOfStock,
        expired,
        expiringSoon,
      },
      orders: {
        daily: dailyOrders,
        weekly: weeklyOrders,
        monthly: monthlyOrders,
        total: totalOrders,
        hospitalWise: hospitalWiseOrders,
        mostOrdered: mostRequested,
      },
      feedback: {
        total: feedbacks.length,
        averageRating: feedbacks.length > 0
          ? Number((feedbacks.reduce((acc, f) => acc + Number(f.rating || 5), 0) / feedbacks.length).toFixed(1))
          : 4.8,
        resolved: feedbacks.filter((f) => f.status === 'resolved').length,
        unresolved: feedbacks.filter((f) => f.status !== 'resolved').length,
        categoryWise: [
          { category: 'Medicine Availability', count: feedbacks.filter((f) => f.category === 'Medicine Availability').length || 2 },
          { category: 'Order / Delivery', count: feedbacks.filter((f) => f.category === 'Order / Delivery').length || 3 },
          { category: 'Inventory', count: feedbacks.filter((f) => f.category === 'Inventory').length || 1 },
          { category: 'Website / System', count: feedbacks.filter((f) => f.category === 'Website / System').length || 1 },
          { category: 'Support', count: feedbacks.filter((f) => f.category === 'Support').length || 1 },
        ],
        trends: [
          { month: 'Jun', rating: 4.6 },
          { month: 'Jul', rating: 4.7 },
          { month: 'Aug', rating: 4.8 },
          { month: 'Sep', rating: 4.9 },
        ],
      },
    };
  },

  // ==========================================
  // 9. SETTINGS MANAGEMENT
  // ==========================================
  async getSettings() {
    await new Promise((r) => setTimeout(r, 100));
    return getStoredItem(KEYS.SETTINGS, {
      profile: {
        name: 'Super Administrator',
        email: 'admin@smartmedishare.org',
        phone: '+91 11 2345 6789',
        department: 'National Healthcare Logistics Oversight',
        avatar: '',
      },
      security: {
        twoFactorEnabled: false,
        sessionTimeoutMinutes: 60,
        lastPasswordChange: '2024-07-15',
        loginHistory: [
          { id: '1', ip: '103.21.14.88', location: 'New Delhi, India', device: 'Chrome / Windows 11', timestamp: 'Today, 09:30 AM', current: true },
          { id: '2', ip: '103.21.14.88', location: 'New Delhi, India', device: 'Chrome / Windows 11', timestamp: 'Yesterday, 04:15 PM', current: false },
          { id: '3', ip: '49.207.210.12', location: 'Mumbai, India', device: 'Safari / macOS', timestamp: 'Sep 05, 2024, 11:20 AM', current: false },
        ],
      },
      notifications: {
        lowStockNotifications: true,
        expiryNotifications: true,
        newHospitalNotifications: true,
        newOrderNotifications: true,
        feedbackNotifications: true,
      },
      system: {
        minStockThreshold: 20,
        expiryWarningPeriodDays: 60,
        requestSlaHours: 48,
        coldChainMinTemp: 2.0,
        coldChainMaxTemp: 8.0,
      }
    });
  },

  async updateSettings(updateData) {
    await new Promise((r) => setTimeout(r, 200));
    assertAdminSession();
    const current = await this.getSettings();
    const merged = {
      profile: { ...current.profile, ...(updateData.profile || {}) },
      security: { ...current.security, ...(updateData.security || {}) },
      notifications: { ...current.notifications, ...(updateData.notifications || {}) },
      system: { ...current.system, ...(updateData.system || {}) },
    };
    setStoredItem(KEYS.SETTINGS, merged);

    auditService.logEvent({
      action: 'SETTINGS_UPDATED',
      entityType: 'Settings',
      entityId: 'admin-config',
      summary: 'Admin updated system configuration and security preferences',
      resultingStatus: 'Saved',
    });

    return merged;
  }
};
