import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Boxes, 
  Search, 
  Filter, 
  Plus, 
  Minus, 
  ArrowRightLeft, 
  History, 
  Building2, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Package,
  Layers,
  ArrowUpRight,
  TrendingDown,
  ShieldCheck,
  RotateCcw,
  ArrowUpDown
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export const AdminInventory = () => {
  const { hospitals } = useSelector((state) => state.admin);

  const [inventoryData, setInventoryData] = useState({ items: [], summary: {} });
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [hospitalFilter, setHospitalFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('default');

  // Modals state
  const [addStockTarget, setAddStockTarget] = useState(null);
  const [addQuantity, setAddQuantity] = useState(50);
  const [addReason, setAddReason] = useState('New batch intake from distributor');

  const [removeStockTarget, setRemoveStockTarget] = useState(null);
  const [removeQuantity, setRemoveQuantity] = useState(10);
  const [removeReason, setRemoveReason] = useState('Damaged vials during inspection');

  const [transferTarget, setTransferTarget] = useState(null);
  const [transferDestination, setTransferDestination] = useState('');
  const [transferQuantity, setTransferQuantity] = useState(25);
  const [transferNote, setTransferNote] = useState('Emergency trauma ICU quota redistribution');

  const [historyTarget, setHistoryTarget] = useState(null);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const loadInventory = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getInventory(statusFilter, searchTerm, hospitalFilter, categoryFilter);
      setInventoryData(res);
    } catch (err) {
      console.error('Failed to load inventory', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [statusFilter, searchTerm, hospitalFilter, categoryFilter]);

  // Handlers
  const handleConfirmAddStock = async (e) => {
    e.preventDefault();
    if (!addStockTarget || addQuantity <= 0) return;
    try {
      await adminService.adjustStock({
        medicineId: addStockTarget.id,
        quantityDelta: Number(addQuantity),
        type: 'Intake',
        reason: addReason,
      });
      toast.success(`Added ${addQuantity} units to ${addStockTarget.medicine}`);
      setAddStockTarget(null);
      loadInventory();
    } catch (err) {
      toast.error('Failed to adjust stock');
    }
  };

  const handleConfirmRemoveStock = async (e) => {
    e.preventDefault();
    if (!removeStockTarget || removeQuantity <= 0) return;
    try {
      await adminService.adjustStock({
        medicineId: removeStockTarget.id,
        quantityDelta: -Number(removeQuantity),
        type: 'Removal',
        reason: removeReason,
      });
      toast.success(`Removed ${removeQuantity} units from ${removeStockTarget.medicine}`);
      setRemoveStockTarget(null);
      loadInventory();
    } catch (err) {
      toast.error('Failed to remove stock');
    }
  };

  const handleConfirmTransfer = async (e) => {
    e.preventDefault();
    if (!transferTarget || !transferDestination || transferQuantity <= 0) {
      toast.error('Please select destination hospital and valid quantity');
      return;
    }
    try {
      const res = await adminService.transferStock({
        medicineId: transferTarget.id,
        sourceHospitalId: transferTarget.hospitalId,
        targetHospitalId: transferDestination,
        quantity: Number(transferQuantity),
        note: transferNote,
      });
      toast.success(`Dispatched transfer consignment #${res.txnId}`);
      setTransferTarget(null);
      loadInventory();
    } catch (err) {
      toast.error(err.message || 'Failed to transfer stock');
    }
  };

  const handleOpenHistory = async (med) => {
    setHistoryTarget(med);
    setIsHistoryLoading(true);
    try {
      const logs = await adminService.getStockHistory(med.id);
      setHistoryLogs(logs);
    } catch (err) {
      console.error(err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const summary = {
    totalMedicines: inventoryData?.summary?.totalMedicines ?? 0,
    totalStockUnits: inventoryData?.summary?.totalStockUnits ?? inventoryData?.summary?.totalStock ?? 0,
    lowStock: inventoryData?.summary?.lowStock ?? inventoryData?.summary?.lowStockCount ?? 0,
    outOfStock: inventoryData?.summary?.outOfStock ?? inventoryData?.summary?.outOfStockCount ?? 0,
    expiringSoon: inventoryData?.summary?.expiringSoon ?? 0,
    expired: inventoryData?.summary?.expired ?? inventoryData?.summary?.expiredCount ?? 0,
  };

  const availableCategories = useMemo(() => {
    const defaultCats = [
      'Antibiotics', 
      'Analgesics', 
      'Cardiovascular', 
      'Respiratory', 
      'Diabetes Care', 
      'Emergency & Critical Care', 
      'Antivirals', 
      'IV Fluids', 
      'Vitamins & Minerals'
    ];
    const dynamicCats = (inventoryData.items || []).map((i) => i.category).filter(Boolean);
    return Array.from(new Set([...defaultCats, ...dynamicCats])).sort();
  }, [inventoryData.items]);

  const sortedItems = useMemo(() => {
    if (!inventoryData.items) return [];
    const list = [...inventoryData.items];
    switch (sortBy) {
      case 'qty_desc':
        return list.sort((a, b) => (b.availableStock || 0) - (a.availableStock || 0));
      case 'qty_asc':
        return list.sort((a, b) => (a.availableStock || 0) - (b.availableStock || 0));
      case 'expiry_asc':
        return list.sort((a, b) => new Date(a.expiryDate || '9999-12-31') - new Date(b.expiryDate || '9999-12-31'));
      case 'expiry_desc':
        return list.sort((a, b) => new Date(b.expiryDate || '1970-01-01') - new Date(a.expiryDate || '1970-01-01'));
      case 'updated_desc':
        return list.sort((a, b) => new Date(b.lastUpdated || 0) - new Date(a.lastUpdated || 0));
      default:
        return list;
    }
  }, [inventoryData.items, sortBy]);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-secondary-950 via-secondary-900 to-primary-950 rounded-2xl p-5 sm:p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-[radial-gradient(ellipse_at_top_right,rgba(10,110,121,0.25),transparent_70%)] pointer-events-none" />
        
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-primary-500/20 text-cyan-300 border border-primary-500/30">
              <Boxes className="w-3.5 h-3.5 text-cyan-400" />
              Centralized Healthcare Inventory
            </span>
            <span className="text-xs text-slate-400 font-mono">Consolidated Multi-Hospital Stock Matrix</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Central Inventory Management</h1>
          <p className="text-xs text-slate-300 max-w-xl font-normal">
            Real-time multi-hospital inventory ledger. Monitor live available stocks, execute quota adjustments, transfer supplies between hospitals, and audit stock movement histories.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md text-right">
            <div className="text-[10px] uppercase font-bold text-cyan-300 tracking-wider">Total Stock Units</div>
            <div className="text-lg font-black text-white font-mono">
              {summary.totalStockUnits?.toLocaleString('en-IN') || 0}
            </div>
          </div>
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md text-right">
            <div className="text-[10px] uppercase font-bold text-teal-300 tracking-wider">Distinct SKUs</div>
            <div className="text-lg font-black text-white font-mono">
              {summary.totalMedicines}
            </div>
          </div>
        </div>
      </div>

      {/* 5 SUMMARY STATISTIC CARDS (Calculated from real inventory data) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        {/* Card 1: Total Medicines (Distinct SKUs) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-1.5">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Medicines</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 font-mono">{summary.totalMedicines}</h3>
            <span className="text-[10px] text-teal-700 font-semibold truncate block">Master catalog SKUs</span>
          </div>
        </div>

        {/* Card 2: Total Stock Units */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-1.5">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Stock Units</span>
            <div className="w-8 h-8 rounded-xl bg-primary-50 border border-primary-100 text-primary-700 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 font-mono">{summary.totalStockUnits?.toLocaleString('en-IN')}</h3>
            <span className="text-[10px] text-primary-700 font-semibold truncate block">Aggregated hospital doses</span>
          </div>
        </div>

        {/* Card 3: Low Stock */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-1.5">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Low Stock</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 font-mono">{summary.lowStock}</h3>
            <span className="text-[10px] text-amber-700 font-semibold truncate block">Below safety threshold</span>
          </div>
        </div>

        {/* Card 4: Out of Stock */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-1.5">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Out of Stock</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 font-mono">{summary.outOfStock}</h3>
            <span className="text-[10px] text-rose-700 font-semibold truncate block">Depleted stock records</span>
          </div>
        </div>

        {/* Card 5: Expiring Soon */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-1.5 col-span-2 sm:col-span-1">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expiring Soon</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 font-mono">{summary.expiringSoon}</h3>
            <span className="text-[10px] text-indigo-700 font-semibold truncate block">Within 90-day window</span>
          </div>
        </div>

      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search medicine, hospital, or batch number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto text-xs">
          
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Statuses</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
              <option value="Expiring Soon">Expiring Soon</option>
              <option value="Expired">Expired</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 max-w-[130px] truncate"
            >
              <option value="all">All Categories</option>
              {availableCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Hospital Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Hospital:</span>
            <select
              value={hospitalFilter}
              onChange={(e) => setHospitalFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 max-w-[140px] truncate"
            >
              <option value="all">All Hospitals</option>
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>

          {/* Sorting */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="default">Default</option>
              <option value="qty_desc">Quantity: High → Low</option>
              <option value="qty_asc">Quantity: Low → High</option>
              <option value="expiry_asc">Expiry: Soonest</option>
              <option value="expiry_desc">Expiry: Latest</option>
              <option value="updated_desc">Recently Updated</option>
            </select>
          </div>

        </div>
      </div>

      {/* INVENTORY TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden w-full max-w-full">
        <div className="w-full overflow-hidden">
          <table className="w-full divide-y divide-slate-200/80 text-xs table-fixed">
            <colgroup>
              <col style={{ width: '21%' }} /> {/* Medicine, ID & Category */}
              <col style={{ width: '14%' }} /> {/* Holding Hospital & ID */}
              <col style={{ width: '21%' }} /> {/* Stock Distribution */}
              <col style={{ width: '7%' }} />  {/* Min Stock */}
              <col style={{ width: '10%' }} /> {/* Expiry Date */}
              <col style={{ width: '9%' }} />  {/* Status */}
              <col style={{ width: '8%' }} />  {/* Last Updated */}
              <col style={{ width: '10%' }} /> {/* Actions */}
            </colgroup>
            <thead className="bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-3 py-3 text-left">Medicine & Category</th>
                <th className="px-2 py-3 text-left">Holding Hospital</th>
                <th className="px-2 py-3 text-left">
                  <div className="flex items-center gap-1">
                    <span>Stock Distribution</span>
                    <span className="text-[9px] font-normal text-slate-400">(Avail/Resv/Exp)</span>
                  </div>
                </th>
                <th className="px-1.5 py-3 text-center">Min Stock</th>
                <th className="px-2 py-3 text-left">Expiry Date</th>
                <th className="px-1.5 py-3 text-center">Status</th>
                <th className="px-2 py-3 text-left">Last Updated</th>
                <th className="px-2 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {sortedItems.length > 0 ? (
                sortedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-teal-50/20 transition-colors group">
                    
                    {/* Medicine */}
                    <td className="px-3 py-3 overflow-hidden">
                      <div className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors truncate text-xs" title={item.medicineName || item.medicine}>
                        {item.medicineName || item.medicine}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium truncate mt-0.5">
                        <span className="font-mono text-primary-700 font-semibold">{item.medicineId || item.id}</span>
                        <span className="text-slate-300">•</span>
                        <span className="truncate bg-slate-100 text-slate-600 px-1 rounded">{item.category}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono truncate block mt-0.5">Batch: {item.batchNumber}</span>
                    </td>

                    {/* Hospital */}
                    <td className="px-2 py-3 overflow-hidden">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 min-w-0">
                        <Building2 className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                        <span className="truncate block text-xs" title={item.hospitalName || item.hospital}>
                          {item.hospitalName || item.hospital}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono truncate block pl-5">
                        {item.hospitalId || 'HOSP-FAC'}
                      </span>
                    </td>

                    {/* Stock Movement Progression Indicator: Available -> Reserved -> Expired */}
                    <td className="px-2 py-3 overflow-hidden">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <span className="font-bold text-emerald-700 whitespace-nowrap">{item.availableStock} Avail</span>
                          <span className="text-slate-300">→</span>
                          <span className="font-medium text-amber-700 whitespace-nowrap">{item.reservedStock} Resv</span>
                          <span className="text-slate-300">→</span>
                          <span className="font-bold text-purple-700 whitespace-nowrap">{item.expiredStock} Exp</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full flex overflow-hidden">
                          <div style={{ width: `${Math.min(100, (item.availableStock / (item.totalStock || 1)) * 100)}%` }} className="bg-emerald-500" />
                          <div style={{ width: `${Math.min(100, (item.reservedStock / (item.totalStock || 1)) * 100)}%` }} className="bg-amber-400" />
                          <div style={{ width: `${Math.min(100, (item.expiredStock / (item.totalStock || 1)) * 100)}%` }} className="bg-purple-500" />
                        </div>
                      </div>
                    </td>

                    {/* Minimum Stock */}
                    <td className="px-1.5 py-3 text-center font-mono text-slate-600 font-semibold overflow-hidden text-xs">
                      {item.minimumStock}
                    </td>

                    {/* Expiry Date */}
                    <td className="px-2 py-3 font-mono text-slate-700 font-semibold text-[11px] overflow-hidden">
                      <span className="truncate block" title={item.expiryDate}>{item.expiryDate}</span>
                    </td>

                    {/* Status */}
                    <td className="px-1.5 py-3 text-center overflow-hidden">
                      <StatusBadge status={item.status} />
                    </td>

                    {/* Last Updated */}
                    <td className="px-2 py-3 font-mono text-slate-400 text-[10px] overflow-hidden">
                      <span className="truncate block" title={item.lastUpdated}>{item.lastUpdated}</span>
                    </td>

                    {/* Actions */}
                    <td className="px-2 py-3 text-center overflow-hidden">
                      <div className="flex items-center justify-center gap-1">
                        
                        {/* Add Stock */}
                        <button
                          onClick={() => {
                            setAddStockTarget(item);
                            setAddQuantity(50);
                          }}
                          className="p-1 rounded text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                          title="Add Stock (Intake)"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>

                        {/* Remove Stock */}
                        <button
                          onClick={() => {
                            setRemoveStockTarget(item);
                            setRemoveQuantity(10);
                          }}
                          className="p-1 rounded text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors"
                          title="Remove Stock (Damage / Recall)"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        {/* Transfer Stock */}
                        <button
                          onClick={() => {
                            setTransferTarget(item);
                            setTransferDestination(hospitals.find((h) => h.id !== item.hospitalId)?.id || '');
                            setTransferQuantity(Math.min(25, item.availableStock));
                          }}
                          className="p-1 rounded text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                          title="Transfer Stock to Peer Facility"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                        </button>

                        {/* History */}
                        <button
                          onClick={() => handleOpenHistory(item)}
                          className="p-1 rounded text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                          title="View Stock Movement History"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>

                      </div>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-14 text-center text-slate-400">
                    <Boxes className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-bold text-slate-700">No inventory matches your active filter</p>
                    <p className="text-xs text-slate-400 mt-1">Adjust status filter or choose another hospital facility.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. ADD STOCK MODAL */}
      {addStockTarget && (
        <Modal
          isOpen={!!addStockTarget}
          onClose={() => setAddStockTarget(null)}
          title={`Intake Stock: ${addStockTarget.medicine}`}
          subtitle={`Adding stock to ${addStockTarget.hospital}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleConfirmAddStock} className="space-y-4 pt-1 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <span className="text-slate-400 block font-medium">Current Stock Balance</span>
              <span className="text-sm font-bold font-mono text-slate-900">{addStockTarget.totalStock} Units</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Units to Add <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={addQuantity}
                onChange={(e) => setAddQuantity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Intake Reason / Invoice Reference
              </label>
              <input
                type="text"
                value={addReason}
                onChange={(e) => setAddReason(e.target.value)}
                placeholder="e.g. Distributor shipment ref #INV-8831"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAddStockTarget(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm"
              >
                Confirm Stock Intake
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* 2. REMOVE STOCK MODAL */}
      {removeStockTarget && (
        <Modal
          isOpen={!!removeStockTarget}
          onClose={() => setRemoveStockTarget(null)}
          title={`Remove Stock: ${removeStockTarget.medicine}`}
          subtitle={`Depleting balance from ${removeStockTarget.hospital}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleConfirmRemoveStock} className="space-y-4 pt-1 text-xs">
            <div className="p-3 bg-rose-50 rounded-xl space-y-1 text-rose-800">
              <span className="text-rose-600 block font-medium">Available Units: {removeStockTarget.availableStock}</span>
              <span className="text-[11px]">Deducted units will be logged in statutory audit and deducted from available balance.</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Units to Deduct <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max={removeStockTarget.totalStock}
                required
                value={removeQuantity}
                onChange={(e) => setRemoveQuantity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Removal Reason <span className="text-rose-500">*</span>
              </label>
              <select
                value={removeReason}
                onChange={(e) => setRemoveReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white font-medium"
              >
                <option value="Damaged packaging during handling">Damaged packaging during handling</option>
                <option value="Internal hospital department dispensation">Internal hospital department dispensation</option>
                <option value="Quarantine due to manufacturer advisory">Quarantine due to manufacturer advisory</option>
                <option value="Quality check sample extraction">Quality check sample extraction</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRemoveStockTarget(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm"
              >
                Confirm Deduction
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* 3. TRANSFER STOCK MODAL */}
      {transferTarget && (
        <Modal
          isOpen={!!transferTarget}
          onClose={() => setTransferTarget(null)}
          title={`Inter-Hospital Stock Transfer`}
          subtitle={`Source: ${transferTarget.hospital} (${transferTarget.medicine})`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleConfirmTransfer} className="space-y-4 pt-1 text-xs">
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-blue-900 space-y-1">
              <span className="font-bold block">{transferTarget.medicine}</span>
              <span className="text-[11px] text-blue-700">Available to transfer: <strong>{transferTarget.availableStock} units</strong></span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Target Receiving Hospital <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={transferDestination}
                onChange={(e) => setTransferDestination(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
              >
                <option value="">Select Recipient Facility</option>
                {hospitals.filter((h) => h.id !== transferTarget.hospitalId).map((h) => (
                  <option key={h.id} value={h.id}>{h.name} ({h.city})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Transfer Quantity <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max={transferTarget.availableStock}
                required
                value={transferQuantity}
                onChange={(e) => setTransferQuantity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Reallocation Note & Logistics Mandate
              </label>
              <input
                type="text"
                value={transferNote}
                onChange={(e) => setTransferNote(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTransferTarget(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm"
              >
                Authorize Consignment
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* 4. STOCK MOVEMENT HISTORY MODAL */}
      {historyTarget && (
        <Modal
          isOpen={!!historyTarget}
          onClose={() => setHistoryTarget(null)}
          title={`Stock Movement History: ${historyTarget.medicine}`}
          subtitle={`Audit trail of all intakes, dispensations, and transfers for Batch ${historyTarget.batchNumber}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 pt-1 text-xs">
            {isHistoryLoading ? (
              <div className="py-12">
                <LoadingSpinner text="Retrieving stock movement ledger..." />
              </div>
            ) : historyLogs.length > 0 ? (
              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {historyLogs.map((log) => (
                  <div key={log.id} className="py-3 flex items-start justify-between gap-3 hover:bg-slate-50 px-2 rounded-xl">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.changeType === 'Intake' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          log.changeType === 'Removal' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {log.changeType}
                        </span>
                        <span className="font-bold text-slate-900">{log.hospitalName}</span>
                      </div>
                      <p className="text-slate-600 leading-snug">{log.reason}</p>
                      <span className="text-[10px] text-slate-400 font-mono">Recorded by {log.loggedBy}</span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`font-mono font-bold text-sm block ${log.quantityChange >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {log.quantityChange >= 0 ? `+${log.quantityChange}` : log.quantityChange} Units
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Balance: {log.newBalance}</span>
                      <span className="text-[10px] text-slate-400 block">{new Date(log.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="font-bold text-slate-700">No previous adjustments logged for this batch</p>
                <p className="text-xs text-slate-400 mt-1">Stock currently stands at initial recorded intake balance.</p>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setHistoryTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Close History
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default AdminInventory;
