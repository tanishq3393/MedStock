const documentService = require('../services/documentService');
const { successResponse } = require('../utils/apiResponse');

const documentController = {
  async uploadDocument(req, res, next) {
    try {
      const { hospitalId, documentType, documentName, fileSize } = req.body;
      const uploadedBy = req.user?.name || 'Hospital Administrator';

      const result = await documentService.uploadDocument({
        hospitalId: hospitalId || req.user?.hospitalId,
        documentType,
        documentName: documentName || `${documentType}.pdf`,
        fileSize,
        uploadedBy,
      });

      return successResponse(res, result, 'Document submitted successfully', 201);
    } catch (err) {
      next(err);
    }
  },

  async getSignedUrl(req, res, next) {
    try {
      const { id } = req.params;
      const hospitalId = req.query.hospitalId || req.user?.hospitalId;
      const result = await documentService.getSignedUrl(hospitalId, id);
      return successResponse(res, result, 'Signed URL generated');
    } catch (err) {
      next(err);
    }
  }
};

module.exports = documentController;
