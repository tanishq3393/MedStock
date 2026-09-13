const inventoryService = require('./inventoryService');
const requestService = require('./requestService');

const alertStateMap = new Map();

const alertService = {
  /**
   * Scans institutional inventory and requisitions to generate active alerts
   * with guaranteed stable target IDs for deep linking.
   */
  async getHospitalAlerts(hospitalId) {
    if (!hospitalId) return [];

    const inventory = await inventoryService.getInventory({ hospitalId });
    const incomingRequests = await requestService.getRequests({ hospitalId, type: 'incoming', status: 'pending' });

    const alerts = [];
    const now = new Date();

    // 1. Inventory Alerts (Expired, Near-Expiry, Low Stock)
    for (const item of inventory) {
      const expDate = new Date(item.expiryDate);
      const daysRemaining = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));
      const qty = item.availableQuantity !== undefined ? item.availableQuantity : item.quantity;
      const minStock = item.minStockLevel || 20;

      // Expired Stock (Critical)
      if (daysRemaining <= 0) {
        const alertId = `alert-exp-${item.id}`;
        if (!alertStateMap.get(`${alertId}:dismissed`)) {
          alerts.push({
            id: alertId,
            group: 'critical',
            severity: 'CRITICAL',
            category: 'EXPIRED_STOCK',
            title: `Expired Stock Alert: ${item.medicineName}`,
            description: `Batch ${item.batchNo} (${qty} units) has passed its statutory expiry date. Immediate quarantine required.`,
            link: `/hospital/inventory?inventoryId=${encodeURIComponent(item.id)}&batchNo=${encodeURIComponent(item.batchNo)}`,
            actionText: 'Inspect Inventory',
            urgent: true,
            sourceId: item.id,
            targetType: 'inventory',
            inventoryId: item.id,
            lotId: item.id,
            batchId: item.batchNo,
            batchNo: item.batchNo,
            hospitalId,
            medicineId: item.medicineId || item.id,
            medicineName: item.medicineName,
            isRead: Boolean(alertStateMap.get(`${alertId}:read`)),
            createdAt: item.mfgDate || new Date().toISOString(),
          });
        }
      } else if (daysRemaining <= 60) {
        // Expiring Soon (Warning / Action)
        const alertId = `alert-near-${item.id}`;
        if (!alertStateMap.get(`${alertId}:dismissed`)) {
          alerts.push({
            id: alertId,
            group: 'action',
            severity: 'WARNING',
            category: 'EXPIRING_SOON',
            title: `Expiring Soon: ${item.medicineName}`,
            description: `${qty} units expire in ${daysRemaining} days. Shelf-life concession active to prioritize peer hospital redistribution.`,
            link: `/hospital/inventory?inventoryId=${encodeURIComponent(item.id)}&batchNo=${encodeURIComponent(item.batchNo)}`,
            actionText: 'View in Inventory',
            urgent: daysRemaining <= 30,
            sourceId: item.id,
            targetType: 'inventory',
            inventoryId: item.id,
            lotId: item.id,
            batchId: item.batchNo,
            batchNo: item.batchNo,
            hospitalId,
            medicineId: item.medicineId || item.id,
            medicineName: item.medicineName,
            isRead: Boolean(alertStateMap.get(`${alertId}:read`)),
            createdAt: new Date().toISOString(),
          });
        }
      }

      // Low Stock Warning
      if (qty <= minStock && daysRemaining > 0) {
        const alertId = `alert-low-${item.id}`;
        if (!alertStateMap.get(`${alertId}:dismissed`)) {
          alerts.push({
            id: alertId,
            group: 'action',
            severity: 'ACTION',
            category: 'LOW_STOCK',
            title: `Low Stock Warning: ${item.medicineName}`,
            description: `Current reserve is ${qty} units (below threshold ${minStock}). Reorder or request replenishment from peer hospitals.`,
            link: `/hospital/inventory?inventoryId=${encodeURIComponent(item.id)}&batchNo=${encodeURIComponent(item.batchNo)}`,
            actionText: 'Inspect Lot',
            urgent: false,
            sourceId: item.id,
            targetType: 'inventory',
            inventoryId: item.id,
            lotId: item.id,
            batchId: item.batchNo,
            batchNo: item.batchNo,
            hospitalId,
            medicineId: item.medicineId || item.id,
            medicineName: item.medicineName,
            isRead: Boolean(alertStateMap.get(`${alertId}:read`)),
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    // 2. Incoming Requisition Action Alerts
    for (const req of incomingRequests) {
      const alertId = `alert-req-${req.id}`;
      if (!alertStateMap.get(`${alertId}:dismissed`)) {
        alerts.push({
          id: alertId,
          group: 'action',
          severity: req.urgency === 'Emergency' ? 'CRITICAL' : 'ACTION',
          category: 'INCOMING_REQUEST',
          title: `Incoming Requisition: ${req.medicineName}`,
          description: `${req.fromHospitalName} requested ${req.quantity} units (${req.urgency || 'Standard Routine'}). Respond within SLA deadline.`,
          link: `/hospital/requests`,
          actionText: 'Review Requisition',
          urgent: req.urgency === 'Emergency',
          sourceId: req.id,
          targetType: 'request',
          requestId: req.id,
          hospitalId,
          medicineName: req.medicineName,
          isRead: Boolean(alertStateMap.get(`${alertId}:read`)),
          createdAt: req.requestDate || new Date().toISOString(),
        });
      }
    }

    return alerts;
  },

  markAlertRead(alertId) {
    alertStateMap.set(`${alertId}:read`, true);
    return { id: alertId, isRead: true };
  },

  dismissAlert(alertId) {
    alertStateMap.set(`${alertId}:dismissed`, true);
    return { id: alertId, isDismissed: true };
  }
};

module.exports = alertService;
