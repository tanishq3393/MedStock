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
  Info
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const STATUS_TABS = [
  { id: 'all', label: 'All Orders' },
  { id: 'pending', label: 'Pending' },
  { id: 'processing', label: 'Processing' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
];

export const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
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
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Compute status counts
  const statusCounts = useMemo(() => {
    const counts = { all: orders.length, pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
    orders.forEach((o) => {
      const s = (o.status || '').toLowerCase();
      if (counts[s] !== undefined) {
        counts[s] += 1;
      }
    });
    return counts;
  }, [orders]);

  // Filtered & Sorted orders
  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => {
        const matchesTab = activeTab === 'all' || o.status.toLowerCase() === activeTab.toLowerCase();
        const matchesSearch = 
          o.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.hospital?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.hospital?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.items?.some((it) => it.name?.toLowerCase().includes(searchTerm.toLowerCase()) || it.genericName?.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesTab && matchesSearch;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (sortField === 'totalAmount') {
          valA = Number(valA) || 0;
          valB = Number(valB) || 0;
        } else if (sortField === 'totalItems') {
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
  }, [orders, activeTab, searchTerm, sortField, sortOrder]);

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
      toast.success(`Order #${order.orderId} transitioned to ${targetStatus}`);
      setConfirmStatusModal({ isOpen: false, order: null, targetStatus: '', note: '', isSubmitting: false });
      
      // Update local state and details modal if open
      await fetchOrders();
      if (selectedOrder && selectedOrder.id === order.id) {
        const updated = (await adminService.getOrders('all')).find((o) => o.id === order.id);
        if (updated) setSelectedOrder(updated);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update order status');
      setConfirmStatusModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-ocean-950 via-ocean-900 to-teal-950 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-[radial-gradient(ellipse_at_top_right,rgba(10,110,121,0.25),transparent_70%)] pointer-events-none" />
        
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <ShoppingBag className="w-3 h-3 text-teal-400" />
              Central Requisition Exchange
            </span>
            <span className="text-xs text-slate-400 font-mono">Real-time Order Dispatch</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Inter-Hospital Orders & Fulfillment</h1>
          <p className="text-xs text-slate-300 max-w-xl font-normal">
            Monitor institutional requisitions, verify cold-chain allocation, inspect line items, and coordinate inter-facility logistics.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold backdrop-blur-md transition-colors border border-white/10"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync Ledger
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap items-center gap-2 pb-1 border-b border-slate-200">
        {STATUS_TABS.map((tab) => {
          const count = statusCounts[tab.id] || 0;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Order ID, hospital, city, or medicine..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span className="font-semibold text-slate-700">Sort:</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-teal-600"
            >
              <option value="orderDate">Order Date</option>
              <option value="totalAmount">Total Value</option>
              <option value="totalItems">Item Quantity</option>
              <option value="status">Status</option>
            </select>
            <button
              onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 font-bold"
              title="Toggle sort direction"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <LoadingSpinner size="lg" />
          <p className="mt-3 text-xs font-medium text-slate-500 font-mono">Synchronizing requisitions ledger...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Orders Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm
              ? `No requisitions matched your query "${searchTerm}".`
              : `There are currently no orders under the "${activeTab}" status category.`}
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
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden w-full max-w-full">
          {/* Desktop & Tablet Table (No horizontal scrollbar, 100% table-fixed layout) */}
          <div className="hidden md:block w-full overflow-hidden">
            <table className="w-full text-left border-collapse table-fixed text-xs">
              <colgroup>
                <col style={{ width: '16%' }} /> {/* Order ID */}
                <col style={{ width: '23%' }} /> {/* Hospital / Requester */}
                <col style={{ width: '9%' }} />  {/* Items */}
                <col style={{ width: '13%' }} /> {/* Order Date */}
                <col style={{ width: '12%' }} /> {/* Total Amount */}
                <col style={{ width: '12%' }} /> {/* Status */}
                <col style={{ width: '15%' }} /> {/* Actions */}
              </colgroup>
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-3">Order ID</th>
                  <th className="py-3 px-2.5">Hospital / Requester</th>
                  <th className="py-3 px-2 text-center">Items</th>
                  <th className="py-3 px-2">Order Date</th>
                  <th className="py-3 px-2 text-right">Total Amount</th>
                  <th className="py-3 px-2 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/60 transition-colors group">
                    
                    {/* Order ID */}
                    <td className="py-3 px-3 overflow-hidden">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono font-bold text-slate-900 truncate text-xs">#{order.orderId}</span>
                        {order.urgency === 'Emergency' && (
                          <span className="px-1 py-0.5 rounded text-[9px] font-black uppercase bg-red-100 text-red-700 border border-red-200 shrink-0">
                            STAT
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium truncate block" title={order.items?.[0]?.name}>
                        {order.items?.[0]?.name || 'Pharmaceutical Package'}
                      </span>
                    </td>

                    {/* Hospital / Requester */}
                    <td className="py-3 px-2.5 overflow-hidden">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                          <Building2 className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-800 truncate text-xs" title={order.hospital?.name}>
                            {order.hospital?.name || 'Hospital Facility'}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium truncate" title={`${order.hospital?.city || ''}, ${order.hospital?.state || ''}`}>
                            {order.hospital?.city || 'Facility Node'}{order.hospital?.state ? `, ${order.hospital.state}` : ''}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Items */}
                    <td className="py-3 px-2 text-center overflow-hidden font-mono font-semibold text-slate-700">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs whitespace-nowrap">
                        {order.totalItems} units
                      </span>
                    </td>

                    {/* Order Date */}
                    <td className="py-3 px-2 overflow-hidden text-slate-600">
                      <span className="font-mono font-medium text-xs block truncate" title={order.orderDate}>
                        {formatDate(order.orderDate)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block truncate">
                        {order.orderDate && !isNaN(new Date(order.orderDate).getTime()) 
                          ? new Date(order.orderDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'Recorded'}
                      </span>
                    </td>

                    {/* Total Amount */}
                    <td className="py-3 px-2 text-right overflow-hidden font-mono font-bold text-slate-900 text-xs whitespace-nowrap">
                      {formatCurrency(order.totalAmount)}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-2 text-center overflow-hidden">
                      <StatusBadge status={order.status} />
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right overflow-hidden">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-2 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-[11px] font-semibold transition-colors flex items-center gap-1 shrink-0"
                          title="View Order Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Details</span>
                        </button>

                        {/* Quick Action Menu */}
                        <div className="relative shrink-0">
                          <select
                            value=""
                            onChange={(e) => {
                              if (e.target.value) {
                                handleOpenStatusConfirm(order, e.target.value);
                              }
                            }}
                            className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2 py-1 rounded-lg border border-slate-200 cursor-pointer focus:outline-none"
                          >
                            <option value="" disabled>Status ▾</option>
                            <option value="Pending" disabled={order.status === 'Pending'}>Mark Pending</option>
                            <option value="Processing" disabled={order.status === 'Processing'}>Mark Processing</option>
                            <option value="Shipped" disabled={order.status === 'Shipped'}>Mark Shipped</option>
                            <option value="Delivered" disabled={order.status === 'Delivered'}>Mark Delivered</option>
                            <option value="Cancelled" disabled={order.status === 'Cancelled'}>Cancel Requisition</option>
                          </select>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List (< md) */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredOrders.map((order) => (
              <div key={order.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-900 text-xs">#{order.orderId}</span>
                      {order.urgency === 'Emergency' && (
                        <span className="px-1 py-0.5 rounded text-[9px] font-black uppercase bg-red-100 text-red-700 border border-red-200">
                          STAT
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium truncate block">
                      {order.items?.[0]?.name || 'Pharmaceutical Package'}
                    </span>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Hospital</span>
                    <span className="text-slate-800 font-bold truncate block">{order.hospital?.name}</span>
                    <span className="text-[10px] text-slate-400 truncate block">{order.hospital?.city}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Value</span>
                    <span className="font-mono font-bold text-slate-900">{formatCurrency(order.totalAmount)}</span>
                    <span className="text-[10px] text-slate-400 block">{order.totalItems} units</span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Date: {formatDate(order.orderDate)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Details
                  </button>
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleOpenStatusConfirm(order, e.target.value);
                      }
                    }}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2 py-1.5 rounded-lg border border-slate-200 cursor-pointer focus:outline-none"
                  >
                    <option value="" disabled>Status ▾</option>
                    <option value="Pending" disabled={order.status === 'Pending'}>Mark Pending</option>
                    <option value="Processing" disabled={order.status === 'Processing'}>Mark Processing</option>
                    <option value="Shipped" disabled={order.status === 'Shipped'}>Mark Shipped</option>
                    <option value="Delivered" disabled={order.status === 'Delivered'}>Mark Delivered</option>
                    <option value="Cancelled" disabled={order.status === 'Cancelled'}>Cancel Requisition</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Showing {filteredOrders.length} of {orders.length} orders</span>
            <span className="font-mono text-[11px] text-slate-400">Ledger checksum verified</span>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Order Requisition #${selectedOrder.orderId}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-6 text-slate-800">
            {/* Status & Overview Banner */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-500">Order Placed:</span>
                  <span className="text-xs font-bold text-slate-800">{selectedOrder.orderDate}</span>
                </div>
                <div className="text-xs text-slate-500">
                  Fulfilling Provider: <span className="font-semibold text-slate-700">{selectedOrder.fulfillingHospital?.name || 'Central Pharmacy Depo'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <StatusBadge status={selectedOrder.status} />
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total Value</div>
                  <div className="text-lg font-black font-mono text-teal-700">
                    {formatCurrency(selectedOrder.totalAmount)}
                  </div>
                </div>
              </div>
            </div>

            {/* Hospital Information Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
                  <Building2 className="w-4 h-4 text-teal-600" />
                  Requester Hospital
                </div>
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-slate-800">{selectedOrder.hospital?.name}</div>
                  <div className="text-slate-500">Reg: {selectedOrder.hospital?.registrationNo || 'MH-GOV-8821'}</div>
                  <div className="text-slate-500">Location: {selectedOrder.hospital?.city}, {selectedOrder.hospital?.state}</div>
                  <div className="text-slate-500">Contact: {selectedOrder.hospital?.phone || '+91 98201 54321'}</div>
                  <div className="text-slate-500">Email: {selectedOrder.hospital?.email || 'procurement@hospital.org'}</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
                  <Info className="w-4 h-4 text-teal-600" />
                  Logistics & Instructions
                </div>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div>
                    <span className="font-semibold text-slate-700">Urgency Level:</span>{' '}
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      selectedOrder.urgency === 'Emergency' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {selectedOrder.urgency || 'Standard Routine'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Special Notes:</span>
                    <p className="mt-0.5 p-2 rounded bg-slate-50 border border-slate-100 text-slate-600 italic">
                      "{selectedOrder.notes}"
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Medicines Ordered Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Package className="w-4 h-4 text-teal-600" />
                Line Items ({selectedOrder.items?.length || 1})
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 border-b border-slate-200 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Medicine & Generic</th>
                      <th className="py-2.5 px-3">Batch</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedOrder.items?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-800">{item.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{item.genericName}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                          {item.batchNo || 'BAT-9841'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">
                          {item.quantity}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-teal-800">
                          {formatCurrency(item.total || item.quantity * item.unitPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                    <tr>
                      <td colSpan="2" className="py-2.5 px-3 text-slate-700">Total Consolidated</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-900">{selectedOrder.totalItems}</td>
                      <td className="py-2.5 px-3"></td>
                      <td className="py-2.5 px-3 text-right font-mono text-teal-800">
                        {formatCurrency(selectedOrder.totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Order Status History Timeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" />
                Status History & Milestone Trail
              </h4>
              <div className="space-y-3 pl-2 border-l-2 border-teal-500/30 ml-2">
                {selectedOrder.statusHistory?.map((step, sIdx) => (
                  <div key={sIdx} className="relative pl-4">
                    <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-teal-600 ring-4 ring-teal-100" />
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-slate-800">{step.status}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{step.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{step.note}</p>
                    {step.actor && (
                      <span className="text-[10px] text-slate-400 font-mono">Actor: {step.actor}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Admin Status Transition Actions */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                Update status:
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((st) => (
                  <button
                    key={st}
                    disabled={selectedOrder.status === st}
                    onClick={() => handleOpenStatusConfirm(selectedOrder, st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedOrder.status === st
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                        : st === 'Cancelled'
                        ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                        : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200'
                    }`}
                  >
                    Set {st}
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
            <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
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
                placeholder="e.g. Courier airway bill assigned, inspected by central warehouse, or compliance cancellation reason..."
                rows="3"
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmStatusModal({ isOpen: false, order: null, targetStatus: '', note: '', isSubmitting: false })}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Dismiss
              </button>
              <button
                type="button"
                disabled={confirmStatusModal.isSubmitting}
                onClick={handleConfirmStatusChange}
                className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow transition-all ${
                  confirmStatusModal.targetStatus === 'Cancelled'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-teal-700 hover:bg-teal-800'
                }`}
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
