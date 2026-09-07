import { getStoredItem, setStoredItem, KEYS } from './storage';
import { calculateMedicineExpiry, calculateRequestExpiry } from '../utils/expiryUtils';

/**
 * Alert service manages active and historical alerts with stable IDs,
 * read/unread state, active/dismissed state, and automated resolution.
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
    const medicines = getStoredItem(KEYS.MEDICINES, []).filter((m) => m.hospitalId === hospitalId);
    const requests = getStoredItem(KEYS.REQUESTS, []);
    const incomingRequests = requests.filter((r) => r.toHospitalId === hospitalId);
    const outgoingRequests = requests.filter((r) => r.fromHospitalId === hospitalId);
    const disposals = getStoredItem(KEYS.DISPOSALS, []).filter((d) => d.hospitalId === hospitalId);
    const trackingList = getStoredItem(KEYS.TRACKING, []).filter(
      (t) => t.senderHospitalId === hospitalId || t.receiverHospitalId === hospitalId || t.senderHospital?.includes(hospitalId) || t.receiverHospital?.includes(hospitalId)
    );

    const generatedAlerts = [];

    // 1. Inventory: Expired, Near-Expiry, Low Stock
    medicines.forEach((med) => {
      const exp = calculateMedicineExpiry(med.expiryDate, med.mfgDate, med.quantity);

      // Check if medicine has entered disposal workflow
      const hasDisposal = disposals.some((d) => d.medicineId === med.id || (d.batchNo && d.batchNo === med.batchNo));

      if (exp.isExpired) {
        // If medicine is already scheduled or completed for disposal, resolve this alert!
        if (!hasDisposal && med.status !== 'pending_disposal' && med.status !== 'disposed') {
          generatedAlerts.push({
            id: `alert-exp-${med.id}`,
            type: 'error',
            category: 'EXPIRED_INVENTORY',
            title: `Expired Stock Quarantine: ${med.brandName}`,
            desc: `Batch ${med.batchNo || 'N/A'} (${med.quantity} units) expired. Immediate bio-waste disposal required.`,
            link: '/hospital/waste-management',
            actionText: 'Dispose via Bio-Centre',
            time: 'Action Required',
            urgent: true,
            sourceId: med.id,
          });
        }
      } else if (exp.isNearExpiry) {
        generatedAlerts.push({
          id: `alert-near-${med.id}`,
          type: 'warning',
          category: 'NEAR_EXPIRY',
          title: `Near-Expiry Concession Active: ${med.brandName}`,
          desc: `${med.quantity} units expire in ${exp.daysRemaining} days. Automated shelf-life concession active for peer exchanges.`,
          link: '/hospital/inventory',
          actionText: 'Review Concession',
          time: `${exp.daysRemaining}d left`,
          urgent: exp.daysRemaining <= 30,
          sourceId: med.id,
        });
      }

      if (exp.isLowStock && !exp.isExpired) {
        generatedAlerts.push({
          id: `alert-low-${med.id}`,
          type: 'info',
          category: 'LOW_STOCK',
          title: `Low Stock Reserve: ${med.brandName}`,
          desc: `Current available quantity is ${med.quantity} units (below threshold). Consider requesting replenishment.`,
          link: '/hospital/marketplace',
          actionText: 'Find in Market',
          time: 'Low Reserve',
          urgent: false,
          sourceId: med.id,
        });
      }
    });

    // 2. Incoming Requests: Pending 48h SLA expiry
    incomingRequests.forEach((req) => {
      if (req.status === 'pending') {
        const sla = calculateRequestExpiry(req.requestDate);
        if (sla.isExpired) {
          generatedAlerts.push({
            id: `alert-req-expired-${req.id}`,
            type: 'warning',
            category: 'REQUEST_EXPIRED',
            title: `Requisition Expired (48h SLA): ${req.medicineName}`,
            desc: `Order from ${req.fromHospitalName} elapsed without action. Request has transitioned to Expired.`,
            link: '/hospital/incoming-requests',
            actionText: 'View Queue',
            time: 'Expired',
            urgent: false,
            sourceId: req.id,
          });
        } else if (sla.hoursRemaining < 12) {
          generatedAlerts.push({
            id: `alert-req-urgent-${req.id}`,
            type: 'warning',
            category: 'PENDING_REQUEST_EXPIRY',
            title: `Expiring Requisition Action: ${req.medicineName}`,
            desc: `Only ${sla.formattedTimeLeft} remaining to accept ${req.fromHospitalName}'s requisition before auto-dismissal.`,
            link: '/hospital/incoming-requests',
            actionText: 'Accept Requisition',
            time: sla.formattedTimeLeft,
            urgent: true,
            sourceId: req.id,
          });
        }
      }
    });

    // 3. Outgoing Requests: Accepted, Rejected
    outgoingRequests.forEach((req) => {
      if (req.status === 'accepted' && req.paymentStatus !== 'success') {
        generatedAlerts.push({
          id: `alert-req-acc-${req.id}`,
          type: 'success',
          category: 'REQUEST_ACCEPTED',
          title: `Requisition Accepted: ${req.medicineName}`,
          desc: `${req.toHospitalName} accepted your request for ${req.quantity} units. Escrow checkout ready.`,
          link: '/hospital/my-requests',
          actionText: 'Proceed to Checkout',
          time: 'Ready for Escrow',
          urgent: true,
          sourceId: req.id,
        });
      } else if (req.status === 'rejected') {
        generatedAlerts.push({
          id: `alert-req-rej-${req.id}`,
          type: 'info',
          category: 'REQUEST_REJECTED',
          title: `Requisition Declined: ${req.medicineName}`,
          desc: req.rejectReason || `Declined by ${req.toHospitalName}.`,
          link: '/hospital/my-requests',
          actionText: 'View Pipeline',
          time: 'Declined',
          urgent: false,
          sourceId: req.id,
        });
      }
    });

    // 4. Waste Management Alerts
    disposals.forEach((disp) => {
      if (disp.status === 'Incinerated & Certified' && disp.certificateNo) {
        generatedAlerts.push({
          id: `alert-disp-cert-${disp.id}`,
          type: 'success',
          category: 'WASTE_CERTIFIED',
          title: `Bio-Waste Certificate Issued: ${disp.certificateNo}`,
          desc: `Statutory incineration completed by ${disp.bioCentreName || 'Authorized Bio-Centre'}. Certificate ready to download.`,
          link: '/hospital/waste-management',
          actionText: 'View Certificate',
          time: 'Certified',
          urgent: false,
          sourceId: disp.id,
        });
      } else if (disp.status === 'Pickup Scheduled') {
        generatedAlerts.push({
          id: `alert-disp-pickup-${disp.id}`,
          type: 'info',
          category: 'WASTE_PICKUP',
          title: `Bio-Hazard Pickup Scheduled: ${disp.medicineName}`,
          desc: `Authorized vehicle ${disp.vehicleNo || 'MH-04-GP-8833'} scheduled for collection on ${disp.pickupDate || 'Tomorrow'}.`,
          link: '/hospital/waste-management',
          actionText: 'Track Pickup',
          time: 'Scheduled',
          urgent: false,
          sourceId: disp.id,
        });
      }
    });

    // Merge with stored read/dismissed preferences
    return generatedAlerts
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
   * @param {Array} alerts 
   */
  markAllAsRead(alerts = []) {
    const meta = getStoredItem(KEYS.ALERTS, {});
    alerts.forEach((alert) => {
      meta[alert.id] = { ...(meta[alert.id] || {}), read: true };
    });
    setStoredItem(KEYS.ALERTS, meta);
  },
};
