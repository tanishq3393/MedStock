import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  Send, 
  CreditCard, 
  Truck, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Building2, 
  Search,
  Check,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  XCircle
} from 'lucide-react';
import { fetchOutgoingRequests, payForRequest, cancelRequisition } from '../../store/slices/requestSlice';
import StatusBadge from '../../components/common/StatusBadge';
import RazorpayMockModal from '../../components/common/RazorpayMockModal';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import WorkflowTimeline from '../../components/common/WorkflowTimeline';
import EmptyState from '../../components/common/EmptyState';
import CancelRequestModal from '../../components/hospital/CancelRequestModal';
import { getCancellationPolicy, getCancellationBadgeProps } from '../../utils/cancellationPolicy';
import toast from 'react-hot-toast';
import { isHospitalSuspended } from '../../services/storage';
import { getRequestRemainingTime } from '../../utils/expiryUtils';

export const MyRequests = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { outgoingRequests, isLoading } = useSelector((state) => state.requests);
  const isSuspended = isHospitalSuspended(user?.id);

  const [activePaymentReq, setActivePaymentReq] = useState(null);
  const [cancelModalReq, setCancelModalReq] = useState(null);
  const [rejectReasonModal, setRejectReasonModal] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchOutgoingRequests(user.id));
    }
  }, [dispatch, user?.id]);

  const handlePaymentSuccess = async ({ requestId, paymentMethod }) => {
    const result = await dispatch(payForRequest({ requestId, paymentMethod }));
    if (result.meta.requestStatus === 'rejected') {
      throw new Error(result.payload || 'Payment could not be processed');
    }
    return result.payload;
  };

  const handleConfirmCancel = async ({ requestId, reason, note, policy, amounts }) => {
    try {
      await dispatch(cancelRequisition({
        requestId,
        reason,
        note,
        hospitalId: user?.id,
      })).unwrap();
      toast.success(
        `Requisition cancelled successfully. Demo refund initiated: ₹${(amounts?.refundAmount || 0).toLocaleString()} (${policy?.refundPercent || 100}% refund).`
      );
      setCancelModalReq(null);
    } catch (err) {
      toast.error(err?.message || 'Failed to cancel requisition');
      throw err;
    }
  };

  const stages = [
    { key: 'requested', label: 'REQUESTED' },
    { key: 'reviewing', label: 'REVIEWING' },
    { key: 'accepted', label: 'APPROVED' },
    { key: 'packed', label: 'PACKED' },
    { key: 'paid', label: 'IN TRANSIT' },
    { key: 'delivered', label: 'DELIVERED' }
  ];

  const getStageIndex = (status) => {
    const map = {
      pending: 0,
      reviewing: 1,
      accepted: 2,
      packed: 3,
      paid: 4,
      'in transit': 4,
      delivered: 5,
      rejected: -1,
      cancelled: -1
    };
    return map[status.toLowerCase()] ?? 0;
  };

  const filtered = outgoingRequests.filter((r) => {
    const matchesSearch = (r.medicineName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.toHospitalName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.transactionId || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeFilter === 'all') return matchesSearch;
    if (activeFilter === 'pending') return matchesSearch && (r.status === 'pending' || r.status === 'reviewing');
    if (activeFilter === 'actionable') return matchesSearch && r.status === 'accepted';
    if (activeFilter === 'transit') return matchesSearch && (r.status === 'paid' || r.status === 'in transit');
    if (activeFilter === 'cancelled') return matchesSearch && (r.status === 'cancelled' || r.status === 'cancelled by buyer');
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-secondary-900 tracking-tight">
              Outgoing Medicine Requisitions
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold text-primary-700 bg-primary-50 border border-primary-200 rounded">
              PIPELINE TRACKER
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Track stage milestones of pharmaceutical procurements submitted to partner healthcare facilities.
          </p>
        </div>

        <Link
          to="/hospital/marketplace"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-md shadow-primary-600/20 transition-all hover:scale-[1.02]"
        >
          <Send className="w-3.5 h-3.5" />
          <span>New Requisition</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Medicine, Hospital, or TXN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'actionable', label: 'Ready for Escrow' },
            { id: 'transit', label: 'In Transit' },
            { id: 'pending', label: 'Awaiting Approval' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Pipeline Requisition Cards */}
      {isLoading && outgoingRequests.length === 0 ? (
        <LoadingSpinner text="Querying active requisition pipeline..." />
      ) : filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((req) => {
            const currentStageIdx = getStageIndex(req.status);
            const isRejected = req.status === 'rejected';
            const isCancelled = req.status === 'cancelled' || req.status === 'cancelled by buyer';
            const cancelPolicy = getCancellationPolicy(req);
            const cancelBadge = getCancellationBadgeProps(cancelPolicy);

            return (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all p-5 space-y-4"
              >
                {/* Top Row: Medicine Info & Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-slate-900">
                        {req.medicineName}
                      </h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono">
                      <span>TXN: <strong className="text-slate-800">{req.transactionId || 'TXN-000000'}</strong></span>
                      <span>•</span>
                      <span>Providing Hospital: <strong className="text-primary-700">{req.toHospitalName}</strong></span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <StatusBadge status={req.status} />
                      {cancelBadge && !isCancelled && (
                        <span 
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border shadow-xs ${cancelBadge.bgClass}`}
                          title={cancelPolicy.reason}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${cancelBadge.dotColor}`} />
                          <span>{cancelBadge.label}</span>
                        </span>
                      )}
                    </div>

                    {(() => {
                      const sla = getRequestRemainingTime(req.requestDate, req.expiryDate);
                      if (req.status === 'expired' || (req.status === 'pending' && sla.isExpired)) {
                        return (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            48h SLA EXPIRED
                          </span>
                        );
                      }
                      if (req.status === 'pending') {
                        return (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 text-amber-600" />
                            {sla.formattedRemaining} left
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="text-left">
                    <span className="text-[10px] uppercase font-mono text-slate-400 block">Total Settlement</span>
                    <span className="text-lg font-mono font-extrabold text-slate-900">
                      ₹{(req.totalAmount || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap justify-end">
                    {req.status === 'accepted' && (
                      <button
                        onClick={() => !isSuspended && setActivePaymentReq(req)}
                        disabled={isSuspended}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all hover:scale-105 cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Pay Escrow</span>
                      </button>
                    )}

                    {(req.status === 'paid' || req.status === 'in transit') && (
                      <Link
                        to={`/hospital/track?txn=${req.transactionId}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-md shadow-primary-600/20 transition-all cursor-pointer"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Track Live Telemetry</span>
                      </Link>
                    )}

                    {/* Cancel Request Action Button */}
                    {cancelPolicy.canCancel && (
                      <button
                        type="button"
                        onClick={() => setCancelModalReq(req)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-all shadow-xs hover:shadow cursor-pointer"
                        title="Cancel this requisition and receive refund based on policy window"
                      >
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Cancel Request</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Workflow Timeline */}
                <div className="pt-2 border-t border-slate-100">
                  <WorkflowTimeline 
                    type="request" 
                    currentStatus={req.status} 
                    timestamp={req.requestDate}
                    isCancelled={isCancelled}
                    cancellationDetails={req.cancellation}
                  />
                </div>

                {/* Cancelled Details Strip */}
                {isCancelled && (
                  <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl text-xs text-rose-950 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-[10px] px-2 py-0.5 rounded bg-rose-200 text-rose-900 uppercase tracking-wider">
                          Cancelled by Buyer
                        </span>
                        <span className="font-bold text-slate-900">
                          Reason: {req.cancellation?.reason || 'Buyer requirement changed'}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-500">
                        {req.cancellation?.cancelledAt ? new Date(req.cancellation.cancelledAt).toLocaleString() : ''}
                      </span>
                    </div>

                    {req.cancellation?.note && (
                      <p className="text-[11px] text-slate-600 italic bg-white/70 p-2.5 rounded-xl border border-rose-100">
                        "{req.cancellation.note}"
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono pt-1 text-slate-700 border-t border-rose-200/60">
                      <span>Window: <strong className="text-slate-800">{req.cancellation?.stageLabel || 'Within 24h'}</strong></span>
                      <span>•</span>
                      <span>Cancellation Fee: <strong className="text-amber-800">₹{(req.cancellation?.penaltyAmount || 0).toLocaleString()} ({req.cancellation?.penaltyPercent || 0}%)</strong></span>
                      <span>•</span>
                      <span>Estimated Refund: <strong className="text-emerald-700 font-bold">₹{(req.cancellation?.refundAmount || 0).toLocaleString()} ({req.cancellation?.refundPercent || 100}%)</strong></span>
                      <span>•</span>
                      <span className="text-slate-500 italic">{req.cancellation?.refundStatus || 'Demo Escrow Processed'}</span>
                    </div>
                  </div>
                )}

                {/* Reject / Expired explanation if applicable */}
                {isRejected && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between">
                    <div>
                      {req.rejectReason?.toLowerCase().includes('first-acceptance') ? (
                        <p className="font-semibold text-amber-900">
                          ⚡ <strong>Auto-Resolved:</strong> {req.rejectReason}
                        </p>
                      ) : (
                        <span>Requisition declined: {req.rejectReason || 'Stock reserved for critical inpatient use.'}</span>
                      )}
                    </div>
                    <button
                      onClick={() => setRejectReasonModal(req)}
                      className="text-xs font-bold underline ml-2 flex-shrink-0"
                    >
                      Audit Details
                    </button>
                  </div>
                )}
                {req.status === 'expired' && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
                    <span>Requisition expired after the 48-hour peer fulfillment window. No funds deducted.</span>
                    <span className="text-[10px] font-mono font-bold text-amber-800">SLA EXPIRED</span>
                  </div>
                )}

                {/* Meta details strip */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Requisition Date: <strong className="text-slate-700">{new Date(req.requestDate).toLocaleDateString()}</strong></span>
                  <span>Quantity: <strong className="text-slate-900 font-bold">{req.quantity} units</strong></span>
                  <span>Logistics SLA: <strong className="text-emerald-700 font-bold">Cold Chain 2°C - 8°C Verified</strong></span>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Send}
          title="No outgoing requisitions found"
          description="Requisitions submitted to peer hospitals for critical medicine stock will appear here."
          impact="Procuring verified near-expiry stock from peers saves up to 80% while solving urgent inpatient shortages."
          actionLabel="Browse Exchange Marketplace"
          actionTo="/hospital/marketplace"
        />
      )}

      {/* Razorpay Escrow Modal */}
      {activePaymentReq && (
        <RazorpayMockModal
          isOpen={!!activePaymentReq}
          onClose={() => setActivePaymentReq(null)}
          request={activePaymentReq}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Cancel Request Confirmation Modal */}
      {cancelModalReq && (
        <CancelRequestModal
          isOpen={!!cancelModalReq}
          onClose={() => setCancelModalReq(null)}
          request={cancelModalReq}
          onConfirmCancel={handleConfirmCancel}
        />
      )}

      {/* Rejection Reason Modal */}
      {rejectReasonModal && (
        <Modal
          isOpen={!!rejectReasonModal}
          onClose={() => setRejectReasonModal(null)}
          title="Requisition Formally Declined"
          subtitle={`Notice recorded by ${rejectReasonModal.toHospitalName}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 pt-1">
            <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase text-rose-700 tracking-wider">
                Audited Reason:
              </span>
              <p className="text-xs text-rose-800 font-medium leading-relaxed">
                {rejectReasonModal.rejectReason || 'Declined due to internal surgical ward quota priority.'}
              </p>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setRejectReasonModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Close Audit Dossier
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default MyRequests;
