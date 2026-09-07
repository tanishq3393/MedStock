import { getStoredItem, setStoredItem, KEYS } from './storage';
import { ADMIN_ANALYTICS } from './mockData';
import { auditService } from './auditService';

const assertAdminSession = () => {
  const session = getStoredItem(KEYS.AUTH, null);
  if (session?.user?.role !== 'admin') throw new Error('Admin authorization is required for this action');
};

export const adminService = {
  // ==========================================
  // 1. DASHBOARD & SUPERVISORY ANALYTICS
  // ==========================================
  async getDashboard() {
    await new Promise((r) => setTimeout(r, 250));
    const hospitals = getStoredItem(KEYS.HOSPITALS, []);
    const medicines = getStoredItem(KEYS.MEDICINES, []);
    const requests = getStoredItem(KEYS.REQUESTS, []);
    const payments = getStoredItem(KEYS.PAYMENTS, []);

    const totalVol = payments.reduce((acc, p) => acc + Number(p.totalPaid || p.amount || 0), 0);
    const formattedVolume = totalVol > 0 
      ? `₹ ${(totalVol / 100000).toFixed(2)} Lakhs`
      : '₹ 2.14 Cr (Platform Est.)';

    const fulfilledRequests = requests.filter((r) => ['accepted', 'paid', 'dispatched', 'delivered'].includes(r.status));
    const totalRequests = requests.filter((r) => r.status !== 'pending').length;
    const fulfillmentRate = totalRequests > 0 
      ? `${Math.round((fulfilledRequests.length / totalRequests) * 100)}%`
      : '98.8%';

    const dynamicStats = {
      totalHospitals: hospitals.length,
      pendingVerifications: hospitals.filter((h) => h.status === 'pending' || h.status === 'under_review').length,
      monthlyTransfers: requests.length,
      totalMedicinesTransferred: fulfilledRequests.reduce((sum, r) => sum + Number(r.quantity || 0), 0) || 1240,
      totalPlatformVolume: formattedVolume,
      avgFulfillmentRate: fulfillmentRate,
      isDemoSimulation: true,
    };

    return {
      stats: dynamicStats,
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
    if (hospital.documents) {
      hospital.documents = hospital.documents.map((d) => ({ ...d, verified: true }));
    }

    setStoredItem(KEYS.HOSPITALS, hospitals);

    auditService.logEvent({
      action: 'HOSPITAL_VERIFIED',
      entityType: 'VERIFICATION',
      entityId: hospital.id,
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      summary: `Accreditation audit approved for ${hospital.name}. Form 20B/21B permits validated in demo verification engine.`,
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
      action: 'HOSPITAL_REJECTED',
      entityType: 'VERIFICATION',
      entityId: hospital.id,
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      summary: `Application rejected for ${hospital.name}. Reason: ${hospital.rejectionReason}`,
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
  // 3. MEDICINE DIRECTORY OVERSIGHT
  // ==========================================
  async getMedicineData(hospitalId = null) {
    await new Promise((r) => setTimeout(r, 200));
    const medicines = getStoredItem(KEYS.MEDICINES, []);
    if (!hospitalId || hospitalId === 'all') return medicines;
    return medicines.filter((m) => m.hospitalId === hospitalId);
  },

  async addMedicineToHospital(medicineData) {
    await new Promise((r) => setTimeout(r, 250));
    assertAdminSession();
    const medicines = getStoredItem(KEYS.MEDICINES, []);
    const hospitals = getStoredItem(KEYS.HOSPITALS, []);
    const hosp = hospitals.find((h) => h.id === medicineData.hospitalId) || { name: 'Hospital Facility', city: 'Mumbai' };

    const newMed = {
      id: 'med-' + Date.now(),
      ...medicineData,
      hospitalName: hosp.name,
      location: `${hosp.city}, ${hosp.state || 'India'}`,
      quantity: Number(medicineData.quantity),
      unitOriginalPrice: Number(medicineData.unitOriginalPrice),
      concessionPercent: Number(medicineData.concessionPercent || 0),
      dateAdded: new Date().toISOString().split('T')[0],
      distanceKm: medicineData.distanceKm || 15.0,
      status: 'active',
    };

    medicines.unshift(newMed);
    setStoredItem(KEYS.MEDICINES, medicines);
    return newMed;
  },

  async updateMedicineData(id, updatedData) {
    await new Promise((r) => setTimeout(r, 200));
    assertAdminSession();
    const medicines = getStoredItem(KEYS.MEDICINES, []);
    const index = medicines.findIndex((m) => m.id === id);
    if (index === -1) throw new Error('Medicine record not found');

    medicines[index] = {
      ...medicines[index],
      ...updatedData,
      quantity: Number(updatedData.quantity ?? medicines[index].quantity),
      unitOriginalPrice: Number(updatedData.unitOriginalPrice ?? medicines[index].unitOriginalPrice),
      concessionPercent: Number(updatedData.concessionPercent ?? medicines[index].concessionPercent),
    };

    setStoredItem(KEYS.MEDICINES, medicines);
    return medicines[index];
  },

  async deleteMedicineData(id) {
    await new Promise((r) => setTimeout(r, 200));
    assertAdminSession();
    const medicines = getStoredItem(KEYS.MEDICINES, []);
    const filtered = medicines.filter((m) => m.id !== id);
    setStoredItem(KEYS.MEDICINES, filtered);
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

    setStoredItem(KEYS.FEEDBACKS, feedbacks);
    return feedbacks[index];
  }
};
