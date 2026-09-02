import { getStoredItem, setStoredItem, KEYS } from './storage';
import { ADMIN_ANALYTICS } from './mockData';

export const adminService = {
  // 1. Dashboard
  async getDashboard() {
    await new Promise((r) => setTimeout(r, 300));
    const hospitals = getStoredItem(KEYS.HOSPITALS, []);
    const medicines = getStoredItem(KEYS.MEDICINES, []);
    const requests = getStoredItem(KEYS.REQUESTS, []);

    const dynamicStats = {
      totalHospitals: hospitals.length || ADMIN_ANALYTICS.stats.totalHospitals,
      pendingVerifications: hospitals.filter((h) => h.status === 'pending').length,
      monthlyTransfers: requests.length * 28 + 120 || ADMIN_ANALYTICS.stats.monthlyTransfers,
      totalMedicinesTransferred: medicines.reduce((sum, m) => sum + Number(m.quantity || 0), 0) + 12000,
      totalPlatformVolume: '₹ 2.14 Cr',
      avgFulfillmentRate: '98.8%',
    };

    return {
      stats: dynamicStats,
      transferTrends: ADMIN_ANALYTICS.transferTrends,
      systemPerformance: ADMIN_ANALYTICS.systemPerformance,
      topHotMedicines: ADMIN_ANALYTICS.topHotMedicines,
    };
  },

  // 2. Hospital Management & Verification
  async getHospitals(filterStatus = null) {
    await new Promise((r) => setTimeout(r, 250));
    const hospitals = getStoredItem(KEYS.HOSPITALS, []);
    if (!filterStatus || filterStatus === 'all') return hospitals;
    return hospitals.filter((h) => h.status === filterStatus);
  },

  async verifyHospital(hospitalId) {
    await new Promise((r) => setTimeout(r, 400));
    const hospitals = getStoredItem(KEYS.HOSPITALS, []);
    const index = hospitals.findIndex((h) => h.id === hospitalId);
    if (index === -1) throw new Error('Hospital not found');

    hospitals[index].status = 'verified';
    hospitals[index].verifiedDate = new Date().toISOString().split('T')[0];
    hospitals[index].rejectionReason = null;
    if (hospitals[index].documents) {
      hospitals[index].documents = hospitals[index].documents.map((d) => ({ ...d, verified: true }));
    }

    setStoredItem(KEYS.HOSPITALS, hospitals);
    return hospitals[index];
  },

  async rejectHospital(hospitalId, reason) {
    await new Promise((r) => setTimeout(r, 400));
    const hospitals = getStoredItem(KEYS.HOSPITALS, []);
    const index = hospitals.findIndex((h) => h.id === hospitalId);
    if (index === -1) throw new Error('Hospital not found');

    hospitals[index].status = 'rejected';
    hospitals[index].rejectionReason = reason || 'Documentation does not meet Ministry of Health & FW compliance guidelines.';
    hospitals[index].verifiedDate = null;

    setStoredItem(KEYS.HOSPITALS, hospitals);
    return hospitals[index];
  },

  async getHospitalDetails(hospitalId) {
    await new Promise((r) => setTimeout(r, 200));
    const hospitals = getStoredItem(KEYS.HOSPITALS, []);
    return hospitals.find((h) => h.id === hospitalId) || hospitals[0];
  },

  async updateHospitalDetails(hospitalId, updateData) {
    await new Promise((r) => setTimeout(r, 400));
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

  // 3. Medicine Data Management across all hospitals
  async getMedicineData(hospitalId = null) {
    await new Promise((r) => setTimeout(r, 250));
    const medicines = getStoredItem(KEYS.MEDICINES, []);
    if (!hospitalId || hospitalId === 'all') return medicines;
    return medicines.filter((m) => m.hospitalId === hospitalId);
  },

  async addMedicineToHospital(medicineData) {
    await new Promise((r) => setTimeout(r, 350));
    const medicines = getStoredItem(KEYS.MEDICINES, []);
    const hospitals = getStoredItem(KEYS.HOSPITALS, []);
    const hosp = hospitals.find((h) => h.id === medicineData.hospitalId) || { name: 'Apollo Hospital', city: 'Mumbai' };

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
    };

    medicines.unshift(newMed);
    setStoredItem(KEYS.MEDICINES, medicines);
    return newMed;
  },

  async updateMedicineData(id, updatedData) {
    await new Promise((r) => setTimeout(r, 300));
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
    await new Promise((r) => setTimeout(r, 250));
    const medicines = getStoredItem(KEYS.MEDICINES, []);
    const filtered = medicines.filter((m) => m.id !== id);
    setStoredItem(KEYS.MEDICINES, filtered);
    return true;
  },

  // 4. Transfers & Disposals
  async getTransfers() {
    await new Promise((r) => setTimeout(r, 250));
    return getStoredItem(KEYS.TRACKING, []);
  },

  async updateTransferStatus(transactionId, newStatus) {
    await new Promise((r) => setTimeout(r, 300));
    const trackingList = getStoredItem(KEYS.TRACKING, []);
    const index = trackingList.findIndex((t) => t.transactionId === transactionId);
    if (index === -1) throw new Error('Transfer record not found');

    trackingList[index].status = newStatus;
    if (trackingList[index].timeline) {
      const match = trackingList[index].timeline.find((t) => t.step.toLowerCase().includes(newStatus.toLowerCase()));
      if (match) match.completed = true;
    }

    setStoredItem(KEYS.TRACKING, trackingList);
    return trackingList[index];
  },

  async getDisposals() {
    await new Promise((r) => setTimeout(r, 250));
    return getStoredItem(KEYS.DISPOSALS, []);
  },

  async updateDisposalStatus(id, newStatus, certificateNo = null) {
    await new Promise((r) => setTimeout(r, 300));
    const disposals = getStoredItem(KEYS.DISPOSALS, []);
    const index = disposals.findIndex((d) => d.id === id);
    if (index === -1) throw new Error('Disposal record not found');

    disposals[index].status = newStatus;
    if (certificateNo) {
      disposals[index].certificateNo = certificateNo;
    }
    if (newStatus === 'Incinerated & Certified' && !disposals[index].certificateNo) {
      disposals[index].certificateNo = 'BMW-INC-2024-' + Math.floor(10000 + Math.random() * 90000);
    }

    setStoredItem(KEYS.DISPOSALS, disposals);
    return disposals[index];
  },

  // 5. Admin Feedback Management
  async getFeedback(ratingFilter = null) {
    await new Promise((r) => setTimeout(r, 250));
    const feedbacks = getStoredItem(KEYS.FEEDBACKS, []);
    if (!ratingFilter || ratingFilter === 'all') return feedbacks;
    return feedbacks.filter((f) => f.rating === Number(ratingFilter));
  },

  async replyFeedback(id, replyText) {
    await new Promise((r) => setTimeout(r, 350));
    const feedbacks = getStoredItem(KEYS.FEEDBACKS, []);
    const index = feedbacks.findIndex((f) => f.id === id);
    if (index === -1) throw new Error('Feedback not found');

    feedbacks[index].adminReply = replyText;
    feedbacks[index].repliedDate = new Date().toISOString().split('T')[0];

    setStoredItem(KEYS.FEEDBACKS, feedbacks);
    return feedbacks[index];
  }
};
