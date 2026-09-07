import { getStoredItem, setStoredItem, KEYS } from './storage';

/**
 * Standardized Audit Trail Service for MediStock / SmartMediShare
 * Captures all critical operations: inventory, requests, competing rejections,
 * payments, logistics milestones, waste disposals, and administrative decisions.
 */
export const auditService = {
  /**
   * Records a compliant audit event in storage
   * @param {object} eventData
   * @param {string} eventData.action - Action identifier e.g. 'REQUEST_ACCEPTED', 'COMPETING_REQUESTS_REJECTED'
   * @param {string} eventData.entityType - 'INVENTORY' | 'REQUEST' | 'PAYMENT' | 'TRANSFER' | 'WASTE' | 'VERIFICATION'
   * @param {string} eventData.entityId - ID of affected entity
   * @param {string} eventData.hospitalId - ID of hospital initiating or affected
   * @param {string} eventData.hospitalName - Name of hospital
   * @param {string} [eventData.partnerHospitalId] - Second party hospital ID
   * @param {string} [eventData.partnerHospitalName] - Second party hospital name
   * @param {string} eventData.summary - Human-readable explanation of WHAT happened
   * @param {string} eventData.resultingStatus - Outcome status
   * @param {object} [eventData.metadata] - Extra data (quantities, amounts, reason)
   * @returns {object} The logged audit event
   */
  logEvent({
    action,
    entityType,
    entityId,
    hospitalId,
    hospitalName,
    partnerHospitalId = null,
    partnerHospitalName = null,
    summary,
    resultingStatus,
    metadata = {},
  }) {
    const auditTrail = getStoredItem(KEYS.AUDIT_TRAIL, []);

    const newEvent = {
      id: 'audit-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString(),
      action,
      entityType,
      entityId,
      hospitalId,
      hospitalName: hospitalName || 'Hospital Facility',
      partnerHospitalId,
      partnerHospitalName,
      summary,
      resultingStatus,
      metadata,
    };

    auditTrail.unshift(newEvent);
    // Keep last 500 audit events in local demo storage
    if (auditTrail.length > 500) {
      auditTrail.length = 500;
    }
    setStoredItem(KEYS.AUDIT_TRAIL, auditTrail);
    return newEvent;
  },

  /**
   * Retrieves audit events for a specific hospital or for platform administration
   * @param {string|null} hospitalId - If null, returns all audit entries (admin view)
   * @param {object} filters - Optional category or search filter
   * @returns {Array} Filtered audit events
   */
  getAuditTrail(hospitalId = null, filters = {}) {
    const auditTrail = getStoredItem(KEYS.AUDIT_TRAIL, []);
    let results = auditTrail;

    if (hospitalId && hospitalId !== 'admin') {
      results = results.filter(
        (e) => e.hospitalId === hospitalId || e.partnerHospitalId === hospitalId
      );
    }

    if (filters.entityType && filters.entityType !== 'all') {
      results = results.filter((e) => e.entityType === filters.entityType);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(
        (e) =>
          e.summary.toLowerCase().includes(q) ||
          e.entityId?.toLowerCase().includes(q) ||
          e.hospitalName?.toLowerCase().includes(q) ||
          e.action?.toLowerCase().includes(q)
      );
    }

    return results;
  },
};
