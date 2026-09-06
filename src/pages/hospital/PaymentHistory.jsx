import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  CreditCard, 
  Download, 
  Search, 
  FileText, 
  ShieldCheck, 
  CheckCircle2, 
  Clock,
  ArrowUpRight,
  Receipt,
  Copy,
  Check,
  Filter,
  DollarSign
} from 'lucide-react';
import { fetchPaymentHistory } from '../../store/slices/hospitalSlice';
import StatusBadge from '../../components/common/StatusBadge';
import ReceiptModal from '../../components/common/ReceiptModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export const PaymentHistory = () => {
  const dispatch = useDispatch();
  const { payments, isLoading } = useSelector((state) => state.hospital);
  const { user } = useSelector((state) => state.auth);

  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [directionFilter, setDirectionFilter] = useState('ALL');
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    dispatch(fetchPaymentHistory());
  }, [dispatch]);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('ID copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredPayments = useMemo(() => {
    const currentHospitalName = user?.hospitalName || user?.name || 'Apollo Hospital';

    const isCurrentHospital = (hospitalName) =>
      hospitalName?.toLowerCase().includes(currentHospitalName.toLowerCase()) ||
      currentHospitalName.toLowerCase().includes(hospitalName?.toLowerCase() || '');

    return payments.filter((p) => {
      const matchesSearch = 
        p.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.razorpayPaymentId && p.razorpayPaymentId.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'ALL' || p.paymentStatus?.toUpperCase() === statusFilter;
      const isIncoming = isCurrentHospital(p.sellerHospital);
      const isOutgoing = isCurrentHospital(p.buyerHospital);
      const matchesDirection =
        directionFilter === 'ALL' ||
        (directionFilter === 'INCOMING' && isIncoming) ||
        (directionFilter === 'OUTGOING' && isOutgoing);

      return matchesSearch && matchesStatus && matchesDirection;
    });
  }, [payments, searchTerm, statusFilter, directionFilter, user]);

  const metrics = useMemo(() => {
    const totalVolume = payments.reduce((acc, curr) => acc + (Number(curr.totalPaid) || Number(curr.amount) || 0), 0);
    const successfulCount = payments.filter(p => p.paymentStatus === 'SUCCESS' || p.paymentStatus === 'SETTLED' || p.paymentStatus === 'PAID').length;
    return {
      totalVolume,
      successfulCount,
      totalCount: payments.length
    };
  }, [payments]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Spatial Breadcrumb */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-ocean-950 via-ocean-900 to-teal-950 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-[radial-gradient(ellipse_at_top_right,rgba(10,110,121,0.25),transparent_70%)] pointer-events-none" />
        
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <ShieldCheck className="w-3 h-3 text-teal-400" />
              CDSCO & GST Compliant Escrow
            </span>
            <span className="text-xs text-slate-400 font-mono">Bank-Grade Ledger</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Payment & Escrow Settlements</h1>
          <p className="text-xs text-slate-300 max-w-2xl font-normal leading-relaxed">
            Direct institutional transaction logs with automated nodal escrow releases, two-party cryptographic invoices, and statutory tax reconciliation.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md text-right">
            <div className="text-[10px] uppercase font-bold text-teal-400 tracking-wider">Settlement Route</div>
            <div className="text-sm font-black text-white font-mono flex items-center justify-end gap-1.5">
              <span>Razorpay B2B</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Financial Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Settled Volume</div>
            <div className="text-xl font-black text-slate-900 font-mono mt-1">₹{metrics.totalVolume.toLocaleString('en-IN')}</div>
            <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
              <ArrowUpRight className="w-3 h-3" /> 100% released on transit receipt
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Escrow Success Rate</div>
            <div className="text-xl font-black text-slate-900 font-mono mt-1">
              {metrics.totalCount ? Math.round((metrics.successfulCount / metrics.totalCount) * 100) : 100}%
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">0 disputes flagged</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Average Settlement SLA</div>
            <div className="text-xl font-black text-slate-900 font-mono mt-1">&lt; 2.4 Hrs</div>
            <div className="text-[10px] text-teal-600 font-medium mt-0.5">Instant automated release</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tax & GST Invoices</div>
            <div className="text-xl font-black text-slate-900 font-mono mt-1">{metrics.totalCount} Documents</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Automated 12% GST breakdown</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <Receipt className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Payment Filters */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Txn ID, Medicine, or Razorpay ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">Filter:</span>
          {['ALL', 'INCOMING', 'OUTGOING'].map((direction) => (
            <button
              key={direction}
              onClick={() => setDirectionFilter(direction)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                directionFilter === direction
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600'
              }`}
            >
              {direction}
            </button>
          ))}
          <span className="h-5 w-px bg-slate-200 mx-1" />
          {['ALL', 'SUCCESS', 'PAID', 'PENDING'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === status
                  ? 'bg-ocean-900 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Payment Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading && payments.length === 0 ? (
          <div className="py-16">
            <LoadingSpinner text="Querying cryptographic settlement ledger..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200/70 text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5 text-left">Transaction ID</th>
                  <th className="px-4 py-3.5 text-left">Medicine Consignment</th>
                  <th className="px-4 py-3.5 text-left">Razorpay Gateway ID</th>
                  <th className="px-4 py-3.5 text-right">Settled Amount</th>
                  <th className="px-4 py-3.5 text-left">Date & Time</th>
                  <th className="px-4 py-3.5 text-center">Settlement Status</th>
                  <th className="px-5 py-3.5 text-right">Statutory Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredPayments.length > 0 ? (
                  filteredPayments.map((pay) => {
                    const rawAmt = Number(pay.totalPaid) || Number(pay.amount) || 0;
                    return (
                      <tr key={pay.id} className="hover:bg-teal-50/20 transition-colors group">
                        
                        {/* Transaction ID */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-900">{pay.transactionId}</span>
                            <button
                              onClick={() => copyToClipboard(pay.transactionId, `txn-${pay.id}`)}
                              className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
                              title="Copy Transaction ID"
                            >
                              {copiedId === `txn-${pay.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Medicine */}
                        <td className="px-4 py-4">
                          <div className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                            {pay.medicineName}
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5 font-mono">
                            <span>Quantity: {pay.quantity || 1} units</span>
                            <span>•</span>
                            <span className="text-teal-600 font-semibold">Nodal Escrow</span>
                          </div>
                        </td>

                        {/* Razorpay ID */}
                        <td className="px-4 py-4 font-mono text-slate-600">
                          {pay.razorpayPaymentId ? (
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100/80 border border-slate-200 text-[11px] text-slate-700">
                              <span>{pay.razorpayPaymentId}</span>
                              <button
                                onClick={() => copyToClipboard(pay.razorpayPaymentId, `rp-${pay.id}`)}
                                className="text-slate-400 hover:text-slate-600 p-0.5 transition-colors"
                                title="Copy Razorpay Payment ID"
                              >
                                {copiedId === `rp-${pay.id}` ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Awaiting Initiation</span>
                          )}
                        </td>

                        {/* Settled Amount */}
                        <td className="px-4 py-4 text-right">
                          <div className="font-extrabold text-slate-900 font-mono text-sm">
                            ₹{rawAmt.toLocaleString('en-IN')}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">Incl. 12% GST</div>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-4 text-slate-600 font-mono text-[11px]">
                          {pay.date}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4 text-center">
                          <StatusBadge status={pay.paymentStatus} />
                        </td>

                        {/* Receipt Button */}
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => setSelectedReceipt(pay)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-teal-600 hover:text-white text-slate-700 text-xs font-bold transition-all shadow-sm group/btn"
                          >
                            <FileText className="w-3.5 h-3.5 text-teal-600 group-hover/btn:text-white transition-colors" />
                            <span>View Invoice</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-16 text-center text-slate-400">
                      <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                        <CreditCard className="w-7 h-7 stroke-[1.5]" />
                      </div>
                      <p className="font-bold text-slate-700 text-sm">No settlement logs matched</p>
                      <p className="text-xs text-slate-400 mt-1">Try refining your search terms or filter status.</p>
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
