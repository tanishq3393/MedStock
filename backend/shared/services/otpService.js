const crypto = require('crypto');
const { supabaseAdmin, isConfigured } = require('../../config/supabase');
const mailerService = require('./mailerService');
const logger = require('../utils/logger');

// Security Configurations
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_ATTEMPTS = 5; // Invalidate after 5 incorrect tries
const MAX_REQUESTS_PER_HOUR = 5; // Rate limit per email

// In-memory verification registry for fast verification and local sandbox
// Key: normalizedEmail -> { otpHash, expiresAt, attempts, lastSentAt, requestTimestamps: [], verified: boolean }
const verificationStore = new Map();

/**
 * Hashes an OTP with SHA-256
 */
function hashOtp(otp, email) {
  return crypto.createHash('sha256').update(`${email.toLowerCase()}:${otp}`).digest('hex');
}

const otpService = {
  /**
   * Generates, records, and dispatches a real time-limited OTP to the official email
   */
  async sendOtp(rawEmail, ip = 'unknown') {
    if (!rawEmail || typeof rawEmail !== 'string') {
      const err = new Error('A valid official work email address is required.');
      err.statusCode = 422;
      throw err;
    }

    const email = rawEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const err = new Error('Invalid email address format.');
      err.statusCode = 422;
      throw err;
    }

    const now = Date.now();
    let record = verificationStore.get(email);

    if (record) {
      // 1. Enforce Resend Cooldown
      const timeSinceLastSent = now - record.lastSentAt;
      if (timeSinceLastSent < RESEND_COOLDOWN_MS) {
        const remainingSec = Math.ceil((RESEND_COOLDOWN_MS - timeSinceLastSent) / 1000);
        const err = new Error(`Please wait ${remainingSec} seconds before requesting another verification code.`);
        err.statusCode = 429;
        err.code = 'OTP_COOLDOWN_ACTIVE';
        err.remainingSeconds = remainingSec;
        throw err;
      }

      // 2. Enforce Hourly Rate Limit
      const oneHourAgo = now - 60 * 60 * 1000;
      record.requestTimestamps = (record.requestTimestamps || []).filter((t) => t > oneHourAgo);
      if (record.requestTimestamps.length >= MAX_REQUESTS_PER_HOUR) {
        const err = new Error('Too many OTP requests for this email. Please try again later.');
        err.statusCode = 429;
        err.code = 'RATE_LIMIT_EXCEEDED';
        throw err;
      }
    } else {
      record = {
        requestTimestamps: [],
      };
    }

    // 3. Generate Cryptographically Secure 6-digit numeric OTP
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = hashOtp(rawOtp, email);
    const expiresAt = now + OTP_EXPIRY_MS;

    // 4. Update state (invalidating previous OTP)
    record.otpHash = otpHash;
    record.expiresAt = expiresAt;
    record.attempts = 0;
    record.verified = false;
    record.lastSentAt = now;
    record.requestTimestamps.push(now);

    verificationStore.set(email, record);

    // 5. Persist to Supabase DB if available
    if (isConfigured && supabaseAdmin) {
      try {
        await supabaseAdmin.from('email_verifications').insert([{
          email,
          otp_hash: otpHash,
          expires_at: new Date(expiresAt).toISOString(),
          attempts: 0,
          verified: false,
          last_sent_at: new Date(now).toISOString(),
        }]);
      } catch (dbErr) {
        logger.warn('Could not insert email_verifications in Supabase:', dbErr.message);
      }
    }

    // 6. Send Real Email (Never leak OTP in response or production log)
    logger.info(`[OTP] Generated real verification challenge for email ${email}`);
    await mailerService.sendOtpEmail({
      to: email,
      otp: rawOtp,
      expiresInMinutes: Math.round(OTP_EXPIRY_MS / 60000),
    });

    return {
      success: true,
      message: `A 6-digit verification code has been sent to ${email}. Valid for 10 minutes.`,
      cooldownSeconds: Math.round(RESEND_COOLDOWN_MS / 1000),
      expiresInSeconds: Math.round(OTP_EXPIRY_MS / 1000),
    };
  },

  /**
   * Validates submitted OTP
   */
  async verifyOtp(rawEmail, inputOtp) {
    if (!rawEmail || !inputOtp) {
      const err = new Error('Email and verification code are required.');
      err.statusCode = 400;
      throw err;
    }

    const email = rawEmail.trim().toLowerCase();
    const cleanOtp = String(inputOtp).trim();

    if (!/^\d{6}$/.test(cleanOtp)) {
      const err = new Error('Verification code must be exactly 6 digits.');
      err.statusCode = 400;
      throw err;
    }

    const record = verificationStore.get(email);
    const now = Date.now();

    if (!record || !record.otpHash) {
      const err = new Error('No active verification code found for this email. Please request a new code.');
      err.statusCode = 400;
      err.code = 'NO_OTP_FOUND';
      throw err;
    }

    // Check expiration
    if (now > record.expiresAt) {
      verificationStore.delete(email);
      const err = new Error('Verification code has expired. Please request a new code.');
      err.statusCode = 400;
      err.code = 'OTP_EXPIRED';
      throw err;
    }

    // Check attempt limits
    if (record.attempts >= MAX_ATTEMPTS) {
      verificationStore.delete(email);
      const err = new Error('Maximum incorrect attempts exceeded. This code has been invalidated. Please request a new code.');
      err.statusCode = 429;
      err.code = 'MAX_ATTEMPTS_EXCEEDED';
      throw err;
    }

    // Compare hashes using timingSafeEqual
    const computedHash = hashOtp(cleanOtp, email);
    const expectedBuf = Buffer.from(record.otpHash, 'hex');
    const computedBuf = Buffer.from(computedHash, 'hex');

    const isMatch = expectedBuf.length === computedBuf.length && crypto.timingSafeEqual(expectedBuf, computedBuf);

    if (!isMatch) {
      record.attempts += 1;
      const remaining = MAX_ATTEMPTS - record.attempts;
      const err = new Error(`Incorrect verification code. ${remaining} attempt(s) remaining.`);
      err.statusCode = 400;
      err.code = 'INVALID_OTP';
      err.remainingAttempts = remaining;
      throw err;
    }

    // Successful verification
    record.verified = true;
    record.verifiedAt = now;
    // Clear the active OTP hash so it cannot be reused
    record.otpHash = null;

    // Issue tamper-proof verification token
    const verificationToken = crypto.createHmac('sha256', process.env.SUPABASE_ANON_KEY || 'medex-otp-secret')
      .update(`${email}:${now}:verified`)
      .digest('hex');

    record.verificationToken = verificationToken;
    verificationStore.set(email, record);

    if (isConfigured && supabaseAdmin) {
      try {
        await supabaseAdmin
          .from('email_verifications')
          .update({ verified: true })
          .eq('email', email);
      } catch (dbErr) {
        logger.warn('Could not update email_verifications in Supabase:', dbErr.message);
      }
    }

    logger.info(`[OTP] Email verified successfully: ${email}`);

    return {
      success: true,
      verified: true,
      email,
      verificationToken,
      message: 'Email address verified successfully.',
    };
  },

  /**
   * Checks whether an email has been verified and validates its token
   */
  isEmailVerified(rawEmail, verificationToken = null) {
    if (!rawEmail) return false;
    const email = rawEmail.trim().toLowerCase();
    const record = verificationStore.get(email);
    if (!record || !record.verified) return false;

    // Verification expires after 2 hours if registration is not completed
    if (Date.now() - record.verifiedAt > 2 * 60 * 60 * 1000) {
      return false;
    }

    if (verificationToken) {
      return record.verificationToken === verificationToken;
    }

    return true;
  }
};

module.exports = otpService;
