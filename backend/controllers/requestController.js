const requestService = require('../services/requestService');
const { successResponse } = require('../utils/apiResponse');

const requestController = {
  async getRequests(req, res, next) {
    try {
      const hospitalId = req.user?.role === 'admin' ? (req.query.hospitalId || null) : req.user?.hospitalId;
      const { type, status } = req.query;

      const requests = await requestService.getRequests({
        hospitalId,
        type,
        status,
      });

      return successResponse(res, requests, 'Requisitions retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  async createRequest(req, res, next) {
    try {
      const fromHospitalId = req.body.fromHospitalId || req.user?.hospitalId;
      const fromHospitalName = req.body.fromHospitalName || req.user?.name;

      const result = await requestService.createRequest({
        ...req.body,
        fromHospitalId,
        fromHospitalName,
      });

      return successResponse(res, result, 'Requisition created successfully', 201);
    } catch (err) {
      next(err);
    }
  },

  async respondToRequest(req, res, next) {
    try {
      const { id } = req.params;
      const { action, reason } = req.body;

      const result = await requestService.handleRequest({
        requestId: id,
        action,
        reason,
        hospitalId: req.user?.hospitalId,
      });

      return successResponse(res, result, `Requisition ${action}ed successfully`);
    } catch (err) {
      next(err);
    }
  },

  async cancelRequest(req, res, next) {
    try {
      const { id } = req.params;
      const { reason, note } = req.body;

      const result = await requestService.cancelRequest({
        requestId: id,
        reason,
        note,
        hospitalId: req.user?.hospitalId,
      });

      return successResponse(res, result, 'Requisition cancelled and refund processed');
    } catch (err) {
      next(err);
    }
  }
};

module.exports = requestController;
