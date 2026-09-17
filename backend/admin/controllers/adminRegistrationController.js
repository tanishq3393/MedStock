const adminRegistrationService = require('../services/adminRegistrationService');
const otpService = require('../../shared/services/otpService');
const { successResponse, errorResponse } = require('../../shared/utils/apiResponse');

const adminRegistrationController = {
  /**
   * GET /api/admin/registration/config
   * Returns feature flags (e.g. emailVerificationRequired)
   */
  getConfig(req, res) {
    const config = adminRegistrationService.getConfig();
    return successResponse(res, config, 'Registration configuration retrieved');
  },

  /**
   * POST /api/admin/registration/check-username
   * Checks if User ID is available
   */
  async checkUsername(req, res, next) {
    try {
      const username = req.body?.username || req.body?.userId;
      const result = await adminRegistrationService.checkUsername(username);
      return successResponse(res, result, result.message);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/admin/registration/check-email
   * Checks if email is available
   */
  async checkEmail(req, res, next) {
    try {
      const email = req.body?.email;
      const result = await adminRegistrationService.checkEmail(email);
      return successResponse(res, result, result.message);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/admin/registration/send-otp
   * Sends 6-digit OTP to administrator work email
   */
  async sendOtp(req, res, next) {
    try {
      const email = req.body?.email;
      const ip = req.ip || req.connection?.remoteAddress;
      const result = await otpService.sendOtp(email, ip);
      return successResponse(res, result, 'Verification code dispatched to official work email.');
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/admin/registration/verify-otp
   * Verifies 6-digit OTP and returns verification token
   */
  async verifyOtp(req, res, next) {
    try {
      const { email, otp } = req.body;
      const result = await otpService.verifyOtp(email, otp);
      return successResponse(res, result, 'Official work email verified successfully.');
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/admin/registration/upload-letter
   * Handles Multer upload for statutory Authorization Letter
   */
  async uploadAuthorizationLetter(req, res, next) {
    try {
      let fileBuffer = null;
      let originalFilename = null;
      let mimeType = 'application/pdf';

      if (req.file) {
        fileBuffer = req.file.buffer;
        originalFilename = req.file.originalname;
        mimeType = req.file.mimetype || 'application/pdf';
      } else if (req.body?.fileBase64) {
        let base64Clean = req.body.fileBase64;
        if (base64Clean.includes(',')) {
          base64Clean = base64Clean.split(',')[1];
        }
        fileBuffer = Buffer.from(base64Clean, 'base64');
        originalFilename = req.body.documentName || req.body.fileName || 'Authorization_Letter.pdf';
        mimeType = req.body.mimeType || 'application/pdf';
      }

      if (!fileBuffer || fileBuffer.length === 0) {
        return errorResponse(res, 'No document file provided for authorization letter upload.', 400, 'NO_FILE');
      }

      const docRecord = await adminRegistrationService.uploadAuthorizationLetter({
        fileBuffer,
        originalFilename,
        mimeType,
      });

      return successResponse(res, docRecord, 'Authorization letter uploaded and verified.', 201);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/admin/registration/submit
   * Submits full 4-step Administrator Registration
   */
  async submitRegistration(req, res, next) {
    try {
      const result = await adminRegistrationService.submitRegistration(req.body);
      return successResponse(res, result, result.message, 201);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = adminRegistrationController;
