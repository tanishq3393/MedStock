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
  if (!localStorage.getItem(KEYS.MEDICINES)) {
    localStorage.setItem(KEYS.MEDICINES, JSON.stringify(INITIAL_MEDICINES));
  }
  if (!localStorage.getItem(KEYS.REQUESTS)) {
    localStorage.setItem(KEYS.REQUESTS, JSON.stringify(INITIAL_REQUESTS));
  }
  if (!localStorage.getItem(KEYS.TRACKING)) {
    localStorage.setItem(KEYS.TRACKING, JSON.stringify(INITIAL_TRACKING));
  }
  if (!localStorage.getItem(KEYS.PAYMENTS)) {
    localStorage.setItem(KEYS.PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
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

export { KEYS };
