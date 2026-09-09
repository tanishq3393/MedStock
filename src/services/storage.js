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
          if (!med.mfgDate && match.mfgDate) {
            med.mfgDate = match.mfgDate;
            modified = true;
          }
          if (!med.form && match.form) {
            med.form = match.form;
            modified = true;
          }
          if (med.minStockLevel === undefined && match.minStockLevel !== undefined) {
            med.minStockLevel = match.minStockLevel;
            modified = true;
          }
        }
        if (!med.form) {
          med.form = 'Tablet';
          modified = true;
        }
        if (med.minStockLevel === undefined) {
          med.minStockLevel = 20;
          modified = true;
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

/**
 * Defensively retrieves and validates stored JSON data from localStorage.
 * Automatically recovers from corrupted data, wrong types, or syntax errors.
 */
export const getStoredItem = (key, fallback = []) => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;

    const parsed = JSON.parse(item);

    // Schema & type validation to prevent downstream runtime exceptions
    if (Array.isArray(fallback)) {
      if (!Array.isArray(parsed)) {
        // Corrupted shape: expected array but found non-array. Heal storage.
        localStorage.setItem(key, JSON.stringify(fallback));
        return fallback;
      }
      return parsed;
    }

    if (fallback !== null && typeof fallback === 'object' && !Array.isArray(fallback)) {
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        // Corrupted shape: expected object but found invalid type. Heal storage.
        localStorage.setItem(key, JSON.stringify(fallback));
        return fallback;
      }
      return parsed;
    }

    // Special validation for authentication session
    if (key === KEYS.AUTH) {
      if (!parsed || typeof parsed !== 'object') {
        localStorage.removeItem(KEYS.AUTH);
        return null;
      }
      const { user, token } = parsed;
      if (!user || typeof user !== 'object' || typeof token !== 'string' || !token.trim()) {
        localStorage.removeItem(KEYS.AUTH);
        return null;
      }
      if (!['admin', 'hospital'].includes(user.role)) {
        localStorage.removeItem(KEYS.AUTH);
        return null;
      }
      // Guarantee no password or raw secrets in user object
      if (user.password) {
        delete user.password;
      }
      return parsed;
    }

    return parsed;
  } catch {
    // Gracefully handle JSON parse error or storage access violation without crashing
    try {
      if (fallback !== undefined) {
        localStorage.setItem(key, JSON.stringify(fallback));
      }
    } catch {
      // Ignore write errors in restricted/private modes
    }
    return fallback;
  }
};

/**
 * Defensively serializes and persists an item to localStorage.
 * Sanitizes sensitive fields before writing and handles QuotaExceeded errors safely.
 */
export const setStoredItem = (key, value) => {
  try {
    // Strip sensitive fields if writing auth session
    let safeValue = value;
    if (key === KEYS.AUTH && value && typeof value === 'object') {
      const userCopy = value.user ? { ...value.user } : {};
      delete userCopy.password;
      delete userCopy.confirmPassword;
      delete userCopy.secret;
      safeValue = {
        ...value,
        user: userCopy,
        _isDemoSession: true,
        _disclaimer: 'DEMO AUTHENTICATION ONLY - Authoritative backend auth required for production',
      };
    }

    localStorage.setItem(key, JSON.stringify(safeValue));
  } catch (e) {
    // Handle QuotaExceededError or private browsing restrictions
    if (e.name === 'QuotaExceededError' || e.code === 22) {
      // Clean up excess audit trail or non-essential cache if full
      try {
        const trail = JSON.parse(localStorage.getItem(KEYS.AUDIT_TRAIL) || '[]');
        if (trail.length > 50) {
          localStorage.setItem(KEYS.AUDIT_TRAIL, JSON.stringify(trail.slice(0, 50)));
          localStorage.setItem(key, JSON.stringify(value));
        }
      } catch {
        // Fallback silently without breaking UI
      }
    }
  }
};

export const isHospitalSuspended = (hospitalId) => {
  const hospitals = getStoredItem(KEYS.HOSPITALS, []);
  return hospitals.some((hospital) => hospital.id === hospitalId && hospital.status?.toLowerCase() === 'suspended');
};

export { KEYS };
