import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Inbox, 
  Check, 
  X, 
  Building2, 
  Calendar, 
  Boxes, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck,
  Search,
  Truck,
  Sparkles
} from 'lucide-react';
import { fetchIncomingRequests, respondToRequest } from '../../store/slices/requestSlice';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export const IncomingRequests = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { incomingRequests, isLoading } = useSelector((state) => state.requests);

  const [acceptModalReq, setAcceptModalReq] = useState(null);
  const [rejectModalReq, setRejectModalReq] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState('pending'); // 'pending' | 'accepted' | 'all'

  useEffect(() => {
    dispatch(fetchIncomingRequests(user?.id || 'hosp-1'));
  }, [dispatch, user]);

  const handleConfirmAccept = async () => {
    if (!acceptModalReq) return;
    try {
      await dispatch(respondToRequest({ requestId: acceptModalReq.id, action: 'accept' }));
      toast.success(`Accepted requisition from ${acceptModalReq.fromHospitalName}. Earmarked inventory lot.`);
      setAcceptModalReq(null);
    } catch (err) {
      toast.error('Failed to accept request');
    }
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectModalReq) return;
    try {
      await dispatch(respondToRequest({ 
        requestId: rejectModalReq.id, 
        action: 'reject', 
        reason: rejectReason || 'Stock reserved for critical inpatient use.'
      }));
      toast.success(`Declined requisition from ${rejectModalReq.fromHospitalName}`);
      setRejectModalReq(null);
      setRejectReason('');
    } catch (err) {
      toast.error('Failed to reject request');
    }
  };

  const filtered = incomingRequests.filter((r) => {
    const matchesSearch = r.fromHospitalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.transactionId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterTab === 'all') return matchesSearch;
    if (filterTab === 'pending') return matchesSearch && r.status === 'pending';
    if (filterTab === 'accepted') return matchesSearch && (r.status === 'accepted' || r.status === 'paid');
    return matchesSearch;
  });

  const pendingCount = incomingRequests.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-secondary-900 tracking-tight">
              Incoming Medicine Requisitions
            </h1>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-full">
                {pendingCount} PENDING ACTION
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Review and authorize stock purchase requisitions submitted by peer healthcare institutions in your cluster.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search requesting hospital or medicine..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold">
          <button
            onClick={() => setFilterTab('pending')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filterTab === 'pending'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Pending Decision ({pendingCount})
          </button>
          <button
            onClick={() => setFilterTab('accepted')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filterTab === 'accepted'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Authorized Orders
          </button>
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filterTab === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Requisitions
          </button>
        </div>
      </div>

      {/* Incoming Requests Cards */}
      {isLoading && incomingRequests.length === 0 ? (
        <LoadingSpinner text="Querying pending requisitions..." />
      ) : filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((req) => {
            const isPending = req.status === 'pending';

            return (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all p-5 space-y-4"
              >
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                          {req.fromHospitalName}
                        </h3>
                        <p className="text-[10px] font-mono text-slate-400">
                          ID: {req.transactionId || req.id} • Received: {new Date(req.requestDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-mono text-slate-400 block">Receivable Total</span>
                      <span className="text-lg font-mono font-extrabold text-primary-800">
                        ₹{(req.totalAmount || 0).toLocaleString()}
                      </span>
                    </div>

                    <StatusBadge status={req.status} />

                    {isPending ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setAcceptModalReq(req)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all hover:scale-105"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept & Earmark</span>
                        </button>

                        <button
                          onClick={() => setRejectModalReq(req)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold text-xs transition-all"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Decline</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs font-mono font-bold text-slate-500 capitalize">
                        {req.status === 'paid' ? 'Payment Escrowed' : `Status: ${req.status}`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Requested Item Detail */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-slate-900 text-sm">{req.medicineName}</span>
                    <span className="text-[11px] font-mono text-slate-500 block font-semibold">{req.power}</span>
                    {req.notes && (
                      <p className="text-[11px] text-slate-600 italic mt-1">"{req.notes}"</p>
                    )}
                  </div>

                  <div className="flex items-center gap-6 font-mono text-xs">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Quantity Requested</span>
                      <span className="font-extrabold text-slate-900 text-sm">{req.quantity} units</span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Cold Chain Protocol</span>
                      <span className="font-bold text-emerald-700 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        2°C - 8°C Verified
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
          <Inbox className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="font-bold text-sm text-slate-700">No incoming requisitions currently in this queue</p>
        </div>
      )}

      {/* Confirm Accept Modal with Stock Check */}
      {acceptModalReq && (
        <Modal
          isOpen={!!acceptModalReq}
          onClose={() => setAcceptModalReq(null)}
          title="Authorize Requisition Acceptance"
          subtitle={`Supply ${acceptModalReq.quantity} units to ${acceptModalReq.fromHospitalName}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 pt-1">
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Inventory Earmark Confirmation</span>
              </div>
              <p className="text-emerald-800 leading-relaxed text-[11px]">
                Acceptance immediately locks <strong>{acceptModalReq.quantity} units</strong> of {acceptModalReq.medicineName} in your central pharmacy inventory and enables buyer checkout via Razorpay Escrow.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Escrow Settlement Receivable:</span>
                <span className="font-extrabold text-slate-900">₹{(acceptModalReq.totalAmount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Logistics Fulfillment:</span>
                <span className="font-bold text-primary-700">Cold Chain Courier dispatch within 24h</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAcceptModalReq(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAccept}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirm & Earmark Stock</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Modal with Reason input */}
      {rejectModalReq && (
        <Modal
          isOpen={!!rejectModalReq}
          onClose={() => setRejectModalReq(null)}
          title="Decline Medicine Requisition"
          subtitle={`Provide clinical or stock allocation reason to ${rejectModalReq.fromHospitalName}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleConfirmReject} className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reason for Rejection <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows="3"
                required
                placeholder="e.g. Batch is reserved for internal surgical emergencies / Buffer quota reached..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalReq(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
              >
                Confirm Decline
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};

export default IncomingRequests;
