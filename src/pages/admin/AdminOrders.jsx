import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Clock, 
  Building2, 
  Eye, 
  CheckCircle2, 
  AlertTriangle, 
  Truck, 
  Package, 
  FileText, 
  X, 
  Calendar, 
  ArrowUpDown, 
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  ChevronRight,
  Info,
  CreditCard,
  AlertCircle,
  Check,
  Ban,
  ThermometerSnowflake,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import WorkflowTimeline from '../../components/common/WorkflowTimeline';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

// 8-stage lifecycle definition
const LIFECYCLE_STAGES = [
  { key: 'requested', label: 'Requested' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'paid', label: 'Paid' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'dispatched', label: 'Dispatched' },
  { key: 'in transit', label: 'In Transit' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'completed', label: 'Completed' },
];

const FILTER_TABS = [
  { id: 'all', label: 'All Orders' },
  { id: 'requested', label: 'Requested' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'paid', label: 'Paid' },
  { id: 'preparing', label: 'Preparing' },
  { id: 'dispatched', label: 'Dispatched' },
  { id: 'in transit', label: 'In Transit' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'payment pending', label: 'Payment Pending' },
  { id: 'payment failed', label: 'Payment Failed' },
  { id: 'discrepancy', label: 'Discrepancy' },
];

export const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('orderDate');
  const [sortOrder, setSortOrder] = useState('desc');

  // Details Modal
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Status Change Confirmation Modal
  const [confirmStatusModal, setConfirmStatusModal] = useState({
    isOpen: false,
    order: null,
    targetStatus: '',
    note: '',
    isSubmitting: false,
  });

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await adminService.getOrders('all');
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders:', err);
      toast.error('Failed to load orders ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Compute status & category metrics
  const metrics = useMemo(() => {
    const total = orders.length;
    let pendingPayment = 0;
    let inFulfillment = 0;
    let completed = 0;
    let discrepancies = 0;

    orders.forEach((o) => {
      const s = (o.status || '').toLowerCase();
      const ps = (o.paymentStatus || '').toLowerCase();
      if (ps === 'pending' && s === 'accepted') pendingPayment += 1;
      if (['preparing', 'dispatched', 'in transit'].includes(s)) inFulfillment += 1;
      if (s === 'delivered' || s === 'completed') completed += 1;
      if (o.hasDiscrepancy || o.discrepancy) discrepancies += 1;
    });

    return { total, pendingPayment, inFulfillment, completed, discrepancies };
  }, [orders]);

  // Compute tab counts
  const filterCounts = useMemo(() => {
    const counts = {};
    FILTER_TABS.forEach((t) => {
      counts[t.id] = 0;
    });

    orders.forEach((o) => {
      counts['all'] = (counts['all'] || 0) + 1;
      const s = (o.status || '').toLowerCase().trim();
      const ps = (o.paymentStatus || '').toLowerCase().trim();

      if (s === 'pending' || s === 'requested') counts['requested'] = (counts['requested'] || 0) + 1;
      if (s === 'accepted') counts['accepted'] = (counts['accepted'] || 0) + 1;
      if (s === 'paid') counts['paid'] = (counts['paid'] || 0) + 1;
      if (s === 'preparing' || s === 'processing') counts['preparing'] = (counts['preparing'] || 0) + 1;
      if (s === 'dispatched' || s === 'shipped') counts['dispatched'] = (counts['dispatched'] || 0) + 1;
      if (s === 'in transit' || s === 'in_transit') counts['in transit'] = (counts['in transit'] || 0) + 1;
      if (s === 'delivered') counts['delivered'] = (counts['delivered'] || 0) + 1;
      if (s === 'completed') counts['completed'] = (counts['completed'] || 0) + 1;
      if (s === 'cancelled') counts['cancelled'] = (counts['cancelled'] || 0) + 1;
      if (s === 'rejected') counts['rejected'] = (counts['rejected'] || 0) + 1;
      if (ps === 'pending' && s === 'accepted') counts['payment pending'] = (counts['payment pending'] || 0) + 1;
      if (ps === 'failed') counts['payment failed'] = (counts['payment failed'] || 0) + 1;
      if (o.hasDiscrepancy || o.discrepancy) counts['discrepancy'] = (counts['discrepancy'] || 0) + 1;
    });

    return counts;
  }, [orders]);

  // Filtered and sorted orders
  const filteredOrders = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    return orders
      .filter((o) => {
        // Tab filtering
        const s = (o.status || '').toLowerCase().trim();
        const ps = (o.paymentStatus || '').toLowerCase().trim();
        let matchesTab = true;

        if (activeFilter === 'requested') matchesTab = (s === 'pending' || s === 'requested');
        else if (activeFilter === 'accepted') matchesTab = (s === 'accepted');
        else if (activeFilter === 'paid') matchesTab = (s === 'paid');
        else if (activeFilter === 'preparing') matchesTab = (s === 'preparing' || s === 'processing');
        else if (activeFilter === 'dispatched') matchesTab = (s === 'dispatched' || s === 'shipped');
        else if (activeFilter === 'in transit') matchesTab = (s === 'in transit' || s === 'in_transit');
        else if (activeFilter === 'delivered') matchesTab = (s === 'delivered');
        else if (activeFilter === 'completed') matchesTab = (s === 'completed');
        else if (activeFilter === 'cancelled') matchesTab = (s === 'cancelled');
        else if (activeFilter === 'rejected') matchesTab = (s === 'rejected');
        else if (activeFilter === 'payment pending') matchesTab = (ps === 'pending' && s === 'accepted');
        else if (activeFilter === 'payment failed') matchesTab = (ps === 'failed');
        else if (activeFilter === 'discrepancy') matchesTab = Boolean(o.hasDiscrepancy || o.discrepancy);

        // Search matching: Order ID, Medicine, Requesting Hospital, Providing Hospital, Batch
        if (!matchesTab) return false;
        if (!term) return true;

        const orderIdMatch = (o.orderId || '').toLowerCase().includes(term) || (o.transactionId || '').toLowerCase().includes(term);
        const medMatch = (o.medicineName || '').toLowerCase().includes(term) ||
          o.items?.some((it) => (it.name || '').toLowerCase().includes(term) || (it.genericName || '').toLowerCase().includes(term));
        const reqHospMatch = (o.hospital?.name || '').toLowerCase().includes(term) || (o.requestingHospital?.name || '').toLowerCase().includes(term);
        const provHospMatch = (o.fulfillingHospital?.name || '').toLowerCase().includes(term) || (o.providingHospital?.name || '').toLowerCase().includes(term);
        const batchMatch = (o.batchNo || '').toLowerCase().includes(term) ||
          o.items?.some((it) => (it.batchNo || '').toLowerCase().includes(term));

        return orderIdMatch || medMatch || reqHospMatch || provHospMatch || batchMatch;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (sortField === 'totalAmount' || sortField === 'settlementAmount') {
          valA = Number(valA) || 0;
          valB = Number(valB) || 0;
        } else if (sortField === 'quantity' || sortField === 'totalItems') {
          valA = Number(valA) || 0;
          valB = Number(valB) || 0;
        } else {
          valA = String(valA || '').toLowerCase();
          valB = String(valB || '').toLowerCase();
        }
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [orders, activeFilter, searchTerm, sortField, sortOrder]);

  const handleOpenStatusConfirm = (order, newStatus) => {
    setConfirmStatusModal({
      isOpen: true,
      order,
      targetStatus: newStatus,
      note: '',
      isSubmitting: false,
    });
  };

  const handleConfirmStatusChange = async () => {
    const { order, targetStatus, note } = confirmStatusModal;
    if (!order || !targetStatus) return;

    setConfirmStatusModal((prev) => ({ ...prev, isSubmitting: true }));
    try {
      await adminService.updateOrderStatus(order.id, targetStatus, note);
      toast.success(`Order #${order.orderId} moved to ${targetStatus}`);
      setConfirmStatusModal({ isOpen: false, order: null, targetStatus: '', note: '', isSubmitting: false });
      
      await fetchOrders();
      if (selectedOrder && selectedOrder.id === order.id) {
        const freshOrders = await adminService.getOrders('all');
        const updated = freshOrders.find((o) => o.id === order.id);
        if (updated) setSelectedOrder(updated);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to update order status');
      setConfirmStatusModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  // Helper to get active step index for the 8-stage tracker
  const getStageIndex = (status) => {
    const s = (status || '').toLowerCase().trim();
    if (s === 'pending' || s === 'requested' || s === 'reviewing') return 0;
    if (s === 'accepted' || s === 'approved') return 1;
    if (s === 'paid') return 2;
    if (s === 'preparing' || s === 'processing') return 3;
    if (s === 'dispatched' || s === 'shipped') return 4;
    if (s === 'in transit' || s === 'in_transit') return 5;
    if (s === 'delivered') return 6;
    if (s === 'completed') return 7;
    return -1;
  };

  return (
    <div className="space-y-6">
      {/* Refined MediStock Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-ocean-950 via-ocean-900 to-teal-950 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-[radial-gradient(ellipse_at_top_right,rgba(10,110,121,0.25),transparent_70%)] pointer-events-none" />
        
        <div className="relative z-10 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <ShoppingBag className="w-3 h-3 text-teal-400" />
              Central Orders Ledger
            </span>
            <span className="text-xs text-slate-400 font-mono">8-Stage Real-Time Pipeline</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Inter-Hospital Requisitions & Order Fulfillment
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl font-normal leading-relaxed">
            Supervise peer hospital procurements, verify escrow settlements, monitor cold-chain transit telemetries, and maintain unified ledger compliance.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold backdrop-blur-md transition-all border border-white/10 shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Ledger</span>
          </button>
        </div>
      </div>

      {/* Polish Metric Cards Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow transition-all space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Orders</span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-mono font-black text-slate-900">{metrics.total}</div>
          <span className="text-[10px] text-slate-400 font-mono">Peer requisitions logged</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 bg-amber-50/20 shadow-sm hover:shadow transition-all space-y-1">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending Escrow</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-mono font-black text-amber-800">{metrics.pendingPayment}</div>
          <span className="text-[10px] text-amber-700 font-mono">Accepted & awaiting buyer payment</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-primary-200/80 bg-primary-50/20 shadow-sm hover:shadow transition-all space-y-1">
          <div className="flex items-center justify-between text-primary-700">
            <span className="text-[11px] font-bold uppercase tracking-wider">In Fulfillment</span>
            <Truck className="w-4 h-4 text-primary-600" />
          </div>
          <div className="text-2xl font-mono font-black text-primary-800">{metrics.inFulfillment}</div>
          <span className="text-[10px] text-primary-700 font-mono">Preparing, dispatched, or in transit</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 shadow-sm hover:shadow transition-all space-y-1">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-[11px] font-bold uppercase tracking-wider">Completed / Delivered</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-mono font-black text-emerald-800">{metrics.completed}</div>
          <span className="text-[10px] text-emerald-700 font-mono">Verified dock reception</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200/80 bg-rose-50/20 shadow-sm hover:shadow transition-all space-y-1 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-[11px] font-bold uppercase tracking-wider">Discrepancies</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-mono font-black text-rose-800">{metrics.discrepancies}</div>
          <span className="text-[10px] text-rose-700 font-mono">Cold-chain / audit alerts</span>
        </div>
      </div>

      {/* Comprehensive Filter Toolbar & Search Area */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-3.5">
        {/* Search & Sort Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Order ID, medicine, hospital, or batch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span className="font-semibold text-slate-700 font-sans">Sort:</span>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-teal-600"
              >
                <option value="orderDate">Order Date</option>
                <option value="totalAmount">Settlement Amount</option>
                <option value="quantity">Quantity</option>
                <option value="status">Status</option>
              </select>
              <button
                onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 font-bold border border-slate-200"
                title="Toggle sort direction"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>

        {/* 14 Filter Buttons (All Orders, Requested, Accepted, Paid, Preparing, Dispatched, In Transit, Delivered, Completed, Cancelled, Rejected, Payment Pending, Payment Failed, Discrepancy) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-1 border-t border-slate-100 scrollbar-thin">
          {FILTER_TABS.map((tab) => {
            const count = filterCounts[tab.id] || 0;
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders Ledger Presentation */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200/90 shadow-sm">
          <LoadingSpinner size="lg" />
          <p className="mt-3 text-xs font-mono font-medium text-slate-500">Querying inter-hospital order ledger...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Orders Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm
              ? `No requisitions matched your query "${searchTerm}".`
              : `There are currently no orders under the "${activeFilter}" filter.`}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const stageIdx = getStageIndex(order.status);
            const isCancelled = order.status === 'cancelled';
            const isRejected = order.status === 'rejected';

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all p-5 space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        #{order.orderId}
                      </span>
                      {order.urgency === 'Emergency' && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-red-100 text-red-700 border border-red-200 shrink-0">
                          STAT
                        </span>
                      )}
                      {order.hasDiscrepancy && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          DISCREPANCY ALERT
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      <span className="font-bold text-slate-900">{order.medicineName}</span>
                      <span>•</span>
                      <span className="font-mono text-slate-500">Batch: <strong className="text-slate-700">{order.batchNo}</strong></span>
                      <span>•</span>
                      <span className="font-mono text-slate-500">Qty: <strong className="text-slate-900 font-bold">{order.quantity} units</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <StatusBadge status={order.status} />
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Order Dossier</span>
                    </button>
                  </div>
                </div>

                {/* Key Details Grid: Requesting Hospital, Providing Hospital, Settlement, Logistics SLA */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Requesting Hospital</span>
                    <span className="font-bold text-slate-800 block truncate" title={order.hospital?.name}>
                      {order.hospital?.name}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate block">
                      {order.hospital?.city}{order.hospital?.state ? `, ${order.hospital.state}` : ''}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Providing Hospital</span>
                    <span className="font-bold text-slate-800 block truncate" title={order.fulfillingHospital?.name}>
                      {order.fulfillingHospital?.name}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate block">
                      {order.fulfillingHospital?.city}{order.fulfillingHospital?.state ? `, ${order.fulfillingHospital.state}` : ''}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Settlement Amount</span>
                    <span className="font-mono font-black text-slate-900 text-sm block">
                      {formatCurrency(order.settlementAmount || order.totalAmount)}
                    </span>
                    <div className="flex items-center gap-1 pt-0.5">
                      <span className="text-[10px] text-slate-400 font-mono">Payment:</span>
                      <StatusBadge status={order.paymentStatus || 'pending'} />
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Expected Delivery / SLA</span>
                    <span className="font-bold text-slate-800 block">
                      {order.expectedDelivery}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-mono font-semibold block truncate">
                      {order.logisticsSla}
                    </span>
                  </div>
                </div>

                {/* Clean Horizontal 8-Stage Tracker */}
                <div className="pt-1">
                  <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-400 mb-2">
                    <span className="uppercase tracking-wider">Tracking Milestone Progress:</span>
                    <span className="text-slate-700">
                      {isCancelled ? 'Cancelled' : isRejected ? 'Declined' : `Stage ${Math.max(1, stageIdx + 1)} of 8: ${LIFECYCLE_STAGES[stageIdx]?.label || 'Active'}`}
                    </span>
                  </div>

                  {/* 8-Stage Horizontal Node Bar */}
                  <div className="relative py-2">
                    <div className="flex items-center justify-between relative">
                      {/* Background Line */}
                      <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-1 bg-slate-200 z-0" />
                      
                      {/* Filled Progress Line */}
                      {!isCancelled && !isRejected && (
                        <div
                          className="absolute top-1/2 left-0 -translate-y-1/2 h-1 bg-teal-600 transition-all duration-300 z-0"
                          style={{
                            width: `${(Math.max(0, stageIdx) / 7) * 100}%`
                          }}
                        />
                      )}

                      {/* 8 Stage Nodes */}
                      {LIFECYCLE_STAGES.map((st, idx) => {
                        const isCompleted = !isCancelled && !isRejected && idx < stageIdx;
                        const isCurrent = !isCancelled && !isRejected && idx === stageIdx;

                        return (
                          <div key={st.key} className="relative z-10 flex flex-col items-center">
                            <div
                              className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                                isCompleted
                                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-100'
                                  : isCurrent
                                  ? 'bg-teal-700 text-white shadow-md ring-3 ring-teal-100 scale-110'
                                  : 'bg-white border-2 border-slate-300 text-slate-400'
                              }`}
                            >
                              {isCompleted ? (
                                <Check className="w-3 h-3 text-white stroke-[3]" />
                              ) : isCurrent ? (
                                <Clock className="w-3 h-3 text-white animate-pulse" />
                              ) : (
                                <span>{idx + 1}</span>
                              )}
                            </div>
                            <span
                              className={`text-[8px] sm:text-[9px] font-mono mt-1 text-center max-w-[42px] sm:max-w-none break-words leading-tight ${
                                isCurrent
                                  ? 'font-black text-teal-900'
                                  : isCompleted
                                  ? 'font-bold text-slate-700'
                                  : 'text-slate-400'
                              }`}
                            >
                              {st.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Discrepancy Note Banner if present */}
                {order.hasDiscrepancy && order.discrepancy && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Quality Inspection Discrepancy:</span>{' '}
                      <span>{order.discrepancy}</span>
                    </div>
                  </div>
                )}

                {/* Footer Strip */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Requisition Date: <strong className="text-slate-700">{formatDate(order.orderDate)}</strong></span>
                  <span>Logistics SLA: <strong className="text-teal-700">{order.logisticsSla}</strong></span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-sans text-xs">Transition status:</span>
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          handleOpenStatusConfirm(order, e.target.value);
                        }
                      }}
                      className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2.5 py-1 rounded-lg border border-slate-200 cursor-pointer focus:outline-none"
                    >
                      <option value="" disabled>Change Status ▾</option>
                      <option value="Requested" disabled={order.status === 'pending' || order.status === 'requested'}>Requested</option>
                      <option value="Accepted" disabled={order.status === 'accepted'}>Accepted</option>
                      <option value="Paid" disabled={order.status === 'paid'}>Paid</option>
                      <option value="Preparing" disabled={order.status === 'preparing'}>Preparing</option>
                      <option value="Dispatched" disabled={order.status === 'dispatched'}>Dispatched</option>
                      <option value="In Transit" disabled={order.status === 'in transit'}>In Transit</option>
                      <option value="Delivered" disabled={order.status === 'delivered'}>Delivered</option>
                      <option value="Completed" disabled={order.status === 'completed'}>Completed</option>
                      <option value="Cancelled" disabled={order.status === 'cancelled'}>Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Details Modal (Requirements 11, 12, 13) */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Order Requisition #${selectedOrder.orderId}`}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-6 text-slate-800">
            {/* 1. ORDER INFORMATION */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-700 uppercase tracking-wider">
                  <FileText className="w-4 h-4 text-teal-600" />
                  Order Information
                </div>
                <StatusBadge status={selectedOrder.status} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Order ID / TXN</span>
                  <span className="font-mono font-black text-slate-900 text-sm">#{selectedOrder.orderId}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Order Date</span>
                  <span className="font-bold text-slate-800">{formatDate(selectedOrder.orderDate)}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Current Status</span>
                  <span className="font-bold text-teal-800 capitalize">{selectedOrder.status}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Priority</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase inline-block mt-0.5 ${
                    selectedOrder.urgency === 'Emergency' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {selectedOrder.priority}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. MEDICINE DETAILS */}
            <div className="p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100">
                <Package className="w-4 h-4 text-teal-600" />
                Medicine Formulation & Batch Dossier
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div className="col-span-2">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Medicine Name</span>
                  <span className="font-extrabold text-slate-900 text-sm">{selectedOrder.medicineName}</span>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    {selectedOrder.items?.[0]?.genericName || 'Active Formulation'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Quantity</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{selectedOrder.quantity} units</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Batch Number</span>
                  <span className="font-mono font-bold text-teal-800">{selectedOrder.batchNo}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Expiry Date</span>
                  <span className="font-mono text-slate-700">{formatDate(selectedOrder.expiryDate)}</span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Manufacturing Date</span>
                  <span className="font-mono text-slate-600">{formatDate(selectedOrder.mfgDate)}</span>
                </div>
              </div>
            </div>

            {/* 3. HOSPITALS (REQUESTING & PROVIDING) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-slate-200 space-y-2 bg-slate-50/50">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-200/60">
                  <Building2 className="w-4 h-4 text-teal-600" />
                  Requesting Hospital (Buyer)
                </div>
                <div className="text-xs space-y-1">
                  <div className="font-bold text-slate-900 text-sm">{selectedOrder.hospital?.name}</div>
                  <div className="text-slate-500">Reg: <strong className="text-slate-700">{selectedOrder.hospital?.registrationNo || 'MH-GOV-8821'}</strong></div>
                  <div className="text-slate-500">Location: {selectedOrder.hospital?.city}{selectedOrder.hospital?.state ? `, ${selectedOrder.hospital.state}` : ''}</div>
                  <div className="text-slate-500">Contact: {selectedOrder.hospital?.phone || selectedOrder.hospital?.contact || '+91 98201 54321'}</div>
                  <div className="text-slate-500">Email: {selectedOrder.hospital?.email || 'procurement@hospital.org'}</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 space-y-2 bg-slate-50/50">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-200/60">
                  <Building2 className="w-4 h-4 text-teal-600" />
                  Providing Hospital (Seller)
                </div>
                <div className="text-xs space-y-1">
                  <div className="font-bold text-slate-900 text-sm">{selectedOrder.fulfillingHospital?.name}</div>
                  <div className="text-slate-500">Reg: <strong className="text-slate-700">{selectedOrder.fulfillingHospital?.registrationNo || 'HR-MED-4412'}</strong></div>
                  <div className="text-slate-500">Location: {selectedOrder.fulfillingHospital?.city}{selectedOrder.fulfillingHospital?.state ? `, ${selectedOrder.fulfillingHospital.state}` : ''}</div>
                  <div className="text-slate-500">Contact: {selectedOrder.fulfillingHospital?.phone || selectedOrder.fulfillingHospital?.contact || '+91 98112 33445'}</div>
                  <div className="text-slate-500">Email: {selectedOrder.fulfillingHospital?.email || 'seller@hospital.org'}</div>
                </div>
              </div>
            </div>

            {/* 4. PAYMENT & ESCROW */}
            <div className="p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-700 uppercase tracking-wider">
                  <CreditCard className="w-4 h-4 text-teal-600" />
                  Escrow & Settlement
                </div>
                <StatusBadge status={selectedOrder.paymentStatus || 'pending'} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Settlement Amount</span>
                  <span className="font-mono font-black text-slate-900 text-base">
                    {formatCurrency(selectedOrder.settlementAmount || selectedOrder.totalAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Payment Status</span>
                  <span className="font-bold capitalize text-slate-800">{selectedOrder.paymentStatus || 'pending'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Payment Date / Time</span>
                  <span className="font-mono text-slate-700">
                    {selectedOrder.paidDate ? new Date(selectedOrder.paidDate).toLocaleString() : 'Payment Pending'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Payment Reference</span>
                  <span className="font-mono text-slate-600 truncate block">
                    {selectedOrder.paymentReference || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* 5. LOGISTICS & SLA */}
            <div className="p-4 rounded-2xl border border-slate-200 space-y-3 bg-slate-50/50">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-200/60">
                <Truck className="w-4 h-4 text-teal-600" />
                Logistics Telemetry & SLA Compliance
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Dispatch Information</span>
                  <span className="font-bold text-slate-800">
                    {selectedOrder.trackingInfo?.courierName || 'MediCold Logistics Express'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    {selectedOrder.trackingInfo?.vehicleNo || 'Temp-Controlled Carrier'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">In Transit Telemetry</span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedOrder.trackingInfo?.temperature || '3.8°C Certified'}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Location: {selectedOrder.trackingInfo?.currentLocation || 'Corridor Transit'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Expected Delivery</span>
                  <span className="font-bold text-slate-800">{selectedOrder.expectedDelivery}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Logistics SLA</span>
                  <span className="font-mono font-bold text-emerald-700">{selectedOrder.logisticsSla}</span>
                </div>
              </div>

              {selectedOrder.hasDiscrepancy && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 mt-2">
                  <span className="font-bold">Logged Discrepancy Note:</span> {selectedOrder.discrepancy}
                </div>
              )}
            </div>

            {/* 8-STAGE HORIZONTAL TRACKER */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" />
                8-Stage Fulfillment Lifecycle
              </h4>
              <WorkflowTimeline 
                type="request" 
                currentStatus={selectedOrder.status} 
                timestamp={selectedOrder.orderDate}
              />
            </div>

            {/* DETAILED AUDIT TIMELINE */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                Audit Trail & Milestone Chronology
              </h4>
              <div className="space-y-3 pl-3 border-l-2 border-teal-500/30 ml-2">
                {selectedOrder.statusHistory?.map((step, sIdx) => (
                  <div key={sIdx} className="relative pl-4">
                    <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-teal-600 ring-4 ring-teal-100" />
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-bold text-xs text-slate-900">{step.status}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{step.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{step.note}</p>
                    {step.actor && (
                      <span className="text-[10px] text-teal-700 font-mono font-semibold block mt-0.5">
                        Recorded by: {step.actor}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Close Dossier
              </button>

              <div className="flex items-center gap-2 flex-wrap">
                {['Preparing', 'Dispatched', 'In Transit', 'Delivered', 'Completed'].map((st) => (
                  <button
                    key={st}
                    disabled={selectedOrder.status === st.toLowerCase()}
                    onClick={() => handleOpenStatusConfirm(selectedOrder, st)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Advance to {st}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Dialog for Status Change */}
      {confirmStatusModal.isOpen && (
        <Modal
          isOpen={confirmStatusModal.isOpen}
          onClose={() => setConfirmStatusModal({ isOpen: false, order: null, targetStatus: '', note: '', isSubmitting: false })}
          title="Confirm Order Status Transition"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-slate-800">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Administrative Protocol:</span> Are you sure you want to transition Order{' '}
                <span className="font-mono font-bold">#{confirmStatusModal.order?.orderId}</span> to{' '}
                <span className="font-bold uppercase tracking-wider">{confirmStatusModal.targetStatus}</span>?
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Audit Note / Dispatch Remark (Optional):</label>
              <textarea
                value={confirmStatusModal.note}
                onChange={(e) => setConfirmStatusModal((prev) => ({ ...prev, note: e.target.value }))}
                placeholder="e.g. Cold-chain seal inspected, airway bill assigned, or buyer verification approved..."
                rows="3"
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmStatusModal({ isOpen: false, order: null, targetStatus: '', note: '', isSubmitting: false })}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Dismiss
              </button>
              <button
                type="button"
                disabled={confirmStatusModal.isSubmitting}
                onClick={handleConfirmStatusChange}
                className="px-4 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow transition-all cursor-pointer disabled:opacity-50"
              >
                {confirmStatusModal.isSubmitting ? 'Updating...' : `Confirm → ${confirmStatusModal.targetStatus}`}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminOrders;
