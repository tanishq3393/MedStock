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
  ShieldCheck
} from 'lucide-react';
import { fetchOutgoingRequests, payForRequest } from '../../store/slices/requestSlice';
import StatusBadge from '../../components/common/StatusBadge';
import RazorpayMockModal from '../../components/common/RazorpayMockModal';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { isHospitalSuspended } from '../../services/storage';

export const MyRequests = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { outgoingRequests, isLoading } = useSelector((state) => state.requests);
  const isSuspended = isHospitalSuspended(user?.id || 'hosp-1');

  const [activePaymentReq, setActivePaymentReq] = useState(null);
  const [rejectReasonModal, setRejectReasonModal] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    dispatch(fetchOutgoingRequests(user?.id || 'hosp-1'));
  }, [dispatch, user]);

  const handlePaymentSuccess = async ({ requestId, paymentMethod }) => {
    const result = await dispatch(payForRequest({ requestId, paymentMethod }));
    if (result.meta.requestStatus === 'rejected') {
      throw new Error(result.payload || 'Payment could not be processed');
    }
    return result.payload;
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
      rejected: -1
    };
    return map[status.toLowerCase()] ?? 0;
  };

  const filtered = outgoingRequests.filter((r) => {
    const matchesSearch = r.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.toHospitalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.transactionId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeFilter === 'all') return matchesSearch;
    if (activeFilter === 'pending') return matchesSearch && (r.status === 'pending' || r.status === 'reviewing');
    if (activeFilter === 'actionable') return matchesSearch && r.status === 'accepted';
    if (activeFilter === 'transit') return matchesSearch && (r.status === 'paid' || r.status === 'in transit');
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

        <div className="flex items-center gap-1.5 text-xs font-bold w-full sm:w-auto">
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'actionable', label: 'Ready for Escrow' },
            { id: 'transit', label: 'In Transit' },
            { id: 'pending', label: 'Awaiting Approval' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
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
                      <StatusBadge status={req.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono">
                      <span>TXN: <strong className="text-slate-800">{req.transactionId || 'TXN-000000'}</strong></span>
                      <span>•</span>
                      <span>Providing Hospital: <strong className="text-primary-700">{req.toHospitalName}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-mono text-slate-400 block">Total Settlement</span>
                      <span className="text-lg font-mono font-extrabold text-slate-900">
                        ₹{(req.totalAmount || 0).toLocaleString()}
                      </span>
                    </div>

                    {req.status === 'accepted' && (
                      <button
                        onClick={() => !isSuspended && setActivePaymentReq(req)}
                        disabled={isSuspended}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all hover:scale-105"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Pay Escrow</span>
                      </button>
                    )}

                    {(req.status === 'paid' || req.status === 'in transit') && (
                      <Link
                        to={`/hospital/track?txn=${req.transactionId}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-md shadow-primary-600/20 transition-all"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Track Live Telemetry</span>
                      </Link>
                    )}

                    {isRejected && (
                      <button
                        onClick={() => setRejectReasonModal(req)}
                        className="inline-flex items-center gap-1 text-xs text-rose-600 hover:underline font-bold"
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>View Rejection Reason</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Workflow Stepper Pipeline */}
                {!isRejected ? (
                  <div className="pt-2">
                    <div className="grid grid-cols-6 gap-1 sm:gap-2">
                      {stages.map((stg, sIdx) => {
                        const isCompleted = sIdx <= currentStageIdx;
                        const isCurrent = sIdx === currentStageIdx;

                        return (
                          <div key={stg.key} className="space-y-1.5 text-center">
                            <div className="relative">
                              <div
                                className={`h-2 rounded-full transition-colors ${
                                  isCompleted
                                    ? isCurrent
                                      ? 'bg-primary-500 animate-pulse'
                                      : 'bg-emerald-500'
                                    : 'bg-slate-200'
                                }`}
                              />
                            </div>
                            <span className={`text-[10px] font-mono font-bold block truncate ${
                              isCompleted ? 'text-slate-900' : 'text-slate-400'
                            }`}>
                              {stg.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between">
                    <span>Requisition declined by supplying facility. Funds are fully unlocked.</span>
                    <button
                      onClick={() => setRejectReasonModal(req)}
                      className="text-xs font-bold underline"
                    >
                      Audit Details
                    </button>
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
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
          <Send className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="font-bold text-sm text-slate-700">No outgoing requisitions found</p>
          <Link to="/hospital/marketplace" className="text-xs font-bold text-primary-600 underline mt-1 block">
            Explore the marketplace to initiate a requisition
          </Link>
        </div>
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
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg"
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
