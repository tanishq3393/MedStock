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
  HelpCircle,
  Pill,
  Search,
  ExternalLink
} from 'lucide-react';
import { fetchOutgoingRequests, payForRequest } from '../../store/slices/requestSlice';
import StatusBadge from '../../components/common/StatusBadge';
import RazorpayMockModal from '../../components/common/RazorpayMockModal';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export const MyRequests = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { outgoingRequests, isLoading } = useSelector((state) => state.requests);

  const [activePaymentReq, setActivePaymentReq] = useState(null);
  const [rejectReasonModal, setRejectReasonModal] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    dispatch(fetchOutgoingRequests(user?.id || 'hosp-1'));
  }, [dispatch, user]);

  const handlePaymentSuccess = async ({ requestId, paymentMethod }) => {
    const result = await dispatch(payForRequest({ requestId, paymentMethod }));
    return result.payload;
  };

  const filtered = outgoingRequests.filter((r) =>
    r.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.toHospitalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.transactionId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 tracking-tight">My Outgoing Exchange Requests</h1>
          <p className="text-xs text-slate-500">
            Track requisition statuses submitted to partner hospital pharmacies and proceed to escrow payment.
          </p>
        </div>

        <Link
          to="/hospital/marketplace"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-md shadow-primary-500/20 transition-all"
        >
          <Send className="w-3.5 h-3.5" />
          <span>New Requisition</span>
        </Link>
      </div>

      {/* Search Input */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by medicine, providing hospital, or TXN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading && outgoingRequests.length === 0 ? (
          <LoadingSpinner text="Fetching outgoing requests..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5 text-left">Requisition Info</th>
                  <th className="px-4 py-3.5 text-left">Providing Hospital</th>
                  <th className="px-4 py-3.5 text-center">Quantity</th>
                  <th className="px-4 py-3.5 text-right">Settlement Total</th>
                  <th className="px-4 py-3.5 text-left">Request Date</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filtered.length > 0 ? (
                  filtered.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">{req.medicineName}</div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          TXN: {req.transactionId || 'TXN-000000'}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                          <Building2 className="w-3.5 h-3.5 text-primary-600" />
                          <span>{req.toHospitalName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="font-bold text-slate-900">{req.quantity}</span>
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
                        {req.status === 'accepted' && (
                          <button
                            onClick={() => setActivePaymentReq(req)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all hover:scale-105"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Pay Now (Escrow)</span>
                          </button>
                        )}

                        {req.status === 'paid' && (
                          <Link
                            to={`/hospital/track?txn=${req.transactionId}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200 font-semibold text-xs transition-colors"
                          >
                            <Truck className="w-3.5 h-3.5 text-primary-600" />
                            <span>Track Transit</span>
                          </Link>
                        )}

                        {req.status === 'rejected' && (
                          <button
                            onClick={() => setRejectReasonModal(req)}
                            className="inline-flex items-center gap-1 text-xs text-rose-600 hover:underline font-semibold"
                          >
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>View Reason</span>
                          </button>
                        )}

                        {req.status === 'pending' && (
                          <span className="text-[11px] text-slate-400 italic">
                            Awaiting Hospital Approval
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                      <Send className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="font-semibold">No outgoing requests found</p>
                      <Link to="/hospital/marketplace" className="text-xs font-bold text-primary-600 underline mt-1 block">
                        Browse marketplace to create a request
                      </Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Razorpay Mock Modal */}
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
          title="Exchange Request Declined"
          subtitle={`Notice from ${rejectReasonModal.toHospitalName}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 pt-1">
            <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 space-y-1">
              <span className="text-[10px] font-bold uppercase text-rose-700 tracking-wider">Stated Reason:</span>
              <p className="text-xs text-rose-800 font-medium leading-relaxed">
                {rejectReasonModal.rejectReason || 'Declined due to internal surgical ward quota priority.'}
              </p>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setRejectReasonModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default MyRequests;
