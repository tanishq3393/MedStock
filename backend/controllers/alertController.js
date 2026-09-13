const alertService = require('../services/alertService');
const { successResponse } = require('../utils/apiResponse');

const alertController = {
  async getAlerts(req, res, next) {
    try {
      const hospitalId = req.query.hospitalId || req.user?.hospitalId;
      const alerts = await alertService.getHospitalAlerts(hospitalId);
      return successResponse(res, alerts, 'Active alerts retrieved');
    } catch (err) {
      next(err);
    }
  },

  async markRead(req, res, next) {
    try {
      const { id } = req.params;
      const result = alertService.markAlertRead(id);
      return successResponse(res, result, 'Alert marked as read');
    } catch (err) {
      next(err);
    }
  },

  async dismiss(req, res, next) {
    try {
      const { id } = req.params;
      const result = alertService.dismissAlert(id);
      return successResponse(res, result, 'Alert dismissed');
    } catch (err) {
      next(err);
    }
  }
};

module.exports = alertController;
