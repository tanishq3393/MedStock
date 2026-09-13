const inventoryService = require('../services/inventoryService');
const { successResponse } = require('../utils/apiResponse');

const marketplaceController = {
  async getMarketplace(req, res, next) {
    try {
      const currentHospitalId = req.user?.hospitalId;
      const { search, dosageForm } = req.query;

      const listings = await inventoryService.getMarketplace({
        currentHospitalId,
        search,
        dosageForm,
      });

      return successResponse(res, listings, 'Marketplace listings retrieved');
    } catch (err) {
      next(err);
    }
  }
};

module.exports = marketplaceController;
