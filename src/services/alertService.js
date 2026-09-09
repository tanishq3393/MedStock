import { getStoredItem, setStoredItem, KEYS } from './storage';
import { calculateMedicineExpiry, calculateRequestExpiry } from '../utils/expiryUtils';

/**
 * Alert service manages active and historical alerts with stable IDs,
 * read/unread state, active/dismissed state, grouped categories (Critical, Action, Info),
 * and severity levels for the central notification center.
 */
export const alertService = {
  /**
   * Scans hospital records and returns current alerts.
   * Resolves expired inventory alerts once disposed.
   * Preserves read/dismissed preferences per alert ID.
   * @param {string} hospitalId 
   * @returns {Array} List of active, non-dismissed alerts
   */
  getHospitalAlerts(hospitalId) {
    if (!hospitalId) return [];

    const storedAlertMeta = getStoredItem(KEYS.ALERTS, {});
    const rawMedicines = getStoredItem(KEYS.MEDICINES, []);
    const medicines = rawMedicines.filter((m) => m.hospitalId === hospitalId || !m.hospitalId);
    const requests = getStoredItem(KEYS.REQUESTS, []);
    const incomingRequests = requests.filter((r) => r.toHospitalId === hospitalId || !r.toHospitalId);
    const outgoingRequests = requests.filter((r) => r.fromHospitalId === hospitalId);
    const disposals = getStoredItem(KEYS.DISPOSALS, []).filter((d) => d.hospitalId === hospitalId || !d.hospitalId);
    const trackingList = getStoredItem(KEYS.TRACKING, []).filter(
      (t) => t.senderHospitalId === hospitalId || t.receiverHospitalId === hospitalId || t.senderHospital?.includes(hospitalId) || t.receiverHospital?.includes(hospitalId)
    );

    const generatedAlerts = [];
    const now = new Date();

    // 1. Critical & Warning: Expired, Near-Expiry, Low Stock
    medicines.forEach((med) => {
      const expDate = med.expiryDate;
      const mfgDate = med.mfgDate;
      const qty = med.quantity ?? med.usableStock ?? 0;
      const medName = med.brandName || med.medicineName || med.name || 'Medicine Lot';
      const exp = calculateMedicineExpiry(expDate, mfgDate, qty);

      const hasDisposal = disposals.some(
        (d) => d.medicineId === med.id || (d.batchNo && d.batchNo === (med.batchNo || med.batch))
      );

      if (exp.isExpired || med.disposalStatus === 'EXPIRED') {
        if (!hasDisposal && med.disposalStatus !== 'DISPOSAL REQUESTED' && med.disposalStatus !== 'DISPOSED') {
          generatedAlerts.push({
            id: `alert-exp-${med.id}`,
            group: 'critical',
            severity: 'CRITICAL',
            category: 'EXPIRED_STOCK',
            title: `Expired Stock Alert: ${medName}`,
            desc: `Batch ${med.batchNo || med.batch || 'N/A'} (${qty} units) has passed its statutory expiry date. Immediate quarantine and bio-waste manifest required.`,
            link: '/hospital/waste-management',
            actionText: 'Initiate Disposal',
            timestamp: new Date(now.getTime() - 25 * 60000).toISOString(),
            urgent: true,
            sourceId: med.id,
          });
        }
      } else if (exp.isNearExpiry) {
        generatedAlerts.push({
          id: `alert-near-${med.id}`,
          group: 'action',
          severity: 'WARNING',
          category: 'EXPIRING_SOON',
          title: `Expiring Soon: ${medName}`,
          desc: `${qty} units expire in ${exp.daysRemaining} days. Shelf-life concession active to prioritize redistribution to partner hospitals.`,
          link: '/hospital/inventory',
          actionText: 'View in Inventory',
          timestamp: new Date(now.getTime() - 95 * 60000).toISOString(),
          urgent: exp.daysRemaining <= 30,
          sourceId: med.id,
        });
      }

      if (exp.isLowStock && !exp.isExpired) {
        generatedAlerts.push({
          id: `alert-low-${med.id}`,
          group: 'action',
          severity: 'ACTION',
          category: 'LOW_STOCK',
          title: `Low Stock Warning: ${medName}`,
          desc: `Current reserve is ${qty} units (below threshold). Reorder or request replenishment from peer hospitals.`,
          link: '/hospital/marketplace',
          actionText: 'Find Stock in Market',
          timestamp: new Date(now.getTime() - 140 * 60000).toISOString(),
          urgent: false,
          sourceId: med.id,
        });
      }
    });

    // 2. Incoming Requests: Pending Requisitions (Action Required)
    incomingRequests.forEach((req) => {
      if (req.status === 'pending') {
        const reqName = req.medicineName || 'Medicine';
        const fromHosp = req.fromHospitalName || req.requesterHospital || 'Peer Hospital';
        generatedAlerts.push({
          id: `alert-req-pending-${req.id}`,
          group: 'action',
          severity: 'ACTION',
          category: 'PENDING_REQUEST',
          title: `Requisition Awaiting Approval: ${reqName}`,
          desc: `${fromHosp} requested ${req.quantity} units. Review clinical availability and approve or reject.`,
          link: '/hospital/incoming-requests',
          actionText: 'Review Requisition',
          timestamp: req.requestDate || new Date(now.getTime() - 40 * 60000).toISOString(),
          urgent: true,
          sourceId: req.id,
        });
      }
    });

    // 3. Outgoing Requests (Information)
    outgoingRequests.forEach((req) => {
      const reqName = req.medicineName || 'Medicine';
      const toHosp = req.toHospitalName || 'Supplier Hospital';

      if (req.status === 'accepted') {
        generatedAlerts.push({
          id: `alert-req-acc-${req.id}`,
          group: 'info',
          severity: 'INFORMATION',
          category: 'REQUEST_ACCEPTED',
          title: `Requisition Approved: ${reqName}`,
          desc: `${toHosp} approved your transfer request for ${req.quantity} units. Dispatch packaging underway.`,
          link: '/hospital/my-requests',
          actionText: 'Track Request',
          timestamp: new Date(now.getTime() - 60 * 60000).toISOString(),
          urgent: false,
          sourceId: req.id,
        });
      } else if (req.status === 'rejected') {
        generatedAlerts.push({
          id: `alert-req-rej-${req.id}`,
          group: 'info',
          severity: 'INFORMATION',
          category: 'REQUEST_REJECTED',
          title: `Requisition Declined: ${reqName}`,
          desc: req.rejectReason || `Declined by ${toHosp} due to local quota commitments.`,
          link: '/hospital/my-requests',
          actionText: 'Browse Alternatives',
          timestamp: new Date(now.getTime() - 180 * 60000).toISOString(),
          urgent: false,
          sourceId: req.id,
        });
      }
    });

    // 4. Logistics & Transfers (Critical failures & Info updates)
    trackingList.forEach((trk) => {
      const status = (trk.status || '').toLowerCase();
      const med = trk.medicineName || 'Consignment';
      const txnId = trk.transactionId || trk.id;

      if (status.includes('fail') || status.includes('breach') || status.includes('quarantine')) {
        generatedAlerts.push({
          id: `alert-trk-fail-${txnId}`,
          group: 'critical',
          severity: 'CRITICAL',
          category: 'FAILED_TRANSFER',
          title: `Cold-Chain Anomaly / Failed Transfer: ${med}`,
          desc: `Sensor alert for Transfer ${txnId}: Temperature breach flagged. Quarantine protocol initiated.`,
          link: `/hospital/track?txn=${txnId}`,
          actionText: 'Inspect Telemetry',
          timestamp: new Date(now.getTime() - 15 * 60000).toISOString(),
          urgent: true,
          sourceId: txnId,
        });
      } else if (status.includes('transit')) {
        generatedAlerts.push({
          id: `alert-trk-transit-${txnId}`,
          group: 'info',
          severity: 'INFORMATION',
          category: 'TRANSFER_DISPATCHED',
          title: `Transfer in Transit: ${med}`,
          desc: `Transfer ${txnId} (${trk.quantity || 50} units) dispatched and moving on logistics corridor toward destination dock.`,
          link: `/hospital/track?txn=${txnId}`,
          actionText: 'View Live Route',
          timestamp: new Date(now.getTime() - 75 * 60000).toISOString(),
          urgent: false,
          sourceId: txnId,
        });
      } else if (status.includes('deliver') || status.includes('received')) {
        generatedAlerts.push({
          id: `alert-trk-delivered-${txnId}`,
          group: 'info',
          severity: 'INFORMATION',
          category: 'TRANSFER_DELIVERED',
          title: `Consignment Arrived: ${med}`,
          desc: `Transfer ${txnId} delivered to pharmacy receiving bay. Verified compliant 2°C - 8°C cold chain.`,
          link: `/hospital/track?txn=${txnId}`,
          actionText: 'View Proof of Delivery',
          timestamp: new Date(now.getTime() - 120 * 60000).toISOString(),
          urgent: false,
          sourceId: txnId,
        });
      }
    });

    // 5. Waste Disposal Alerts (Action Required & Info)
    disposals.forEach((disp) => {
      const med = disp.medicineName || 'Pharmaceutical Waste';
      if (disp.status === 'Incinerated & Certified' || disp.certificateNo) {
        generatedAlerts.push({
          id: `alert-disp-cert-${disp.id}`,
          group: 'info',
          severity: 'INFORMATION',
          category: 'DISPOSAL_COMPLETED',
          title: `Form-IV Destruction Certificate: ${med}`,
          desc: `Incineration completed at 1100°C by ${disp.facilityName || 'Authorized Facility'}. Certificate ${disp.certificateNo || 'CPCB-CERT-2024'} issued.`,
          link: '/hospital/waste-management',
          actionText: 'Download Certificate',
          timestamp: new Date(now.getTime() - 200 * 60000).toISOString(),
          urgent: false,
          sourceId: disp.id,
        });
      } else if ((disp.status || '').toLowerCase().includes('pickup') || disp.disposalStatus === 'DISPOSAL REQUESTED') {
        generatedAlerts.push({
          id: `alert-disp-action-${disp.id}`,
          group: 'action',
          severity: 'ACTION',
          category: 'DISPOSAL_REQUIRED',
          title: `Bio-Waste Pickup Manifest: ${med}`,
          desc: `Authorized bio-hazard vehicle scheduled for pickup on ${disp.pickupDate || 'scheduled date'}. Prepare container seal.`,
          link: '/hospital/waste-management',
          actionText: 'View Manifest',
          timestamp: new Date(now.getTime() - 110 * 60000).toISOString(),
          urgent: false,
          sourceId: disp.id,
        });
      }
    });

    // Sort by severity (CRITICAL first, then ACTION, then INFORMATION) and timestamp descending
    const severityWeight = { CRITICAL: 3, WARNING: 2, ACTION: 2, INFORMATION: 1 };

    return generatedAlerts
      .map((alert) => {
        const meta = storedAlertMeta[alert.id] || {};
        return {
          ...alert,
          read: meta.read || false,
          dismissed: meta.dismissed || false,
        };
      })
      .filter((alert) => !alert.dismissed)
      .sort((a, b) => {
        const weightDiff = (severityWeight[b.severity] || 0) - (severityWeight[a.severity] || 0);
        if (weightDiff !== 0) return weightDiff;
        return new Date(b.timestamp) - new Date(a.timestamp);
      });
  },

  /**
   * Marks an alert as read
   * @param {string} alertId 
   */
  markAsRead(alertId) {
    const meta = getStoredItem(KEYS.ALERTS, {});
    meta[alertId] = { ...(meta[alertId] || {}), read: true };
    setStoredItem(KEYS.ALERTS, meta);
  },

  /**
   * Dismisses an active alert so it disappears from the active list
   * @param {string} alertId 
   */
  dismissAlert(alertId) {
    const meta = getStoredItem(KEYS.ALERTS, {});
    meta[alertId] = { ...(meta[alertId] || {}), dismissed: true };
    setStoredItem(KEYS.ALERTS, meta);
  },

  /**
   * Marks all alerts for a hospital as read
   * @param {string|Array} target - hospitalId or list of alerts
   */
  markAllAsRead(target) {
    const meta = getStoredItem(KEYS.ALERTS, {});
    if (Array.isArray(target)) {
      target.forEach((alert) => {
        meta[alert.id] = { ...(meta[alert.id] || {}), read: true };
      });
    } else if (typeof target === 'string') {
      const alerts = this.getHospitalAlerts(target);
      alerts.forEach((alert) => {
        meta[alert.id] = { ...(meta[alert.id] || {}), read: true };
      });
    }
    setStoredItem(KEYS.ALERTS, meta);
  },

  /**
   * Clears all alerts for a hospital
   * @param {string} hospitalId 
   */
  clearAllAlerts(hospitalId) {
    const alerts = this.getHospitalAlerts(hospitalId);
    const meta = getStoredItem(KEYS.ALERTS, {});
    alerts.forEach((alert) => {
      meta[alert.id] = { ...(meta[alert.id] || {}), dismissed: true };
    });
    setStoredItem(KEYS.ALERTS, meta);
  },

  /**
   * Generates administrative alerts categorized into CRITICAL, WARNING, and INFORMATION.
   */
  getAdminAlerts() {
    const storedAlertMeta = getStoredItem(KEYS.ALERTS, {});
    const medicines = getStoredItem(KEYS.MEDICINES, []);
    const hospitals = getStoredItem(KEYS.HOSPITALS, []);
    const requests = getStoredItem(KEYS.REQUESTS, []);
    const feedbacks = getStoredItem(KEYS.FEEDBACKS, []);

    const alerts = [];

    // 1. CRITICAL ALERTS:
    // - Medicine out of stock
    // - Expired medicine
    medicines.forEach((med) => {
      const exp = calculateMedicineExpiry(med.expiryDate, med.mfgDate, med.quantity, med.minStockLevel || 20);
      if (exp.isExpired) {
        alerts.push({
          id: `admin-crit-exp-${med.id}`,
          category: 'CRITICAL',
          type: 'error',
          title: `Expired Medicine Batch: ${med.brandName}`,
          description: `Batch ${med.batchNo || 'N/A'} at ${med.hospitalName || 'Health Facility'} expired on ${med.expiryDate}. Immediate disposal quarantine required.`,
          relatedItem: `${med.brandName} (${med.hospitalName || 'Facility'})`,
          timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
          link: '/admin/inventory',
        });
      } else if (Number(med.quantity || 0) === 0) {
        alerts.push({
          id: `admin-crit-oos-${med.id}`,
          category: 'CRITICAL',
          type: 'error',
          title: `Medicine Out of Stock: ${med.brandName}`,
          description: `Zero available units recorded at ${med.hospitalName || 'Health Facility'}. Critical stockout alert.`,
          relatedItem: `${med.brandName} (${med.hospitalName || 'Facility'})`,
          timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
          link: '/admin/inventory',
        });
      }
    });

    // 2. WARNING ALERTS:
    // - Low medicine stock
    // - Medicine expiring soon (<60d)
    medicines.forEach((med) => {
      const exp = calculateMedicineExpiry(med.expiryDate, med.mfgDate, med.quantity, med.minStockLevel || 20);
      if (!exp.isExpired && Number(med.quantity || 0) > 0 && (Number(med.quantity || 0) <= (med.minStockLevel || 20) || exp.isLowStock)) {
        alerts.push({
          id: `admin-warn-low-${med.id}`,
          category: 'WARNING',
          type: 'warning',
          title: `Low Medicine Stock Reserve: ${med.brandName}`,
          description: `Only ${med.quantity} units remaining (below safety threshold of ${med.minStockLevel || 20}) at ${med.hospitalName || 'Facility'}.`,
          relatedItem: `${med.brandName} (${med.hospitalName || 'Facility'})`,
          timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
          link: '/admin/inventory',
        });
      }
      if (!exp.isExpired && exp.isNearExpiry) {
        alerts.push({
          id: `admin-warn-expiring-${med.id}`,
          category: 'WARNING',
          type: 'warning',
          title: `Medicine Expiring Soon: ${med.brandName}`,
          description: `Batch ${med.batchNo || 'N/A'} has ${exp.daysRemaining} days remaining before regulatory shelf life expires.`,
          relatedItem: `${med.brandName} (${med.hospitalName || 'Facility'})`,
          timestamp: new Date(Date.now() - 180 * 60000).toISOString(),
          link: '/admin/medicines',
        });
      }
    });

    // 3. INFORMATION ALERTS:
    // - New hospital registration / Verification request
    // - New order
    // - New hospital feedback
    hospitals.forEach((hosp) => {
      if (hosp.status === 'pending' || hosp.status === 'under_review') {
        alerts.push({
          id: `admin-info-hosp-${hosp.id}`,
          category: 'INFORMATION',
          type: 'info',
          title: `Verification Request: ${hosp.name}`,
          description: `New hospital applicant registered from ${hosp.city}. Statutory Form 20B/21B documents awaiting review.`,
          relatedItem: `${hosp.name} (${hosp.registrationNo || 'New Registration'})`,
          timestamp: hosp.registeredDate || new Date(Date.now() - 240 * 60000).toISOString(),
          link: '/admin/hospitals',
        });
      }
    });

    requests.forEach((req) => {
      if (req.status === 'pending') {
        alerts.push({
          id: `admin-info-req-${req.id}`,
          category: 'INFORMATION',
          type: 'info',
          title: `New Inter-Hospital Requisition: ${req.medicineName}`,
          description: `Order from ${req.fromHospitalName} to ${req.toHospitalName} for ${req.quantity} units is awaiting processing.`,
          relatedItem: `Order #${(req.id || '').toUpperCase().replace('REQ-', 'ORD-MED-')}`,
          timestamp: req.requestDate || new Date(Date.now() - 90 * 60000).toISOString(),
          link: '/admin/orders',
        });
      }
    });

    feedbacks.forEach((fb) => {
      if (!fb.status || fb.status === 'new') {
        alerts.push({
          id: `admin-info-fb-${fb.id}`,
          category: 'INFORMATION',
          type: 'info',
          title: `New Hospital Feedback: ${fb.hospitalName}`,
          description: `${fb.rating}★ rating submitted under category "${fb.category || 'General'}": "${(fb.feedbackText || fb.comment || '').slice(0, 60)}..."`,
          relatedItem: fb.hospitalName,
          timestamp: fb.date || new Date(Date.now() - 75 * 60000).toISOString(),
          link: '/admin/feedback',
        });
      }
    });

    // Merge read/dismissed preferences
    return alerts
      .map((alert) => {
        const meta = storedAlertMeta[alert.id] || {};
        return {
          ...alert,
          read: meta.read || false,
          dismissed: meta.dismissed || false,
        };
      })
      .filter((alert) => !alert.dismissed);
  },

  markAdminAlertAsRead(alertId) {
    const meta = getStoredItem(KEYS.ALERTS, {});
    meta[alertId] = { ...(meta[alertId] || {}), read: true };
    setStoredItem(KEYS.ALERTS, meta);
  },

  markAllAdminAlertsAsRead() {
    const meta = getStoredItem(KEYS.ALERTS, {});
    const alerts = this.getAdminAlerts();
    alerts.forEach((a) => {
      meta[a.id] = { ...(meta[a.id] || {}), read: true };
    });
    setStoredItem(KEYS.ALERTS, meta);
  },

  dismissAdminAlert(alertId) {
    const meta = getStoredItem(KEYS.ALERTS, {});
    meta[alertId] = { ...(meta[alertId] || {}), dismissed: true };
    setStoredItem(KEYS.ALERTS, meta);
  },

  getAdminUnreadCount() {
    const alerts = this.getAdminAlerts();
    return alerts.filter((a) => !a.read).length;
  },
};

export default alertService;
