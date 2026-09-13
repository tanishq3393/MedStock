/**
 * Configurable Cancellation & Refund Policy Engine for MedEx
 * 
 * Enforces business rules server-side so clients cannot manipulate
 * cancellation eligibility, refund amounts, or fee deductions.
 */

const DEFAULT_POLICY_CONFIG = {
  freeCancellationWindowHours: 24,
  tierBPenaltyPercent: 5,   // After 24h pre-dispatch
  tierCPenaltyPercent: 15,  // In transit / dispatched
};

/**
 * Calculates cancellation terms based on requisition timing and state
 * @param {object} requisition
 * @param {number} [currentTimeMs=Date.now()]
 * @param {object} [customConfig={}]
 */
const determineCancellationEligibility = (
  requisition,
  currentTimeMs = Date.now(),
  customConfig = {}
) => {
  const config = { ...DEFAULT_POLICY_CONFIG, ...customConfig };

  if (!requisition) {
    return {
      canCancel: false,
      stage: 'INVALID',
      stageLabel: 'Invalid Requisition',
      penaltyPercent: 0,
      refundPercent: 0,
      reason: 'No requisition data provided.',
    };
  }

  const rawStatus = String(requisition.status || '').toLowerCase().trim().replace(/[\-_]/g, ' ');

  // Terminal non-cancellable stages
  if (['delivered', 'received', 'completed'].includes(rawStatus)) {
    return {
      canCancel: false,
      stage: 'DELIVERED',
      stageLabel: 'Delivered (Non-cancellable)',
      penaltyPercent: 0,
      refundPercent: 0,
      reason: 'Consignment has already been delivered and accepted into pharmacy inventory.',
    };
  }

  if (['cancelled', 'cancelled by buyer'].includes(rawStatus)) {
    return {
      canCancel: false,
      stage: 'CANCELLED',
      stageLabel: 'Already Cancelled',
      penaltyPercent: requisition.cancellation?.penaltyPercent || 0,
      refundPercent: requisition.cancellation?.refundPercent || 0,
      reason: 'This requisition has already been cancelled.',
    };
  }

  if (['rejected', 'expired', 'declined', 'failed'].includes(rawStatus)) {
    return {
      canCancel: false,
      stage: 'INACTIVE',
      stageLabel: 'Inactive Requisition',
      penaltyPercent: 0,
      refundPercent: 0,
      reason: 'Requisition is inactive or was declined.',
    };
  }

  // Calculate elapsed hours
  const createdDate = requisition.createdAt || requisition.requestDate || requisition.request_date;
  let elapsedHours = 0;
  if (createdDate) {
    const createdMs = new Date(createdDate).getTime();
    if (!isNaN(createdMs)) {
      elapsedHours = Math.max(0, (currentTimeMs - createdMs) / (1000 * 60 * 60));
    }
  }

  // Tier C: Dispatched / In Transit
  if (['in transit', 'dispatched', 'shipped', 'out for delivery'].includes(rawStatus)) {
    return {
      canCancel: true,
      stage: 'DISPATCHED',
      stageLabel: `Dispatched (${config.tierCPenaltyPercent}% Courier Recall Fee)`,
      penaltyPercent: config.tierCPenaltyPercent,
      refundPercent: 100 - config.tierCPenaltyPercent,
      elapsedHours,
      reason: `Medicine has already been dispatched with active cold-chain logistics. A ${config.tierCPenaltyPercent}% courier recall fee applies.`,
    };
  }

  // Pre-dispatch states: pending, accepted, preparing, paid
  if (elapsedHours <= config.freeCancellationWindowHours) {
    // Tier A: Within 24 hours -> No penalty
    const hoursRemaining = Math.max(0, config.freeCancellationWindowHours - elapsedHours);
    return {
      canCancel: true,
      stage: 'WINDOW_A',
      stageLabel: 'Within 24 Hours (Free Cancellation)',
      penaltyPercent: 0,
      refundPercent: 100,
      hoursRemainingInFreeWindow: Math.round(hoursRemaining * 10) / 10,
      elapsedHours,
      reason: 'Requisition cancelled within the 24-hour statutory cooling window. 100% refund.',
    };
  }

  // Tier B: After 24 hours but before dispatch
  return {
    canCancel: true,
    stage: 'WINDOW_B',
    stageLabel: `After 24 Hours (${config.tierBPenaltyPercent}% Processing Fee)`,
    penaltyPercent: config.tierBPenaltyPercent,
    refundPercent: 100 - config.tierBPenaltyPercent,
    elapsedHours,
    reason: `Requisition cancelled after 24-hour window prior to courier dispatch. ${config.tierBPenaltyPercent}% restocking fee applies.`,
  };
};

/**
 * Calculates financial amounts for refund based on policy determination
 * @param {object} requisition
 * @param {object} policy
 */
const calculateRefundAmounts = (requisition, policy) => {
  const totalAmount = Number(
    requisition.totalAmount ||
    requisition.total_amount ||
    (Number(requisition.quantity || 0) * Number(requisition.unitFinalPrice || requisition.unit_final_price || 0))
  );

  const penaltyPercent = policy.penaltyPercent || 0;
  const refundPercent = policy.refundPercent || 0;

  const penaltyAmount = Math.round((totalAmount * penaltyPercent) / 100);
  const refundAmount = Math.max(0, totalAmount - penaltyAmount);

  return {
    totalAmount,
    penaltyPercent,
    penaltyAmount,
    refundPercent,
    refundAmount,
  };
};

module.exports = {
  DEFAULT_POLICY_CONFIG,
  determineCancellationEligibility,
  calculateRefundAmounts,
};
