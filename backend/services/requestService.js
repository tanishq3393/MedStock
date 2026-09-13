const { supabaseAdmin, supabaseAnon, isConfigured } = require('../config/supabase');
const { determineCancellationEligibility, calculateRefundAmounts } = require('../utils/cancellationPolicy');
const auditService = require('./auditService');
const logger = require('../utils/logger');

// Local in-memory seed requests dataset
const devRequests = [
  {
    id: 'req-demo-1',
    transactionId: 'REQ-2024-9102',
    orderId: 'ORD-1024',
    fromHospitalId: 'hosp-1',
    fromHospitalName: 'Apollo Hospital',
    toHospitalId: 'hosp-2',
    toHospitalName: 'Fortis Memorial Research Institute',
    medicineId: 'med-dolo-650',
    medicineName: 'Dolo 650',
    genericName: 'Paracetamol',
    batchNo: 'BAT-DOLO-001',
    quantity: 500,
    unitOriginalPrice: 30,
    unitFinalPrice: 26,
    totalAmount: 13000,
    gstAmount: 1560,
    urgency: 'Emergency',
    notes: 'Urgent stock requisition for ICU oncology ward.',
    status: 'completed',
    paymentStatus: 'paid',
    paymentId: 'PAY-ESCROW-1024',
    paidDate: '2024-08-15T10:30:00.000Z',
    requestDate: '2024-08-14T08:00:00.000Z',
    deliveredAt: '2024-08-16T14:20:00.000Z',
    completedAt: '2024-08-16T16:00:00.000Z',
  }
];

const requestService = {
  /**
   * Retrieves requests filtered by hospital and direction
   */
  async getRequests({ hospitalId = null, type = 'all', status = 'all' }) {
    if (isConfigured) {
      try {
        const client = supabaseAdmin || supabaseAnon;
        let query = client.from('requests').select('*');

        if (hospitalId) {
          if (type === 'incoming') {
            query = query.eq('to_hospital_id', hospitalId);
          } else if (type === 'outgoing') {
            query = query.eq('from_hospital_id', hospitalId);
          } else {
            query = query.or(`from_hospital_id.eq.${hospitalId},to_hospital_id.eq.${hospitalId}`);
          }
        }

        if (status && status !== 'all') {
          query = query.eq('status', status);
        }

        const { data, error } = await query.order('request_date', { ascending: false });
        if (!error && data) return data;
      } catch (err) {
        logger.warn('Supabase query failed in getRequests:', err.message);
      }
    }

    let reqs = [...devRequests];
    if (hospitalId) {
      if (type === 'incoming') {
        reqs = reqs.filter((r) => r.toHospitalId === hospitalId);
      } else if (type === 'outgoing') {
        reqs = reqs.filter((r) => r.fromHospitalId === hospitalId);
      } else {
        reqs = reqs.filter((r) => r.fromHospitalId === hospitalId || r.toHospitalId === hospitalId);
      }
    }

    if (status && status !== 'all') {
      reqs = reqs.filter((r) => (r.status || '').toLowerCase() === status.toLowerCase());
    }

    return reqs;
  },

  /**
   * Creates an inter-hospital medicine requisition
   */
  async createRequest(reqData) {
    if (!reqData.medicineName || !reqData.quantity || !reqData.toHospitalId) {
      const err = new Error('Medicine name, quantity, and providing hospital are required.');
      err.statusCode = 400;
      throw err;
    }

    const txnId = 'REQ-' + Date.now().toString().slice(-6);
    const orderId = 'ORD-' + Date.now().toString().slice(-6);
    const qty = Number(reqData.quantity);
    const unitPrice = Number(reqData.unitFinalPrice || reqData.pricePerUnit || 50);
    const totalAmount = Number(reqData.totalAmount || qty * unitPrice);

    const newRequest = {
      id: 'req-' + Date.now(),
      transactionId: txnId,
      orderId,
      fromHospitalId: reqData.fromHospitalId || 'hosp-1',
      fromHospitalName: reqData.fromHospitalName || 'Apollo Hospital',
      toHospitalId: reqData.toHospitalId,
      toHospitalName: reqData.toHospitalName || 'Peer Hospital',
      medicineId: reqData.medicineId || null,
      medicineName: reqData.medicineName,
      genericName: reqData.genericName || 'Active Formulation',
      batchNo: reqData.batchNo || null,
      quantity: qty,
      unitOriginalPrice: Number(reqData.unitOriginalPrice || unitPrice),
      unitFinalPrice: unitPrice,
      totalAmount,
      gstAmount: Math.round(totalAmount * 0.12),
      urgency: reqData.urgency || 'Standard Routine',
      notes: reqData.notes || 'Routine healthcare logistics requisition',
      requirementGroupId: reqData.requirementGroupId || null,
      status: 'pending',
      paymentStatus: 'pending',
      requestDate: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    };

    if (isConfigured && supabaseAdmin) {
      try {
        await supabaseAdmin.from('requests').insert([{
          id: newRequest.id,
          transaction_id: newRequest.transactionId,
          order_id: newRequest.orderId,
          from_hospital_id: newRequest.fromHospitalId,
          from_hospital_name: newRequest.fromHospitalName,
          to_hospital_id: newRequest.toHospitalId,
          to_hospital_name: newRequest.toHospitalName,
          medicine_name: newRequest.medicineName,
          generic_name: newRequest.genericName,
          quantity: newRequest.quantity,
          unit_original_price: newRequest.unitOriginalPrice,
          unit_final_price: newRequest.unitFinalPrice,
          total_amount: newRequest.totalAmount,
          gst_amount: newRequest.gstAmount,
          urgency: newRequest.urgency,
          status: 'pending',
          payment_status: 'pending',
          expiry_date: newRequest.expiryDate,
        }]);
      } catch (err) {
        logger.warn('Supabase insertion failed for request:', err.message);
      }
    }

    devRequests.unshift(newRequest);

    await auditService.logEvent({
      action: 'REQUEST_CREATED',
      entityType: 'REQUEST',
      entityId: newRequest.id,
      hospitalId: newRequest.fromHospitalId,
      hospitalName: newRequest.fromHospitalName,
      partnerHospitalId: newRequest.toHospitalId,
      partnerHospitalName: newRequest.toHospitalName,
      summary: `Created requisition for ${qty} units of ${newRequest.medicineName} sent to ${newRequest.toHospitalName}.`,
      resultingStatus: 'pending',
      metadata: { transactionId: txnId, quantity: qty, totalAmount },
    });

    return newRequest;
  },

  /**
   * Handles peer response (accept / reject) with First-Acceptance-Wins logic
   */
  async handleRequest({ requestId, action, reason = '', hospitalId }) {
    const idx = devRequests.findIndex((r) => r.id === requestId);
    if (idx === -1) {
      const err = new Error('Requisition not found');
      err.statusCode = 404;
      throw err;
    }

    const targetReq = devRequests[idx];
    const rejectedCompeting = [];

    if (action === 'accept') {
      targetReq.status = 'accepted';
      targetReq.acceptedAt = new Date().toISOString();

      // First-Acceptance-Wins: Auto-decline competing requests
      devRequests.forEach((r, i) => {
        if (
          i !== idx &&
          r.status === 'pending' &&
          r.fromHospitalId === targetReq.fromHospitalId &&
          ((targetReq.requirementGroupId && r.requirementGroupId === targetReq.requirementGroupId) ||
           (r.medicineName === targetReq.medicineName && r.quantity === targetReq.quantity))
        ) {
          r.status = 'rejected';
          r.rejectReason = `First-acceptance fulfilled: Requisition accepted by ${targetReq.toHospitalName}. Competing request automatically declined.`;
          r.autoDeclined = true;
          rejectedCompeting.push(r);
        }
      });

      await auditService.logEvent({
        action: 'REQUEST_ACCEPTED',
        entityType: 'REQUEST',
        entityId: targetReq.id,
        hospitalId: targetReq.toHospitalId,
        hospitalName: targetReq.toHospitalName,
        partnerHospitalId: targetReq.fromHospitalId,
        partnerHospitalName: targetReq.fromHospitalName,
        summary: `Accepted requisition from ${targetReq.fromHospitalName} for ${targetReq.quantity} units of ${targetReq.medicineName}. Stock reserved.`,
        resultingStatus: 'accepted',
      });
    } else if (action === 'reject') {
      targetReq.status = 'rejected';
      targetReq.rejectReason = reason || 'Declined due to clinical stock requirements.';

      await auditService.logEvent({
        action: 'REQUEST_REJECTED',
        entityType: 'REQUEST',
        entityId: targetReq.id,
        hospitalId: targetReq.toHospitalId,
        hospitalName: targetReq.toHospitalName,
        partnerHospitalId: targetReq.fromHospitalId,
        partnerHospitalName: targetReq.fromHospitalName,
        summary: `Declined requisition for ${targetReq.medicineName}. Reason: ${targetReq.rejectReason}`,
        resultingStatus: 'rejected',
      });
    }

    return {
      acceptedRequest: targetReq,
      rejectedCompeting,
    };
  },

  /**
   * Enforces server-side cancellation policy and calculates refund/fees
   */
  async cancelRequest({ requestId, reason = 'Requirement modified', note = '', hospitalId }) {
    const idx = devRequests.findIndex((r) => r.id === requestId);
    if (idx === -1) {
      const err = new Error('Requisition not found');
      err.statusCode = 404;
      throw err;
    }

    const targetReq = devRequests[idx];
    const policy = determineCancellationEligibility(targetReq);

    if (!policy.canCancel) {
      const err = new Error(policy.reason || 'Requisition cannot be cancelled at this stage.');
      err.statusCode = 400;
      err.code = 'CANCELLATION_NOT_ALLOWED';
      throw err;
    }

    const { totalAmount, penaltyPercent, penaltyAmount, refundPercent, refundAmount } =
      calculateRefundAmounts(targetReq, policy);

    targetReq.status = 'cancelled';
    targetReq.paymentStatus = 'refunded';
    targetReq.cancellation = {
      cancelledAt: new Date().toISOString(),
      cancelledBy: hospitalId,
      reason,
      note,
      stage: policy.stage,
      stageLabel: policy.stageLabel,
      penaltyPercent,
      penaltyAmount,
      refundPercent,
      refundAmount,
      totalAmount,
    };

    await auditService.logEvent({
      action: 'REQUEST_CANCELLED',
      entityType: 'REQUEST',
      entityId: targetReq.id,
      hospitalId: targetReq.fromHospitalId,
      hospitalName: targetReq.fromHospitalName,
      partnerHospitalId: targetReq.toHospitalId,
      partnerHospitalName: targetReq.toHospitalName,
      summary: `Cancelled requisition for ${targetReq.medicineName} (${targetReq.quantity} units). Refund: ₹${refundAmount} (${refundPercent}%). Penalty: ₹${penaltyAmount}.`,
      resultingStatus: 'cancelled',
      metadata: { penaltyAmount, refundAmount, penaltyPercent, refundPercent, reason },
    });

    return targetReq;
  }
};

module.exports = requestService;
