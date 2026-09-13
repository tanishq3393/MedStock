const { randomUUID: uuidv4 } = require('crypto');
const { supabaseAdmin, supabaseAnon, isConfigured } = require('../config/supabase');
const logger = require('../utils/logger');

// Local fallback store for refunds
const fallbackRefunds = [];

const refundService = {
  /**
   * Creates a refund record in refunds table
   */
  async createRefund({
    requestId,
    paymentId = null,
    transactionId,
    buyerHospitalId,
    sellerHospitalId,
    totalOrderAmount,
    cancellationStage,
    penaltyPercentage,
    penaltyAmount,
    refundPercentage,
    refundAmount,
    reason,
    status = 'pending',
    providerRefundReference = null,
  }) {
    const refundNumber = `REF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-4)}`;
    const nowIso = new Date().toISOString();

    const record = {
      id: uuidv4(),
      refund_number: refundNumber,
      refundNumber,
      request_id: requestId,
      requestId,
      payment_id: paymentId,
      paymentId,
      transaction_id: transactionId,
      transactionId,
      buyer_hospital_id: buyerHospitalId,
      buyerHospitalId,
      seller_hospital_id: sellerHospitalId,
      sellerHospitalId,
      total_order_amount: Number(totalOrderAmount),
      totalOrderAmount: Number(totalOrderAmount),
      cancellation_stage: cancellationStage,
      cancellationStage,
      penalty_percentage: Number(penaltyPercentage),
      penaltyPercentage: Number(penaltyPercentage),
      penaltyPercent: Number(penaltyPercentage),
      penalty_amount: Number(penaltyAmount),
      penaltyAmount: Number(penaltyAmount),
      refund_percentage: Number(refundPercentage),
      refundPercentage: Number(refundPercentage),
      refundPercent: Number(refundPercentage),
      refund_amount: Number(refundAmount),
      refundAmount: Number(refundAmount),
      reason,
      status: String(status).toLowerCase(),
      provider_refund_reference: providerRefundReference,
      providerRefundReference,
      processed_at: status === 'completed' || status === 'processed' ? nowIso : null,
      processedAt: status === 'completed' || status === 'processed' ? nowIso : null,
      created_at: nowIso,
      createdAt: nowIso,
    };

    if (isConfigured && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('refunds')
          .insert([{
            id: record.id,
            refund_number: record.refund_number,
            request_id: record.request_id,
            payment_id: record.payment_id,
            transaction_id: record.transaction_id,
            buyer_hospital_id: record.buyer_hospital_id,
            seller_hospital_id: record.seller_hospital_id,
            total_order_amount: record.total_order_amount,
            cancellation_stage: record.cancellation_stage,
            penalty_percentage: record.penalty_percentage,
            penalty_amount: record.penalty_amount,
            refund_percentage: record.refund_percentage,
            refund_amount: record.refund_amount,
            reason: record.reason,
            status: record.status,
            provider_refund_reference: record.provider_refund_reference,
            processed_at: record.processed_at,
          }])
          .select()
          .single();

        if (!error && data) return data;
      } catch (err) {
        logger.warn('Supabase insertion for refund failed:', err.message);
      }
    }

    fallbackRefunds.unshift(record);
    return record;
  },

  /**
   * Retrieves refund by ID with strict hospital permission checks
   */
  async getRefundById(id, { hospitalId = null, isAdmin = false } = {}) {
    if (isConfigured) {
      try {
        const client = supabaseAdmin || supabaseAnon;
        const { data, error } = await client
          .from('refunds')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) {
          if (!isAdmin && hospitalId && data.buyer_hospital_id !== hospitalId && data.seller_hospital_id !== hospitalId) {
            const err = new Error('Access denied: You do not have permission to view this refund record.');
            err.statusCode = 403;
            throw err;
          }
          return data;
        }
      } catch (err) {
        if (err.statusCode) throw err;
      }
    }

    const record = fallbackRefunds.find((r) => r.id === id || r.refundNumber === id || r.refund_number === id);
    if (!record) {
      const err = new Error(`Refund record '${id}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    if (!isAdmin && hospitalId && record.buyerHospitalId !== hospitalId && record.sellerHospitalId !== hospitalId) {
      const err = new Error('Access denied: You do not have permission to view this refund record.');
      err.statusCode = 403;
      throw err;
    }

    return record;
  },

  /**
   * Retrieves refunds for the authenticated hospital (either buyer or seller)
   */
  async getMyRefunds({ hospitalId, page = 1, limit = 20 }) {
    if (!hospitalId) return { refunds: [], total: 0, page: 1, limit };

    const offset = (page - 1) * limit;

    if (isConfigured) {
      try {
        const client = supabaseAdmin || supabaseAnon;
        const { data, count, error } = await client
          .from('refunds')
          .select('*', { count: 'exact' })
          .or(`buyer_hospital_id.eq.${hospitalId},seller_hospital_id.eq.${hospitalId}`)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (!error && data) {
          return {
            refunds: data,
            total: count || data.length,
            page: Number(page),
            limit: Number(limit),
          };
        }
      } catch (err) {
        logger.warn('Supabase query for hospital refunds failed:', err.message);
      }
    }

    const filtered = fallbackRefunds.filter(
      (r) => r.buyerHospitalId === hospitalId || r.sellerHospitalId === hospitalId
    );

    return {
      refunds: filtered.slice(offset, offset + limit),
      total: filtered.length,
      page: Number(page),
      limit: Number(limit),
    };
  },

  /**
   * Admin monitoring endpoint for platform refunds
   */
  async getAdminRefunds({ page = 1, limit = 50, status = 'all', search = '' }) {
    const offset = (page - 1) * limit;

    if (isConfigured) {
      try {
        const client = supabaseAdmin || supabaseAnon;
        let query = client.from('refunds').select('*', { count: 'exact' });

        if (status && status !== 'all') {
          query = query.eq('status', status.toLowerCase());
        }
        if (search) {
          query = query.or(`refund_number.ilike.%${search}%,transaction_id.ilike.%${search}%`);
        }

        const { data, count, error } = await query
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (!error && data) {
          return {
            refunds: data,
            total: count || data.length,
            page: Number(page),
            limit: Number(limit),
          };
        }
      } catch (err) {
        logger.warn('Supabase admin query for refunds failed:', err.message);
      }
    }

    let filtered = [...fallbackRefunds];
    if (status && status !== 'all') {
      filtered = filtered.filter((r) => r.status.toLowerCase() === status.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (r) => (r.refundNumber || '').toLowerCase().includes(q) || (r.transactionId || '').toLowerCase().includes(q)
      );
    }

    return {
      refunds: filtered.slice(offset, offset + limit),
      total: filtered.length,
      page: Number(page),
      limit: Number(limit),
    };
  },

  /**
   * Phase 7: Process refund disbursement with payment provider (ADMIN ONLY)
   */
  async processRefundDisbursement({ refundId, user, notes = '' }) {
    if (!user || (user.role !== 'admin' && user.role !== 'ADMIN')) {
      const err = new Error('Forbidden: Only platform administrators can disburse refunds.');
      err.statusCode = 403;
      throw err;
    }

    const refund = await this.getRefundById(refundId, { isAdmin: true });
    const currentStatus = String(refund.status || '').toLowerCase();

    if (currentStatus === 'completed' || currentStatus === 'processed') {
      const err = new Error(`Refund '${refund.refundNumber || refundId}' has already been disbursed.`);
      err.statusCode = 400;
      throw err;
    }

    if (currentStatus === 'not_required') {
      const err = new Error(`Refund '${refund.refundNumber || refundId}' is marked as NOT_REQUIRED.`);
      err.statusCode = 400;
      throw err;
    }

    const { getPaymentProvider } = require('./paymentProvider');
    const provider = getPaymentProvider();
    const auditService = require('./auditService');
    const notificationService = require('./notificationService');

    let providerResult;
    try {
      providerResult = await provider.initiateRefund({
        paymentId: refund.paymentId || refund.payment_id || `pmt_ref_${refund.id}`,
        amount: Number(refund.refundAmount || refund.refund_amount || 0),
        notes: {
          refundId: refund.id,
          refundNumber: refund.refundNumber || refund.refund_number,
          adminNotes: notes,
        },
      });
    } catch (provErr) {
      logger.error('Payment provider initiateRefund failed:', provErr);
      const err = new Error(`Payment provider failed to process refund: ${provErr.message}`);
      err.statusCode = 502;
      throw err;
    }

    const nowIso = new Date().toISOString();
    refund.status = 'completed';
    refund.processedAt = nowIso;
    refund.processed_at = nowIso;
    refund.processedBy = user.id;
    refund.processed_by = user.id;
    refund.providerRefundReference = providerResult.id || providerResult.refund_id;
    refund.provider_refund_reference = providerResult.id || providerResult.refund_id;

    if (isConfigured && supabaseAdmin) {
      try {
        await supabaseAdmin
          .from('refunds')
          .update({
            status: 'completed',
            processed_at: nowIso,
            processed_by: user.id,
            provider_refund_reference: refund.provider_refund_reference,
          })
          .eq('id', refund.id);

        // If associated payment exists, update payment status to REFUNDED
        const paymentId = refund.paymentId || refund.payment_id;
        if (paymentId) {
          await supabaseAdmin
            .from('payments')
            .update({
              status: 'REFUNDED',
              updated_at: nowIso,
            })
            .eq('id', paymentId);
        }
      } catch (dbErr) {
        logger.warn('Supabase update for refund disbursement failed:', dbErr.message);
      }
    }

    // Notify buyer hospital
    const buyerHosp = refund.buyerHospitalId || refund.buyer_hospital_id;
    if (buyerHosp) {
      await notificationService.createNotification({
        hospitalId: buyerHosp,
        notificationType: 'REFUND_PROCESSED',
        type: 'success',
        title: `Refund Processed: ₹${Number(refund.refundAmount || refund.refund_amount || 0).toLocaleString()}`,
        message: `Disbursement completed for refund #${refund.refundNumber || refund.id} (Ref: ${refund.providerRefundReference}). Funds will reflect in your account per banking cycles.`,
        relatedEntityType: 'refund',
        relatedEntityId: refund.id,
        link: '/hospital/requests',
        metadata: {
          refundId: refund.id,
          refundNumber: refund.refundNumber,
          amount: refund.refundAmount || refund.refund_amount,
          reference: refund.providerRefundReference,
        }
      });
    }

    // Log audit event
    await auditService.logEvent({
      action: 'REFUND_PROCESSED',
      entityType: 'REFUND',
      entityId: refund.id,
      actorRole: 'admin',
      summary: `Admin ${user.email || user.id} processed refund ${refund.refundNumber || refund.id} for ₹${refund.refundAmount || refund.refund_amount}. Provider reference: ${refund.providerRefundReference}.`,
      resultingStatus: 'completed',
      metadata: {
        refundId: refund.id,
        refundNumber: refund.refundNumber,
        amount: refund.refundAmount || refund.refund_amount,
        adminId: user.id,
        notes,
        providerReference: refund.providerRefundReference,
      }
    });

    return {
      success: true,
      refund,
      providerResult,
      message: 'Refund successfully disbursed and ledger updated.',
    };
  }
};

module.exports = refundService;
