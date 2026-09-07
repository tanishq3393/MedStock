import {
  INITIAL_HOSPITALS,
  INITIAL_MEDICINES,
  INITIAL_REQUESTS,
  INITIAL_TRACKING,
  INITIAL_PAYMENTS,
  INITIAL_DISPOSALS,
  INITIAL_FEEDBACKS,
  HOSPITAL_ANALYTICS,
  ADMIN_ANALYTICS
} from './mockData';

const KEYS = {
  HOSPITALS: 'sms_hospitals',
  MEDICINES: 'sms_medicines',
  REQUESTS: 'sms_requests',
  TRACKING: 'sms_tracking',
  PAYMENTS: 'sms_payments',
  DISPOSALS: 'sms_disposals',
  FEEDBACKS: 'sms_feedbacks',
  AUTH: 'sms_auth_session',
  ALERTS: 'sms_alerts',
  AUDIT_TRAIL: 'sms_audit_trail',
};

// Initialize localStorage with mock data if not present, and seamlessly merge new mock data
export const initializeStorage = () => {
  // 1. Hospitals: initialize or merge missing
  const storedHospitals = localStorage.getItem(KEYS.HOSPITALS);
  if (!storedHospitals) {
    localStorage.setItem(KEYS.HOSPITALS, JSON.stringify(INITIAL_HOSPITALS));
  } else {
    try {
      const parsedHosp = JSON.parse(storedHospitals);
      const existingHospIds = new Set(parsedHosp.map((h) => h.id));
      const missingHosp = INITIAL_HOSPITALS.filter((h) => !existingHospIds.has(h.id));
      if (missingHosp.length > 0) {
        localStorage.setItem(KEYS.HOSPITALS, JSON.stringify([...parsedHosp, ...missingHosp]));
      }
    } catch (e) {
      console.error('Failed to migrate hospitals', e);
    }
  }

  // 2. Medicines: initialize or merge missing & ensure mfgDate
  const storedMedicines = localStorage.getItem(KEYS.MEDICINES);
  if (!storedMedicines) {
    localStorage.setItem(KEYS.MEDICINES, JSON.stringify(INITIAL_MEDICINES));
  } else {
    try {
      let parsed = JSON.parse(storedMedicines);
      let modified = false;

      // Merge newly added mock medicines
      const existingMedIds = new Set(parsed.map((m) => m.id));
      const missingMeds = INITIAL_MEDICINES.filter((m) => !existingMedIds.has(m.id));
      if (missingMeds.length > 0) {
        parsed = [...parsed, ...missingMeds];
        modified = true;
      }

      // Backfill missing fields (images, invoice, packSize) and ensure mfgDate
      const updated = parsed.map((m) => {
        let med = { ...m };
        const match = INITIAL_MEDICINES.find((init) => init.id === m.id);
        if (match) {
          if (!med.images && match.images) {
            med.images = match.images;
            modified = true;
          }
          if (!med.image && match.image) {
            med.image = match.image;
            modified = true;
          }
          if (!med.invoice && match.invoice) {
            med.invoice = match.invoice;
            modified = true;
          }
          if (!med.packSize && match.packSize) {
            med.packSize = match.packSize;
            modified = true;
          }
          if (!med.mfgDate && match.mfgDate) {
            med.mfgDate = match.mfgDate;
            modified = true;
          }
        }
        if (!med.mfgDate) {
          if (med.expiryDate) {
            const d = new Date(med.expiryDate);
            d.setFullYear(d.getFullYear() - 1);
            med.mfgDate = d.toISOString().split('T')[0];
          } else {
            med.mfgDate = '2023-11-15';
          }
          modified = true;
        }
        return med;
      });

      if (modified) {
        localStorage.setItem(KEYS.MEDICINES, JSON.stringify(updated));
      }
    } catch (e) {
      console.error('Failed to migrate medicines mfgDate', e);
    }
  }

  // 3. Requests: initialize or merge missing & ensure expiryDate/requirementGroupId
  const storedRequests = localStorage.getItem(KEYS.REQUESTS);
  if (!storedRequests) {
    localStorage.setItem(KEYS.REQUESTS, JSON.stringify(INITIAL_REQUESTS));
  } else {
    try {
      let parsedReqs = JSON.parse(storedRequests);
      let modified = false;

      // Merge missing mock requests
      const existingReqIds = new Set(parsedReqs.map((r) => r.id));
      const missingReqs = INITIAL_REQUESTS.filter((r) => !existingReqIds.has(r.id));
      if (missingReqs.length > 0) {
        parsedReqs = [...parsedReqs, ...missingReqs];
        modified = true;
      }

      const updatedReqs = parsedReqs.map((req) => {
        if (!req.expiryDate && req.requestDate) {
          modified = true;
          const d = new Date(req.requestDate);
          return {
            ...req,
            expiryDate: new Date(d.getTime() + 48 * 3600 * 1000).toISOString(),
          };
        }
        return req;
      });

      // Ensure the competing request test group exists if not present
      const hasCompeting = updatedReqs.some((r) => r.id === 'req-competing-1');
      if (!hasCompeting) {
        const competingSample = INITIAL_REQUESTS.filter((r) => r.id?.startsWith('req-competing'));
        if (competingSample.length > 0) {
          updatedReqs.unshift(...competingSample);
          modified = true;
        }
      }

      if (modified) {
        localStorage.setItem(KEYS.REQUESTS, JSON.stringify(updatedReqs));
      }
    } catch (e) {
      console.error('Failed to migrate requests', e);
    }
  }

  // 4. Tracking: initialize or merge missing by transactionId
  const storedTracking = localStorage.getItem(KEYS.TRACKING);
  if (!storedTracking) {
    localStorage.setItem(KEYS.TRACKING, JSON.stringify(INITIAL_TRACKING));
  } else {
    try {
      const parsedTracking = JSON.parse(storedTracking);
      const existingTxnIds = new Set(parsedTracking.map((t) => t.transactionId));
      const missingTracking = INITIAL_TRACKING.filter((t) => !existingTxnIds.has(t.transactionId));
      if (missingTracking.length > 0) {
        localStorage.setItem(KEYS.TRACKING, JSON.stringify([...parsedTracking, ...missingTracking]));
      }
    } catch (e) {
      console.error('Failed to migrate tracking', e);
    }
  }

  // 5. Payments: initialize or merge missing
  const storedPayments = localStorage.getItem(KEYS.PAYMENTS);
  if (!storedPayments) {
    localStorage.setItem(KEYS.PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
  } else {
    try {
      const parsedPayments = JSON.parse(storedPayments);
      const existingPaymentIds = new Set(parsedPayments.map((payment) => payment.id));
      const missingPayments = INITIAL_PAYMENTS.filter((payment) => !existingPaymentIds.has(payment.id));
      if (missingPayments.length > 0) {
        localStorage.setItem(KEYS.PAYMENTS, JSON.stringify([...parsedPayments, ...missingPayments]));
      }
    } catch (e) {
      console.error('Failed to migrate payment history', e);
    }
  }

  // 6. Disposals: initialize or merge missing & ensure hospitalId
  const storedDisposals = localStorage.getItem(KEYS.DISPOSALS);
  if (!storedDisposals) {
    localStorage.setItem(KEYS.DISPOSALS, JSON.stringify(INITIAL_DISPOSALS));
  } else {
    try {
      let parsedDisp = JSON.parse(storedDisposals);
      let modified = false;

      // Merge missing disposals
      const existingDispIds = new Set(parsedDisp.map((d) => d.id));
      const missingDisposals = INITIAL_DISPOSALS.filter((d) => !existingDispIds.has(d.id));
      if (missingDisposals.length > 0) {
        parsedDisp = [...parsedDisp, ...missingDisposals];
        modified = true;
      }

      const updatedDisp = parsedDisp.map((d) => {
        if (!d.hospitalId) {
          modified = true;
          const match = INITIAL_DISPOSALS.find((init) => init.id === d.id);
          return {
            ...d,
            hospitalId: match?.hospitalId || 'hosp-1',
            wasteCategory: match?.wasteCategory || d.wasteCategory || 'Expired Pharmaceuticals',
            treatmentMethod: match?.treatmentMethod || 'High-Temperature Double-Chamber Incineration',
            manifestNumber: match?.manifestNumber || 'MPCB-BMW-MNF-' + Math.floor(10000 + Math.random() * 90000),
          };
        }
        return d;
      });

      if (modified) {
        localStorage.setItem(KEYS.DISPOSALS, JSON.stringify(updatedDisp));
      }
    } catch (e) {
      console.error('Failed to migrate disposals', e);
    }
  }

  // 7. Feedbacks: initialize or merge missing
  const storedFeedbacks = localStorage.getItem(KEYS.FEEDBACKS);
  if (!storedFeedbacks) {
    localStorage.setItem(KEYS.FEEDBACKS, JSON.stringify(INITIAL_FEEDBACKS));
  } else {
    try {
      const parsedFeedbacks = JSON.parse(storedFeedbacks);
      const existingFeedbackIds = new Set(parsedFeedbacks.map((f) => f.id));
      const missingFeedbacks = INITIAL_FEEDBACKS.filter((f) => !existingFeedbackIds.has(f.id));
      if (missingFeedbacks.length > 0) {
        localStorage.setItem(KEYS.FEEDBACKS, JSON.stringify([...parsedFeedbacks, ...missingFeedbacks]));
      }
    } catch (e) {
      console.error('Failed to migrate feedbacks', e);
    }
  }

  if (!localStorage.getItem(KEYS.ALERTS)) {
    localStorage.setItem(KEYS.ALERTS, JSON.stringify({}));
  }
  if (!localStorage.getItem(KEYS.AUDIT_TRAIL)) {
    localStorage.setItem(KEYS.AUDIT_TRAIL, JSON.stringify([]));
  }
};

export const getStoredItem = (key, fallback = []) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return fallback;
  }
};

export const setStoredItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
  }
};

export const isHospitalSuspended = (hospitalId) => {
  const hospitals = getStoredItem(KEYS.HOSPITALS, []);
  return hospitals.some((hospital) => hospital.id === hospitalId && hospital.status?.toLowerCase() === 'suspended');
};

export { KEYS };
