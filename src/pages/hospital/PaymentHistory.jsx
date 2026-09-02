import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  CreditCard, 
  Download, 
  Search, 
  FileText, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Printer
} from 'lucide-react';
import { fetchPaymentHistory } from '../../store/slices/hospitalSlice';
import StatusBadge from '../../components/common/StatusBadge';
import ReceiptModal from '../../components/common/ReceiptModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const PaymentHistory = () => {
  const dispatch = useDispatch();
  const { payments, isLoading } = useSelector((state) => state.hospital);

  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    dispatch(fetchPaymentHistory());
  }, [dispatch]);

  const filteredPayments = payments.filter((p) =>
    p.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.razorpayPaymentId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 tracking-tight">Payment & Escrow Settlements</h1>
          <p className="text-xs text-slate-500">
            Audit trail of all B2B Razorpay transactions, GST invoices, and escrow fund releases.
          </p>
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Transaction ID or Razorpay Payment ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
          />
        </div>
      </div>

      {/* Payment Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading && payments.length === 0 ? (
          <LoadingSpinner text="Fetching financial settlement logs..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5 text-left">Transaction ID</th>
                  <th className="px-4 py-3.5 text-left">Medicine Consignment</th>
                  <th className="px-4 py-3.5 text-left">Razorpay Payment ID</th>
                  <th className="px-4 py-3.5 text-right">Settled Amount</th>
                  <th className="px-4 py-3.5 text-left">Date & Time</th>
                  <th className="px-4 py-3.5 text-center">Payment Status</th>
                  <th className="px-5 py-3.5 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredPayments.length > 0 ? (
                  filteredPayments.map((pay) => (
                    <tr key={pay.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-slate-800">
                        {pay.transactionId}
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-bold text-slate-900">{pay.medicineName}</div>
                        <span className="text-[10px] text-slate-400">Qty: {pay.quantity} units</span>
                      </td>
                      <td className="px-4 py-4 font-mono text-slate-600">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]">
                          {pay.razorpayPaymentId || 'Awaiting Initiation'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right font-extrabold text-slate-900">
                        ₹{(pay.totalPaid || pay.amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-slate-500">
                        {pay.date}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <StatusBadge status={pay.paymentStatus} />
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => setSelectedReceipt(pay)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 text-primary-600" />
                          <span>View Invoice</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                      <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="font-semibold">No payment records found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice / Tax Receipt Modal */}
      {selectedReceipt && (
        <ReceiptModal
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          payment={selectedReceipt}
        />
      )}

    </div>
  );
};

export default PaymentHistory;
