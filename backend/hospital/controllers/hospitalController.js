const hospitalService = require('../services/hospitalService');
const environment = require('../../config/environment');
const { successResponse } = require('../../shared/utils/apiResponse');

const hospitalController = {
  /**
   * GET /api/hospitals/registration/config
   * Returns registration feature flags (e.g. email verification requirement)
   */
  getRegistrationConfig(req, res) {
    return successResponse(res, {
      emailVerificationRequired: Boolean(environment.features?.emailVerificationRequired),
    }, 'Registration configuration retrieved');
  },

  /**
   * POST /api/hospitals/registration/step-1
   */
  async saveStep1(req, res, next) {
    try {
      const result = await hospitalService.saveStep1(req.body);
      return successResponse(res, result, result.message, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/hospitals/registration/step-2
   */
  async saveStep2(req, res, next) {
    try {
      const result = await hospitalService.saveStep2(req.body);
      return successResponse(res, result, result.message, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/hospitals/registration/upload-document
   */
  async uploadRegistrationDocument(req, res, next) {
    try {
      const hospitalId = req.body?.hospitalId;
      const documentType = req.body?.documentType;
      const documentNumber = req.body?.documentNumber;
      const issuingAuthority = req.body?.issuingAuthority;
      const issueDate = req.body?.issueDate;
      const expiryDate = req.body?.expiryDate;
      const customDocumentName = req.body?.customDocumentName;

      let fileBuffer = null;
      let originalFilename = null;
      let mimeType = 'application/pdf';

      if (req.file) {
        fileBuffer = req.file.buffer;
        originalFilename = req.file.originalname;
        mimeType = req.file.mimetype || 'application/pdf';
      } else if (req.body?.fileData || req.body?.fileBase64) {
        const rawData = req.body.fileData || req.body.fileBase64;
        originalFilename = req.body.documentName || req.body.originalFilename || `${documentType}.pdf`;
        const matches = typeof rawData === 'string' ? rawData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/) : null;
        if (matches) {
          mimeType = matches[1];
          fileBuffer = Buffer.from(matches[2], 'base64');
        } else if (typeof rawData === 'string') {
          fileBuffer = Buffer.from(rawData, 'base64');
        } else if (Buffer.isBuffer(rawData)) {
          fileBuffer = rawData;
        }
      }

      const result = await hospitalService.uploadRegistrationDocument({
        hospitalId,
        documentType,
        documentNumber,
        issuingAuthority,
        issueDate,
        expiryDate,
        customDocumentName,
        fileBuffer,
        mimeType,
        originalFilename,
      });

      return successResponse(res, result, 'Document uploaded successfully', 201);
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/hospitals/registration/documents/:documentId
   */
  async deleteRegistrationDocument(req, res, next) {
    try {
      const { documentId } = req.params;
      const hospitalId = req.query?.hospitalId || req.body?.hospitalId || req.headers['x-hospital-id'];
      const result = await hospitalService.deleteRegistrationDocument(hospitalId, documentId);
      return successResponse(res, result, result.message);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/hospitals/registration/documents
   */
  async getRegistrationDocuments(req, res, next) {
    try {
      const hospitalId = req.query?.hospitalId || req.params?.hospitalId;
      const docs = await hospitalService.getRegistrationDocuments(hospitalId);
      return successResponse(res, docs, 'Registration documents retrieved');
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/hospitals/registration/documents/:documentId/view
   * Generates time-limited signed URL for viewing uploaded registration document.
   */
  async getRegistrationDocumentViewUrl(req, res, next) {
    try {
      const { documentId } = req.params;
      const hospitalId = req.query?.hospitalId || req.headers['x-hospital-id'] || req.user?.hospitalId;
      const expiresIn = parseInt(req.query?.expiresIn, 10) || 900;

      // If user is authenticated, ensure they cannot view documents belonging to another hospital (unless admin)
      if (req.user && req.user.role === 'hospital' && req.user.hospitalId && req.user.hospitalId !== hospitalId) {
        return errorResponse(res, 'Access restricted: You cannot view documents belonging to another hospital.', 403, 'UNAUTHORIZED_DOCUMENT_ACCESS');
      }

      const result = await hospitalService.getRegistrationDocumentViewUrl(hospitalId, documentId, expiresIn);
      return successResponse(res, result, 'Document viewing URL generated successfully');
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/hospitals/registration/documents/:documentId/raw
   * Streams PDF document inline with application/pdf header (fallback/direct streaming).
   */
  async streamRegistrationDocument(req, res, next) {
    try {
      const { documentId } = req.params;
      const hospitalId = req.query?.hospitalId || req.headers['x-hospital-id'] || req.user?.hospitalId;

      const fileData = await hospitalService.getRegistrationDocumentBuffer(hospitalId, documentId);
      res.setHeader('Content-Type', fileData.mimeType || 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${fileData.filename}"`);
      return res.send(fileData.buffer);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/hospitals/registration/submit
   */
  async submitRegistration(req, res, next) {
    try {
      const { hospitalId, password, confirmPassword } = req.body;
      const result = await hospitalService.submitRegistration(hospitalId, { password, confirmPassword });
      return successResponse(res, result, result.message, 201);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/hospitals/registration/status
   */
  async getRegistrationStatus(req, res, next) {
    try {
      const identifier = req.query?.identifier || req.query?.hospitalId || req.query?.email;
      const result = await hospitalService.getRegistrationStatus(identifier);
      return successResponse(res, result, 'Hospital registration status retrieved');
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/hospitals/registration/resubmit
   */
  async resubmitRegistration(req, res, next) {
    try {
      const hospitalId = req.params?.id || req.body?.hospitalId;
      const result = await hospitalService.resubmitRegistration(hospitalId, req.body);
      return successResponse(res, result, result.message);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/hospitals/register (legacy / direct fallback)
   */
  async registerHospital(req, res, next) {
    try {
      const result = await hospitalService.registerHospital(req.body, req.user || null);
      return successResponse(res, result, result.message, 201);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/hospitals/me
   * Returns current authenticated hospital user's institutional profile
   */
  async getMyHospital(req, res, next) {
    try {
      const hospital = await hospitalService.getMyHospitalProfile(req.user);
      return successResponse(res, hospital, 'Hospital profile retrieved');
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/hospitals/me
   * Updates current hospital's contact/location details safely
   */
  async updateMyHospital(req, res, next) {
    try {
      const updated = await hospitalService.updateMyHospitalProfile(req.user, req.body);
      return successResponse(res, updated, 'Hospital profile updated successfully');
    } catch (err) {
      next(err);
    }
  },

  /**
   * Operational gate testing endpoint
   */
  async getOperationalTest(req, res, next) {
    try {
      return successResponse(res, {
        accessible: true,
        authorized: true,
        status: req.hospital?.status || 'APPROVED',
        hospital: req.hospital,
        message: 'Operational hospital resource accessed successfully.',
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Onboarding/Pending gate testing endpoint
   */
  async getPendingTest(req, res, next) {
    try {
      return successResponse(res, {
        accessible: true,
        authorized: true,
        status: req.hospital?.status || 'PENDING_APPROVAL',
        hospital: req.hospital,
        message: 'Onboarding resource accessible by pending institution.',
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Legacy / Admin operations
   */
  async suspendHospital(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const result = await hospitalService.suspendHospital(id, reason, req.user?.name);
      return successResponse(res, result, 'Hospital operational privileges suspended');
    } catch (err) {
      next(err);
    }
  },

  async reactivateHospital(req, res, next) {
    try {
      const { id } = req.params;
      const result = await hospitalService.reactivateHospital(id, req.user?.name);
      return successResponse(res, result, 'Hospital operational privileges reactivated');
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/hospitals
   * Returns directory of approved/verified hospitals for network collaboration
   */
  async getApprovedHospitals(req, res, next) {
    try {
      const { search, state, city } = req.query;
      const result = await hospitalService.getApprovedHospitals({ search, state, city });
      const data = Array.isArray(result) ? result : (result.hospitals || []);
      return successResponse(res, data, 'Approved hospital directory retrieved');
    } catch (err) {
      next(err);
    }
  }
};

module.exports = hospitalController;
