import { getStoredItem, setStoredItem, KEYS, isHospitalSuspended } from './storage';
import { HOSPITAL_ANALYTICS } from './mockData';

const SUSPENDED_HOSPITAL_ERROR = 'Your hospital account is currently suspended. You cannot perform transactions or operational activities.';

const assertHospitalActive = (requestedHospitalId) => {
  const session = getStoredItem(KEYS.AUTH, null);
  const authenticatedHospitalId = session?.user?.role === 'hospital' ? session.user.id : requestedHospitalId;
  if (session?.user?.role === 'hospital' && requestedHospitalId && authenticatedHospitalId !== requestedHospitalId) {
    throw new Error('You are not authorized to act for this hospital');
  }
  if (isHospitalSuspended(authenticatedHospitalId)) {
    throw new Error(SUSPENDED_HOSPITAL_ERROR);
  }
};

export const hospitalService = {
  // 1. Dashboard analytics
  async getDashboard(hospitalId) {
    await new Promise((r) => setTimeout(r, 300));
    const medicines = getStoredItem(KEYS.MEDICINES, []);
    const myMeds = medicines.filter((m) => m.hospitalId === hospitalId);
    const requests = getStoredItem(KEYS.REQUESTS, []);
    const myIncoming = requests.filter((r) => r.toHospitalId === hospitalId);
    const myOutgoing = requests.filter((r) => r.fromHospitalId === hospitalId);

    const calculatedStats = {
      totalMedicines: myMeds.reduce((acc, m) => acc + Number(m.quantity || 0), 0) || HOSPITAL_ANALYTICS.stats.totalMedicines,
      activeSkus: myMeds.length || 14,
      monthlyPurchases: 462500,
      monthlySales: 689000,
      profitabilityPercent: 28.4,
      pendingRequestsCount: myIncoming.filter((r) => r.status === 'pending').length,
      activeShipmentsCount: 2,
    };

    return {
      stats: calculatedStats,
      purchasesMonthly: HOSPITAL_ANALYTICS.purchasesMonthly,
      salesMonthly: HOSPITAL_ANALYTICS.salesMonthly,
      profitabilityTrend: HOSPITAL_ANALYTICS.profitabilityTrend,
    };
  },

  // 2. Inventory CRUD
  async getInventory(hospitalId) {
    await new Promise((r) => setTimeout(r, 250));
    const medicines = getStoredItem(KEYS.MEDICINES, []);
    return medicines.filter((m) => !hospitalId || m.hospitalId === hospitalId || m.hospitalId === 'hosp-1');
  },

  async addMedicine(medicineData) {
    await new Promise((r) => setTimeout(r, 350));
    assertHospitalActive(medicineData.hospitalId);
    const medicines = getStoredItem(KEYS.MEDICINES, []);

    const newMed = {
      id: 'med-' + Date.now(),
      ...medicineData,
      quantity: Number(medicineData.quantity),
      unitOriginalPrice: Number(medicineData.unitOriginalPrice),
      concessionPercent: Number(medicineData.concessionPercent || 0),
      dateAdded: new Date().toISOString().split('T')[0],
      distanceKm: medicineData.distanceKm || 0,
    };

    medicines.unshift(newMed);
    setStoredItem(KEYS.MEDICINES, medicines);
    return newMed;
  },

  async updateMedicine(id, updatedData) {
    await new Promise((r) => setTimeout(r, 300));
    const medicines = getStoredItem(KEYS.MEDICINES, []);
    const index = medicines.findIndex((m) => m.id === id);
    if (index === -1) throw new Error('Medicine not found');
    assertHospitalActive(medicines[index].hospitalId);

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

  async deleteMedicine(id) {
    await new Promise((r) => setTimeout(r, 250));
    const medicines = getStoredItem(KEYS.MEDICINES, []);
    const medicine = medicines.find((m) => m.id === id);
    if (!medicine) throw new Error('Medicine not found');
    assertHospitalActive(medicine.hospitalId);
    const filtered = medicines.filter((m) => m.id !== id);
    setStoredItem(KEYS.MEDICINES, filtered);
    return true;
  },

  // 3. Marketplace
  async getMarketplace(currentHospitalId, filters = {}) {
    await new Promise((r) => setTimeout(r, 300));
    const medicines = getStoredItem(KEYS.MEDICINES, []);
    let results = medicines.filter((m) => m.hospitalId !== currentHospitalId && m.quantity > 0);

    if (filters.search) {
      const q = filters.search.toLowerCase();
      results = results.filter((m) =>
        m.brandName.toLowerCase().includes(q) ||
        m.genericName?.toLowerCase().includes(q) ||
        m.category?.toLowerCase().includes(q)
      );
    }
    if (filters.power) {
      const p = filters.power.toLowerCase();
      results = results.filter((m) => m.power.toLowerCase().includes(p));
    }
    if (filters.location) {
      const loc = filters.location.toLowerCase();
      results = results.filter((m) => m.location.toLowerCase().includes(loc));
    }
    if (filters.storageType) {
      results = results.filter((m) => m.storageType === filters.storageType);
    }

    return results;
  },

  // 4. Requests (Outgoing & Incoming)
  async createRequest(reqData) {
    await new Promise((r) => setTimeout(r, 400));
    assertHospitalActive(reqData.fromHospitalId);
    const requests = getStoredItem(KEYS.REQUESTS, []);

    const newReq = {
      id: 'req-' + Date.now(),
      medicineId: reqData.medicineId,
      medicineName: reqData.medicineName,
      power: reqData.power,
      quantity: Number(reqData.quantity),
      unitOriginalPrice: Number(reqData.unitOriginalPrice),
      concessionPercent: Number(reqData.concessionPercent),
      unitFinalPrice: Number(reqData.unitFinalPrice),
      totalAmount: Number(reqData.totalAmount),
      fromHospitalId: reqData.fromHospitalId,
      fromHospitalName: reqData.fromHospitalName,
      toHospitalId: reqData.toHospitalId,
      toHospitalName: reqData.toHospitalName,
      requestDate: new Date().toISOString(),
      status: 'pending',
      rejectReason: null,
      transactionId: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
      paymentId: null,
      paymentStatus: 'pending',
      notes: reqData.notes || '',
    };

    requests.unshift(newReq);
    setStoredItem(KEYS.REQUESTS, requests);
    return newReq;
  },

  async getOutgoingRequests(hospitalId) {
    await new Promise((r) => setTimeout(r, 200));
    const requests = getStoredItem(KEYS.REQUESTS, []);
    return requests.filter((r) => r.fromHospitalId === hospitalId || !hospitalId);
  },

  async getIncomingRequests(hospitalId) {
    await new Promise((r) => setTimeout(r, 200));
    const requests = getStoredItem(KEYS.REQUESTS, []);
    return requests.filter((r) => r.toHospitalId === hospitalId || !hospitalId);
  },

  async handleRequest(requestId, action, reason = '', hospitalId) {
    await new Promise((r) => setTimeout(r, 350));
    const requests = getStoredItem(KEYS.REQUESTS, []);
    const index = requests.findIndex((r) => r.id === requestId);
    if (index === -1) throw new Error('Request not found');
    assertHospitalActive(hospitalId || requests[index].toHospitalId);

    if (action === 'accept') {
      requests[index].status = 'accepted';
      requests[index].rejectReason = null;
    } else if (action === 'reject') {
      requests[index].status = 'rejected';
      requests[index].rejectReason = reason || 'Declined by providing hospital due to stock allocation';
    }

    setStoredItem(KEYS.REQUESTS, requests);
    return requests[index];
  },

  // 5. Razorpay Mock Payment Gateway
  async processPayment({ requestId, paymentMethod = 'Razorpay UPI' }) {
    await new Promise((r) => setTimeout(r, 800));
    const requests = getStoredItem(KEYS.REQUESTS, []);
    const payments = getStoredItem(KEYS.PAYMENTS, []);
    const trackingList = getStoredItem(KEYS.TRACKING, []);

    const index = requests.findIndex((r) => r.id === requestId);
    if (index === -1) throw new Error('Request not found');

    const req = requests[index];
    assertHospitalActive(req.fromHospitalId);
    const paymentId = 'pay_' + Math.random().toString(36).substring(2, 11) + 'Xz';
    const orderId = 'order_' + Math.random().toString(36).substring(2, 10);

    // Update Request
    req.status = 'paid';
    req.paymentId = paymentId;
    req.paymentStatus = 'success';
    req.paidDate = new Date().toISOString();
    setStoredItem(KEYS.REQUESTS, requests);

    // Record Payment
    const newPayment = {
      id: 'pay-' + Date.now(),
      transactionId: req.transactionId,
      medicineName: req.medicineName,
      quantity: req.quantity,
      amount: req.totalAmount,
      gstAmount: Math.round(req.totalAmount * 0.12),
      totalPaid: Math.round(req.totalAmount * 1.12),
      paymentStatus: 'Success',
      date: new Date().toLocaleString(),
      razorpayPaymentId: paymentId,
      razorpayOrderId: orderId,
      paymentMethod,
      buyerHospital: req.fromHospitalName,
      sellerHospital: req.toHospitalName,
    };
    payments.unshift(newPayment);
    setStoredItem(KEYS.PAYMENTS, payments);

    // Generate Tracking record
    const newTracking = {
      transactionId: req.transactionId,
      trackingNumber: 'SMS-EXP-' + Math.floor(10000 + Math.random() * 90000),
      senderHospital: req.toHospitalName,
      receiverHospital: req.fromHospitalName,
      medicineName: req.medicineName,
      quantity: req.quantity,
      status: 'Dispatched',
      currentLocation: 'Central Cold-Chain Hub, Expressway Junction',
      destination: `${req.fromHospitalName} Central Pharmacy Dock`,
      eta: 'Tomorrow, 04:00 PM (Est. 24 hrs)',
      courierName: 'MediCold Bio-Express',
      courierContact: '+91 91122 33445 (Dispatcher: Vikram S.)',
      vehicleNo: 'MH-02-EX-7741 (IoT Monitored)',
      temperature: '3.9°C (Compliant)',
      timeline: [
        { step: 'Order Placed & Verified', date: new Date().toLocaleString(), completed: true, details: 'Exchange terms approved.' },
        { step: 'Payment Processed via Razorpay', date: new Date().toLocaleString(), completed: true, details: `Ref: ${paymentId}, ₹${newPayment.totalPaid} settled.` },
        { step: 'Dispatched & Cold Seal Applied', date: 'In Progress', completed: true, details: 'Package sealed in thermal insulated cryo-box.' },
        { step: 'In Transit with Live IoT GPS/Temp', date: 'Pending', completed: false, details: 'Telemetry logger active.' },
        { step: 'Delivered to Receiving Hospital', date: 'Pending', completed: false, details: 'Dock inspection required.' },
      ],
      coordinates: {
        origin: [28.5273, 77.2155],
        current: [24.5854, 73.7125],
        destination: [19.0144, 73.0408],
      }
    };
    trackingList.unshift(newTracking);
    setStoredItem(KEYS.TRACKING, trackingList);

    return { request: req, payment: newPayment, tracking: newTracking };
  },

  // 6. Tracking
  async getTrackingByTxn(txnId) {
    await new Promise((r) => setTimeout(r, 300));
    const trackingList = getStoredItem(KEYS.TRACKING, []);
    if (!txnId) return trackingList[0] || null;
    return trackingList.find((t) => t.transactionId.toLowerCase() === txnId.trim().toLowerCase()) || trackingList[0];
  },

  async getAllTracking() {
    await new Promise((r) => setTimeout(r, 200));
    return getStoredItem(KEYS.TRACKING, []);
  },

  // 7. Sales & Purchases History
  async getSalesHistory(hospitalId) {
    await new Promise((r) => setTimeout(r, 250));
    const requests = getStoredItem(KEYS.REQUESTS, []);
    return requests
      .filter((r) => (r.toHospitalId === hospitalId || !hospitalId) && ['accepted', 'paid', 'dispatched', 'delivered'].includes(r.status))
      .map((r) => ({
        id: r.id,
        transactionId: r.transactionId,
        medicine: r.medicineName,
        partnerHospital: r.fromHospitalName,
        quantity: r.quantity,
        amount: r.totalAmount,
        date: r.requestDate.split('T')[0],
        status: r.status,
      }));
  },

  async getPurchasesHistory(hospitalId) {
    await new Promise((r) => setTimeout(r, 250));
    const requests = getStoredItem(KEYS.REQUESTS, []);
    return requests
      .filter((r) => (r.fromHospitalId === hospitalId || !hospitalId) && ['accepted', 'paid', 'dispatched', 'delivered', 'rejected'].includes(r.status))
      .map((r) => ({
        id: r.id,
        transactionId: r.transactionId,
        medicine: r.medicineName,
        partnerHospital: r.toHospitalName,
        quantity: r.quantity,
        amount: r.totalAmount,
        date: r.requestDate.split('T')[0],
        status: r.status,
      }));
  },

  // 8. Payments history
  async getPaymentHistory() {
    await new Promise((r) => setTimeout(r, 200));
    return getStoredItem(KEYS.PAYMENTS, []);
  },

  // 9. Feedback
  async submitFeedback(feedbackData) {
    await new Promise((r) => setTimeout(r, 350));
    const feedbacks = getStoredItem(KEYS.FEEDBACKS, []);
    const newFb = {
      id: 'fb-' + Date.now(),
      hospitalId: feedbackData.hospitalId || 'hosp-1',
      hospitalName: feedbackData.hospitalName || 'Apollo Hospital',
      rating: Number(feedbackData.rating),
      category: feedbackData.category || 'General Service',
      feedbackText: feedbackData.feedbackText,
      date: new Date().toISOString().split('T')[0],
      adminReply: null,
      repliedDate: null,
    };
    feedbacks.unshift(newFb);
    setStoredItem(KEYS.FEEDBACKS, feedbacks);
    return newFb;
  },

  async getFeedbacks(hospitalId) {
    await new Promise((r) => setTimeout(r, 200));
    const feedbacks = getStoredItem(KEYS.FEEDBACKS, []);
    return feedbacks.filter((f) => !hospitalId || f.hospitalId === hospitalId || f.hospitalId === 'hosp-1');
  }
};
