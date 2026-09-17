import { API_BASE_URL } from '../config/api';

const BASE_URL = `${API_BASE_URL}/admin/registration`;

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.error || data?.message || `HTTP error ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const adminRegistrationService = {
  /**
   * Retrieves runtime configuration (feature flags)
   */
  async getConfig() {
    try {
      const res = await fetch(`${BASE_URL}/config`);
      const data = await handleResponse(res);
      return data.data || { emailVerificationRequired: false };
    } catch {
      return {
        emailVerificationRequired: import.meta.env.VITE_EMAIL_VERIFICATION_REQUIRED === 'true',
      };
    }
  },

  /**
   * Checks if User ID is available
   */
  async checkUsername(username) {
    const res = await fetch(`${BASE_URL}/check-username`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    const data = await handleResponse(res);
    return data.data;
  },

  /**
   * Checks if Email is available
   */
  async checkEmail(email) {
    const res = await fetch(`${BASE_URL}/check-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await handleResponse(res);
    return data.data;
  },

  /**
   * Sends OTP to official work email
   */
  async sendOtp(email) {
    const res = await fetch(`${BASE_URL}/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await handleResponse(res);
    return data.data;
  },

  /**
   * Verifies OTP code
   */
  async verifyOtp(email, otp) {
    const res = await fetch(`${BASE_URL}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    const data = await handleResponse(res);
    return data.data;
  },

  /**
   * Uploads statutory authorization letter (PDF <= 5MB)
   */
  async uploadAuthorizationLetter(file) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${BASE_URL}/upload-letter`, {
      method: 'POST',
      body: formData,
    });
    const data = await handleResponse(res);
    return data.data;
  },

  /**
   * Submits full 4-step administrator registration
   */
  async submitRegistration(registrationData) {
    const res = await fetch(`${BASE_URL}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registrationData),
    });
    const data = await handleResponse(res);
    return data.data;
  },
};

export default adminRegistrationService;
