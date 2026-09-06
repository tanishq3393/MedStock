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
};

// Initialize localStorage with mock data if not present
export const initializeStorage = () => {
  if (!localStorage.getItem(KEYS.HOSPITALS)) {
    localStorage.setItem(KEYS.HOSPITALS, JSON.stringify(INITIAL_HOSPITALS));
  }
  const storedMedicines = localStorage.getItem(KEYS.MEDICINES);
  if (!storedMedicines) {
    localStorage.setItem(KEYS.MEDICINES, JSON.stringify(INITIAL_MEDICINES));
  } else {
    try {
      const parsed = JSON.parse(storedMedicines);
      let modified = false;
      const updated = parsed.map((m) => {
        if (!m.mfgDate) {
          modified = true;
          const match = INITIAL_MEDICINES.find((init) => init.id === m.id);
          if (match && match.mfgDate) {
            return { ...m, mfgDate: match.mfgDate };
          }
          if (m.expiryDate) {
            const d = new Date(m.expiryDate);
            d.setFullYear(d.getFullYear() - 1);
            return { ...m, mfgDate: d.toISOString().split('T')[0] };
          }
          return { ...m, mfgDate: '2023-11-15' };
        }
        return m;
      });
      if (modified) {
        localStorage.setItem(KEYS.MEDICINES, JSON.stringify(updated));
      }
    } catch (e) {
      console.error('Failed to migrate medicines mfgDate', e);
    }
  }
  if (!localStorage.getItem(KEYS.REQUESTS)) {
    localStorage.setItem(KEYS.REQUESTS, JSON.stringify(INITIAL_REQUESTS));
  }
  if (!localStorage.getItem(KEYS.TRACKING)) {
    localStorage.setItem(KEYS.TRACKING, JSON.stringify(INITIAL_TRACKING));
  }
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
  if (!localStorage.getItem(KEYS.DISPOSALS)) {
    localStorage.setItem(KEYS.DISPOSALS, JSON.stringify(INITIAL_DISPOSALS));
  }
  if (!localStorage.getItem(KEYS.FEEDBACKS)) {
    localStorage.setItem(KEYS.FEEDBACKS, JSON.stringify(INITIAL_FEEDBACKS));
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
