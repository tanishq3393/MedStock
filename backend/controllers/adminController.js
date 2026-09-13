const verificationService = require('../services/verificationService');
const hospitalService = require('../services/hospitalService');
const inventoryService = require('../services/inventoryService');
const { successResponse } = require('../utils/apiResponse');

const adminController = {
  /**
   * GET /api/admin/hospitals/pending
   * Returns only hospitals awaiting admin verification
   */
  async getPendingHospitals(req, res, next) {
    try {
      const pendingList = await verificationService.getPendingHospitals();
      return successResponse(res, pendingList, 'Pending hospital registrations retrieved');
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/admin/hospitals/:id/verification
   * Returns complete registration dossier and exact submitted documents
   */
  async getHospitalVerificationDossier(req, res, next) {
    try {
      const { id } = req.params;
      const dossier = await verificationService.getHospitalVerificationDossier(id);
      return successResponse(res, dossier, 'Hospital verification dossier retrieved');
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/admin/hospitals/:id/approve
   * Approves hospital and grants operational network access
   */
  async approveHospital(req, res, next) {
    try {
      const { id } = req.params;
      const result = await verificationService.approveHospital(id, req.user);
      return successResponse(res, result, result.message);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/admin/hospitals/:id/reject
   * Rejects hospital with mandatory statutory justification
   */
  async rejectHospital(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const result = await verificationService.rejectHospital(id, reason, req.user);
      return successResponse(res, result, result.message);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/admin/hospitals/:id/review-status
   * Updates intermediate review status and administrative internal note
   */
  async setReviewStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, note } = req.body;
      const result = await verificationService.setReviewStatus(id, status, note, req.user);
      return successResponse(res, result, 'Verification review status updated');
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/admin/hospitals/:hospitalId/documents/:documentId/verify
   * Verifies an individual statutory document
   */
  async verifyDocument(req, res, next) {
    try {
      const { hospitalId, documentId } = req.params;
      const result = await verificationService.verifyHospitalDocument(hospitalId, documentId, req.user);
      return successResponse(res, result, 'Statutory document verified');
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/admin/hospitals/:hospitalId/documents/:documentId/reject
   * Rejects an individual statutory document with specific reason
   */
  async rejectDocument(req, res, next) {
    try {
      const { hospitalId, documentId } = req.params;
      const { reason } = req.body;
      const result = await verificationService.rejectHospitalDocument(hospitalId, documentId, reason, req.user);
      return successResponse(res, result, 'Statutory document rejected');
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/admin/hospitals
   * Returns APPROVED hospitals only (Approved Directory)
   * Strictly filters out pending and rejected hospitals.
   */
  async getApprovedHospitals(req, res, next) {
    try {
      const result = await hospitalService.getApprovedHospitals(req.query);
      return successResponse(res, result, 'Approved hospital directory retrieved');
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/admin/hospitals/:id
   * Returns details for an approved hospital (profile, documents, metrics)
   */
  async getApprovedHospitalDetails(req, res, next) {
    try {
      const { id } = req.params;
      const hospital = await hospitalService.getApprovedHospitalDetails(id);
      return successResponse(res, hospital, 'Approved hospital details retrieved');
    } catch (err) {
      next(err);
    }
  },

  // =========================================================================
  // ADMIN INVENTORY DUAL HIERARCHIES
  // =========================================================================

  /**
   * GET /api/admin/inventory/by-medicine
   * Hierarchy 1 Level 1: Aggregated inventory by Medicine
   */
  async getInventoryByMedicine(req, res, next) {
    try {
      const { search, category, dosageForm } = req.query;
      const result = await inventoryService.getAdminInventoryByMedicine({ search, category, dosageForm });
      return successResponse(res, result, 'Admin inventory by medicine retrieved');
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/admin/inventory/by-medicine/:medicineId/contributors
   * Hierarchy 1 Level 2: Contributing hospitals for a medicine
   */
  async getMedicineContributors(req, res, next) {
    try {
      const { medicineId } = req.params;
      const result = await inventoryService.getMedicineContributors(medicineId);
      return successResponse(res, result, 'Medicine contributing hospitals retrieved');
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/admin/inventory/by-medicine/:medicineId/hospitals/:hospitalId/batches
   * Hierarchy 1 Level 3: Batches for a specific medicine at a specific hospital
   */
  async getMedicineHospitalBatches(req, res, next) {
    try {
      const { medicineId, hospitalId } = req.params;
      const result = await inventoryService.getMedicineHospitalBatches(medicineId, hospitalId);
      return successResponse(res, result, 'Hospital medicine batches retrieved');
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/admin/inventory/by-hospital
   * Hierarchy 2 Level 1: Aggregated inventory by Hospital
   */
  async getInventoryByHospital(req, res, next) {
    try {
      const { search, city } = req.query;
      const result = await inventoryService.getAdminInventoryByHospital({ search, city });
      return successResponse(res, result, 'Admin inventory by hospital retrieved');
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/admin/inventory/by-hospital/:hospitalId/medicines
   * Hierarchy 2 Level 2: Medicines available at a hospital
   */
  async getHospitalMedicines(req, res, next) {
    try {
      const { hospitalId } = req.params;
      const result = await inventoryService.getHospitalMedicines(hospitalId);
      return successResponse(res, result, 'Hospital medicines retrieved');
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/admin/inventory/by-hospital/:hospitalId/medicines/:medicineId/batches
   * Hierarchy 2 Level 3: Batches for a specific medicine at a hospital
   */
  async getHospitalMedicineBatches(req, res, next) {
    try {
      const { hospitalId, medicineId } = req.params;
      const result = await inventoryService.getHospitalMedicineBatches(hospitalId, medicineId);
      return successResponse(res, result, 'Hospital medicine batches retrieved');
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/admin/inventory/batches/:batchId
   * Admin batch inspection with exact Purchase Bill
   */
  async getBatchDetail(req, res, next) {
    try {
      const { batchId } = req.params;
      const result = await inventoryService.getBatchDetail(batchId);
      return successResponse(res, result, 'Batch details and purchase bill retrieved');
    } catch (err) {
      next(err);
    }
  },
};

module.exports = adminController;
