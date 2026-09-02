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
  Search
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

  useEffect(() => {
    dispatch(fetchIncomingRequests(user?.id || 'hosp-1'));
  }, [dispatch, user]);

  const handleConfirmAccept = async () => {
    if (!acceptModalReq) return;
    try {
      await dispatch(respondToRequest({ requestId: acceptModalReq.id, action: 'accept' }));
      toast.success(`Accepted requisition from ${acceptModalReq.fromHospitalName}. Awaiting buyer payment.`);
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

  const filtered = incomingRequests.filter((r) =>
    r.fromHospitalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.transactionId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 tracking-tight">Incoming Medicine Requisitions</h1>
          <p className="text-xs text-slate-500">
            Review and approve stock purchase inquiries from peer healthcare institutions in your cluster.
          </p>
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search requesting hospital or medicine..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading && incomingRequests.length === 0 ? (
          <LoadingSpinner text="Fetching incoming requisitions..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5 text-left">Requesting Hospital</th>
                  <th className="px-4 py-3.5 text-left">Requested Medicine</th>
                  <th className="px-4 py-3.5 text-center">Qty Required</th>
                  <th className="px-4 py-3.5 text-right">Order Value</th>
                  <th className="px-4 py-3.5 text-left">Date Received</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-center">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filtered.length > 0 ? (
                  filtered.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 font-bold text-slate-900">
                          <Building2 className="w-4 h-4 text-primary-600 flex-shrink-0" />
                          <span>{req.fromHospitalName}</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          ID: {req.transactionId || req.id}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-bold text-slate-900">{req.medicineName}</div>
                        <span className="text-[11px] text-slate-500 font-medium">{req.power}</span>
                        {req.notes && (
                          <p className="text-[10px] text-slate-500 italic mt-0.5">Note: "{req.notes}"</p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="font-bold text-slate-900 text-sm">{req.quantity}</span>
                        <span className="text-[10px] text-slate-400 block">units</span>
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-slate-900">
                        ₹{(req.totalAmount || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-slate-500">
                        {new Date(req.requestDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="px-5 py-4 text-center">
                        {req.status === 'pending' ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setAcceptModalReq(req)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Accept</span>
                            </button>
                            <button
                              onClick={() => setRejectModalReq(req)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold text-xs transition-all"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium capitalize">
                            Decision Recorded ({req.status})
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                      <Inbox className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="font-semibold">No incoming requisitions currently pending</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Accept Modal with Stock Check */}
      {acceptModalReq && (
        <Modal
          isOpen={!!acceptModalReq}
          onClose={() => setAcceptModalReq(null)}
          title="Confirm Requisition Acceptance"
          subtitle={`Fulfill request from ${acceptModalReq.fromHospitalName}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 pt-1">
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Stock Allocation Verification</span>
              </div>
              <p className="text-emerald-900 leading-relaxed">
                Accepting will automatically earmark <strong>{acceptModalReq.quantity} units</strong> of {acceptModalReq.medicineName} in your pharmacy inventory and prompt buyer for escrow checkout.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Receivable Amount:</span>
                <span className="font-bold text-slate-900">₹{(acceptModalReq.totalAmount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Logistics SLA:</span>
                <span className="font-medium text-slate-800">Cold Chain 2°C - 8°C pickup within 24h</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAcceptModalReq(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAccept}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Authorize & Accept</span>
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
          title="Decline Requisition Inquiry"
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
                placeholder="e.g. Batch is reserved for scheduled ICU surgeries / Low buffer inventory..."
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
