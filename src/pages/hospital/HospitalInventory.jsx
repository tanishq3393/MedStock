import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  PlusCircle, 
  Search, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  Boxes, 
  Filter, 
  Thermometer, 
  Calendar,
  CheckCircle2,
  Download,
  Clock,
  Pill,
  ShieldCheck,
  X,
  ArrowRight,
  Eye,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Package,
  Layers,
  Upload
} from 'lucide-react';
import { 
  fetchInventory, 
  addMedicineItem, 
  updateMedicineItem, 
  deleteMedicineItem 
} from '../../store/slices/hospitalSlice';
import MedicineModal from '../../components/forms/MedicineModal';
import CSVImportModal from '../../components/hospital/CSVImportModal';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { isHospitalSuspended } from '../../services/storage';
import { calculateMedicineExpiry } from '../../utils/expiryUtils';

export const HospitalInventory = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { inventory = [], isLoading } = useSelector((state) => state.hospital);
  const isSuspended = isHospitalSuspended(user?.id);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('expiry_asc');

  // Modal / Drawer states
  const [addEditModalOpen, setAddEditModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [selectedMedicineForDetails, setSelectedMedicineForDetails] = useState(null);
  const [deleteConfirmMed, setDeleteConfirmMed] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchInventory(user.id));
    }
  }, [dispatch, user?.id]);

  const getMfgDate = (med) => {
    if (med.mfgDate) return med.mfgDate;
    if (med.expiryDate) {
      try {
        const d = new Date(med.expiryDate);
        d.setFullYear(d.getFullYear() - 1);
        return d.toISOString().split('T')[0];
      } catch {
        return '2023-11-15';
      }
    }
    return '2023-11-15';
  };

  // Helper for medicine classification
  const getMedicineType = (med) => {
    const p = (med.power || '').toLowerCase();
    const b = (med.brandName || '').toLowerCase();
    if (p.includes('tablet') || p.includes('strip') || b.includes('tablet')) return 'Tablet';
    if (p.includes('vial') || b.includes('vial') || b.includes('injection')) return 'Injection / Vial';
    if (p.includes('infusion') || p.includes('bottle')) return 'Infusion';
    if (p.includes('syringe') || p.includes('pen')) return 'Pre-filled Syringe / Pen';
    if (p.includes('ampoule')) return 'Ampoule';
    return 'General Formulation';
  };

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalUnits = inventory.reduce((sum, m) => sum + (Number(m.quantity) || 0), 0);
    const totalBatches = inventory.length;

    let nearExpiryCount = 0;
    let expiredCount = 0;
    let lowStockCount = 0;
    let healthyCount = 0;

    inventory.forEach((med) => {
      const exp = calculateMedicineExpiry(med.expiryDate, med.quantity);
      if (exp.status === 'expired') {
        expiredCount++;
      } else if (exp.status === 'critical' || exp.status === 'near-expiry') {
        nearExpiryCount++;
      } else if (exp.status === 'low-stock') {
        lowStockCount++;
      } else {
        healthyCount++;
      }
    });

    const availableUnits = inventory
      .filter((m) => {
        const exp = calculateMedicineExpiry(m.expiryDate, m.quantity);
        return exp.status !== 'expired';
      })
      .reduce((sum, m) => sum + (Number(m.quantity) || 0), 0);

    return {
      totalUnits,
      totalBatches,
      availableUnits,
      nearExpiryCount,
      expiredCount,
      lowStockCount,
      healthyCount,
    };
  }, [inventory]);

  // "Needs Attention" List (Expired, Near-Expiry, Low-Stock)
  const attentionMedicines = useMemo(() => {
    return inventory
      .map((med) => ({
        ...med,
        expiryMeta: calculateMedicineExpiry(med.expiryDate, med.quantity),
        type: getMedicineType(med),
      }))
      .filter((med) => ['expired', 'critical', 'near-expiry', 'low-stock'].includes(med.expiryMeta.status))
      .sort((a, b) => {
        // Expired first, then nearest expiry
        if (a.expiryMeta.isExpired && !b.expiryMeta.isExpired) return -1;
        if (!a.expiryMeta.isExpired && b.expiryMeta.isExpired) return 1;
        return a.expiryMeta.daysRemaining - b.expiryMeta.daysRemaining;
      });
  }, [inventory]);

  // Filtered Inventory List
  const filteredMedicines = useMemo(() => {
    return inventory
      .map((med) => ({
        ...med,
        expiryMeta: calculateMedicineExpiry(med.expiryDate, med.quantity),
        type: getMedicineType(med),
        finalPrice: Math.round(
          med.unitOriginalPrice * (1 - (med.concessionPercent || 0) / 100) * 100
        ) / 100,
      }))
      .filter((med) => {
        const q = searchTerm.toLowerCase().trim();
        const matchesSearch =
          !q ||
          med.brandName.toLowerCase().includes(q) ||
          med.genericName?.toLowerCase().includes(q) ||
          med.power?.toLowerCase().includes(q) ||
          (med.batchNo && med.batchNo.toLowerCase().includes(q));

        let matchesStatus = true;
        if (selectedStatusFilter === 'healthy') {
          matchesStatus = med.expiryMeta.status === 'healthy';
        } else if (selectedStatusFilter === 'near_expiry') {
          matchesStatus = med.expiryMeta.status === 'critical' || med.expiryMeta.status === 'near-expiry';
        } else if (selectedStatusFilter === 'expired') {
          matchesStatus = med.expiryMeta.status === 'expired';
        } else if (selectedStatusFilter === 'low_stock') {
          matchesStatus = med.expiryMeta.status === 'low-stock';
        }

        let matchesType = true;
        if (selectedTypeFilter !== 'all') {
          matchesType = med.type === selectedTypeFilter;
        }

        return matchesSearch && matchesStatus && matchesType;
      })
      .sort((a, b) => {
        if (sortBy === 'expiry_asc') {
          return new Date(a.expiryDate) - new Date(b.expiryDate);
        } else if (sortBy === 'expiry_desc') {
          return new Date(b.expiryDate) - new Date(a.expiryDate);
        } else if (sortBy === 'stock_high') {
          return b.quantity - a.quantity;
        } else if (sortBy === 'stock_low') {
          return a.quantity - b.quantity;
        } else if (sortBy === 'name') {
          return a.brandName.localeCompare(b.brandName);
        } else if (sortBy === 'price_asc') {
          return a.finalPrice - b.finalPrice;
        } else if (sortBy === 'price_desc') {
          return b.finalPrice - a.finalPrice;
        }
        return 0;
      });
  }, [inventory, searchTerm, selectedStatusFilter, selectedTypeFilter, sortBy]);

  const handleOpenAdd = () => {
    if (isSuspended) {
      toast.error('Your hospital account is currently suspended. Operational activities are locked.');
      return;
    }
    setEditingMedicine(null);
    setAddEditModalOpen(true);
  };

  const handleOpenEdit = (med) => {
    if (isSuspended) {
      toast.error('Your hospital account is currently suspended. Operational activities are locked.');
      return;
    }
    setEditingMedicine(med);
    setAddEditModalOpen(true);
  };

  const handleSaveMedicine = async (formData) => {
    try {
      if (editingMedicine) {
        await dispatch(updateMedicineItem({ id: editingMedicine.id, data: formData }));
        toast.success(`Updated ${formData.brandName} record`);
      } else {
        const payload = {
          ...formData,
          hospitalId: user?.id,
          hospitalName: user?.name || 'Hospital Pharmacy',
        };
        await dispatch(addMedicineItem(payload));
        toast.success(`Added ${formData.brandName} to verified inventory`);
      }
      setAddEditModalOpen(false);
      setEditingMedicine(null);
    } catch (err) {
      toast.error('Failed to save medicine record');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmMed) return;
    try {
      await dispatch(deleteMedicineItem(deleteConfirmMed.id));
      toast.success(`Removed ${deleteConfirmMed.brandName} from inventory`);
      setDeleteConfirmMed(null);
      if (selectedMedicineForDetails?.id === deleteConfirmMed.id) {
        setSelectedMedicineForDetails(null);
      }
    } catch (err) {
      toast.error('Failed to delete medicine');
    }
  };

  const handleExportCsv = () => {
    if (filteredMedicines.length === 0) {
      toast.error('No medicines available to export');
      return;
    }
    const headers = ['Brand Name', 'Generic Name', 'Formulation', 'Batch No', 'Storage', 'Expiry Date', 'Available Units', 'Unit Price', 'Concession %', 'Status'];
    const rows = filteredMedicines.map((m) => [
      `"${m.brandName}"`,
      `"${m.genericName || ''}"`,
      `"${m.power}"`,
      `"${m.batchNo || 'N/A'}"`,
      `"${m.storageType}"`,
      `"${m.expiryDate}"`,
      m.quantity,
      m.unitOriginalPrice,
      m.concessionPercent || 0,
      `"${m.expiryMeta.label}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MediStock_Inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${filteredMedicines.length} medicine records to CSV`);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedStatusFilter('all');
    setSelectedTypeFilter('all');
    setSortBy('expiry_asc');
  };

  return (
    <div className="space-y-7 pb-10">
      
      {/* 1. Page Header (WHERE AM I? + WHAT CAN I DO NEXT?) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            My Inventory
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Manage available medicines, expiry dates and stock levels.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (isSuspended) {
                toast.error('Your hospital account is currently suspended. Operational activities are locked.');
                return;
              }
              setImportModalOpen(true);
            }}
            disabled={isSuspended}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-primary-200 bg-primary-50/70 hover:bg-primary-100 text-primary-800 text-xs font-bold transition-all shadow-sm disabled:opacity-50"
            title="Import your existing hospital inventory from a CSV file."
          >
            <Upload className="w-4 h-4 text-primary-600" />
            <span>Import Inventory</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-sm"
            title="Download full inventory report"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleOpenAdd}
            disabled={isSuspended}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-md shadow-primary-600/20 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:pointer-events-none"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add Medicine</span>
          </button>
        </div>
      </div>

      {/* 2. Compact Summary Row (5 Cards - Obvious Numbers & Explanations) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        {/* Card 1: Total Medicines */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Medicines
          </span>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {metrics.totalUnits.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Across {metrics.totalBatches} batches
          </p>
        </div>

        {/* Card 2: Available Stock */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200/70 bg-emerald-50/20 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
            Available Stock
          </span>
          <div className="text-2xl font-black text-emerald-800 font-mono">
            {metrics.availableUnits.toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium">
            Ready for dispensing
          </p>
        </div>

        {/* Card 3: Near Expiry */}
        <div className="bg-white p-4 rounded-2xl border border-amber-200/90 bg-amber-50/25 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block">
            Near Expiry
          </span>
          <div className="text-2xl font-black text-amber-700 font-mono">
            {metrics.nearExpiryCount}
          </div>
          <p className="text-[11px] text-amber-700 font-medium">
            Needs attention (&lt;90 days)
          </p>
        </div>

        {/* Card 4: Expired */}
        <div className="bg-white p-4 rounded-2xl border border-rose-200/90 bg-rose-50/25 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 block">
            Expired
          </span>
          <div className="text-2xl font-black text-rose-700 font-mono">
            {metrics.expiredCount}
          </div>
          <p className="text-[11px] text-rose-600 font-medium">
            Move to disposal
          </p>
        </div>

        {/* Card 5: Low Stock */}
        <div className="bg-white p-4 rounded-2xl border border-blue-200/80 bg-blue-50/20 shadow-sm space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 block">
            Low Stock
          </span>
          <div className="text-2xl font-black text-blue-700 font-mono">
            {metrics.lowStockCount}
          </div>
          <p className="text-[11px] text-blue-600 font-medium">
            Below safety buffer
          </p>
        </div>

      </div>

      {/* 3. NEEDS ATTENTION SECTION (Surfaces problems immediately) */}
      <div className="bg-slate-50/80 p-5 rounded-3xl border border-slate-200 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Needs Attention
            </h2>
            <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-100 text-amber-800 font-mono">
              {attentionMedicines.length} items
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">
            Take action on expiring or depleted medicines
          </p>
        </div>

        {attentionMedicines.length === 0 ? (
          <div className="p-4 rounded-2xl bg-white border border-emerald-200 text-center flex items-center justify-center gap-2 text-emerald-800 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>All Stock Healthy: No medicines currently require urgent attention or disposal.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {attentionMedicines.slice(0, 6).map((med) => {
              const isExpired = med.expiryMeta.isExpired;
              const isNearExpiry = med.expiryMeta.status === 'critical' || med.expiryMeta.status === 'near-expiry';
              const isLowStock = med.expiryMeta.status === 'low-stock';

              return (
                <div 
                  key={med.id}
                  className={`p-4 rounded-2xl bg-white border transition-all shadow-sm flex flex-col justify-between space-y-3 ${
                    isExpired 
                      ? 'border-rose-300 bg-rose-50/10' 
                      : isNearExpiry 
                        ? 'border-amber-300 bg-amber-50/10' 
                        : 'border-blue-200'
                  }`}
                >
                  {/* Status Tag & Timing */}
                  <div className="flex items-start justify-between gap-2">
                    {isExpired ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                        ✕ Expired
                      </span>
                    ) : isNearExpiry ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
                        ⚠ Near Expiry
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900">
                        ! Low Stock
                      </span>
                    )}

                    <span className="text-[11px] font-bold text-slate-500 font-mono">
                      {isExpired 
                        ? `Expired ${Math.abs(med.expiryMeta.daysRemaining)} days ago` 
                        : `Expires in ${med.expiryMeta.daysRemaining} days`}
                    </span>
                  </div>

                  {/* Medicine Info */}
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 leading-tight">
                      {med.brandName}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {med.power} • Batch: <span className="font-mono text-slate-700">{med.batchNo || 'N/A'}</span>
                    </p>
                    <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-100 font-medium">
                      <span className="text-slate-600">Stock: <strong className="text-slate-900 font-mono font-bold">{med.quantity} units</strong></span>
                      {isExpired ? (
                        <span className="text-[11px] text-rose-600 font-bold">Marketplace: Unavailable</span>
                      ) : (
                        <span className="text-[11px] text-amber-700 font-bold">{med.concessionPercent || 0}% concession</span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    {isExpired ? (
                      <button
                        onClick={() => navigate(`/hospital/waste-management?name=${encodeURIComponent(med.brandName)}&batch=${encodeURIComponent(med.batchNo || '')}&qty=${med.quantity}&unit=units`)}
                        className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Dispose via Waste Management</span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => setSelectedMedicineForDetails(med)}
                          className="flex-1 py-1.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all text-center"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => setSelectedMedicineForDetails(med)}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all text-center"
                        >
                          List for Transfer
                        </button>
                      </>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Filters Bar (Obvious, clear, and visible) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search medicine name, formulation, batch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="w-full md:w-48">
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-700 focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="healthy">✓ Healthy</option>
              <option value="near_expiry">⚠ Near Expiry (&lt;90d)</option>
              <option value="expired">✕ Expired (Needs Disposal)</option>
              <option value="low_stock">! Low Stock</option>
            </select>
          </div>

          {/* Type Dropdown */}
          <div className="w-full md:w-48">
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-700 focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="Injection / Vial">Injection / Vial</option>
              <option value="Tablet">Tablet</option>
              <option value="Infusion">Infusion</option>
              <option value="Pre-filled Syringe / Pen">Pre-filled Syringe / Pen</option>
              <option value="Ampoule">Ampoule</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="w-full md:w-48">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-700 focus:outline-none"
            >
              <option value="expiry_asc">Expiry (Soonest First)</option>
              <option value="expiry_desc">Expiry (Latest First)</option>
              <option value="stock_high">Highest Stock</option>
              <option value="stock_low">Lowest Stock</option>
              <option value="name">Name (A-Z)</option>
              <option value="price_asc">Price (Low to High)</option>
              <option value="price_desc">Price (High to Low)</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          {(searchTerm || selectedStatusFilter !== 'all' || selectedTypeFilter !== 'all') && (
            <button
              onClick={resetFilters}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 flex items-center gap-1 flex-shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

        </div>

        {/* Result Count Indicator */}
        <div className="text-xs text-slate-500 font-medium px-1 flex items-center justify-between">
          <span>{filteredMedicines.length} medicines found</span>
          {isSuspended && (
            <span className="text-rose-600 font-bold">Account suspended: Read-only ledger</span>
          )}
        </div>
      </div>

      {/* 5. MAIN INVENTORY TABLE (Desktop) & CARDS (Mobile) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {isLoading && inventory.length === 0 ? (
          <div className="p-12 text-center">
            <LoadingSpinner text="Loading hospital inventory..." />
          </div>
        ) : filteredMedicines.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Boxes className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">
              No medicines in your inventory yet.
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Add batches to keep track of medicines, automate shelf-life concessions, and manage safe hospital bio-waste disposal.
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Add Medicine</span>
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-3.5 text-left">Medicine</th>
                    <th className="px-3 py-3.5 text-left">Type</th>
                    <th className="px-3 py-3.5 text-left">Batch</th>
                    <th className="px-3 py-3.5 text-center">Available</th>
                    <th className="px-3 py-3.5 text-left">Expiry</th>
                    <th className="px-3 py-3.5 text-center">Status</th>
                    <th className="px-4 py-3.5 text-right">Price</th>
                    <th className="px-4 py-3.5 text-center">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredMedicines.map((med) => {
                    const isExpired = med.expiryMeta.isExpired;

                    return (
                      <tr 
                        key={med.id} 
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                        onClick={() => setSelectedMedicineForDetails(med)}
                      >
                        {/* Medicine */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center font-bold flex-shrink-0">
                              <Pill className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 leading-tight">
                                {med.brandName}
                              </div>
                              <div className="text-[11px] text-slate-500 line-clamp-1">
                                {med.genericName || med.category}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="px-3 py-3.5">
                          <span className="font-semibold text-slate-800 block">{med.type}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{med.power}</span>
                        </td>

                        {/* Batch */}
                        <td className="px-3 py-3.5 font-mono font-bold text-slate-700">
                          {med.batchNo || 'N/A'}
                        </td>

                        {/* Available */}
                        <td className="px-3 py-3.5 text-center">
                          <span className="font-mono font-extrabold text-slate-900 text-sm">
                            {med.quantity}
                          </span>
                          <span className="text-[10px] text-slate-400 block">units</span>
                        </td>

                        {/* Expiry */}
                        <td className="px-3 py-3.5">
                          <div className="font-mono font-bold text-slate-800 text-xs">
                            {med.expiryDate}
                          </div>
                          <span className={`text-[10px] font-bold ${
                            isExpired ? 'text-rose-600' : 'text-slate-500'
                          }`}>
                            {med.expiryMeta.badge}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3.5 text-center">
                          <StatusBadge status={med.expiryMeta.label} />
                        </td>

                        {/* Price */}
                        <td className="px-4 py-3.5 text-right font-mono">
                          <div className="font-bold text-slate-900 text-sm">
                            ₹{med.finalPrice}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            MRP ₹{med.unitOriginalPrice}
                          </div>
                        </td>

                        {/* Action */}
                        <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            {isExpired ? (
                              <button
                                onClick={() => navigate(`/hospital/waste-management?name=${encodeURIComponent(med.brandName)}&batch=${encodeURIComponent(med.batchNo || '')}&qty=${med.quantity}&unit=units`)}
                                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs flex items-center gap-1 transition-all"
                                title="Move to safe bio-medical disposal"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                <span>Dispose</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => setSelectedMedicineForDetails(med)}
                                  className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-primary-700 hover:bg-primary-50 transition-colors text-xs font-bold"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => handleOpenEdit(med)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                  title="Edit Medicine"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (No squeezed table) */}
            <div className="block lg:hidden divide-y divide-slate-100 p-3 space-y-3">
              {filteredMedicines.map((med) => {
                const isExpired = med.expiryMeta.isExpired;

                return (
                  <div
                    key={med.id}
                    onClick={() => setSelectedMedicineForDetails(med)}
                    className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 cursor-pointer hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">{med.brandName}</h4>
                        <p className="text-xs text-slate-500 font-medium">{med.type} • Batch: {med.batchNo || 'N/A'}</p>
                      </div>
                      <StatusBadge status={med.expiryMeta.label} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">AVAILABLE STOCK</span>
                        <span className="text-sm font-bold text-slate-900 font-mono">{med.quantity} units</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-medium">UNIT PRICE</span>
                        <span className="text-sm font-bold text-primary-700 font-mono">₹{med.finalPrice}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <span className="text-slate-500 font-medium">
                        Expires: <strong className="text-slate-800 font-mono">{med.expiryDate}</strong> ({med.expiryMeta.badge})
                      </span>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMedicineForDetails(med);
                        }}
                        className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1"
                      >
                        <span>View Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* 6. MEDICINE DETAIL DRAWER / MODAL (Clear, beginner-friendly layout) */}
      {selectedMedicineForDetails && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="absolute inset-0" onClick={() => setSelectedMedicineForDetails(null)} />
          
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto z-10 animate-slideLeft">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50 sticky top-0 z-10">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Medicine Information
                </span>
                <h2 className="text-xl font-black text-slate-900 leading-tight">
                  {selectedMedicineForDetails.brandName}
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {selectedMedicineForDetails.power}
                </p>
              </div>

              <button
                onClick={() => setSelectedMedicineForDetails(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Organized Sections */}
            <div className="p-6 space-y-6 flex-1 text-xs">
              
              {/* STATUS BANNER */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Current Status</span>
                  <div className="mt-1">
                    <StatusBadge status={selectedMedicineForDetails.expiryMeta?.label || 'Healthy'} />
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Days to Expiry</span>
                  <span className="text-base font-black font-mono text-slate-800">
                    {selectedMedicineForDetails.expiryMeta?.daysRemaining > 0 
                      ? `${selectedMedicineForDetails.expiryMeta?.daysRemaining} days`
                      : 'Expired'}
                  </span>
                </div>
              </div>

              {/* SECTION 1: MEDICINE */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  1. Medicine Overview
                </h3>
                <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Brand Name</span>
                    <strong className="text-slate-800">{selectedMedicineForDetails.brandName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Formulation / Type</span>
                    <strong className="text-slate-800">{selectedMedicineForDetails.type || 'Standard'}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-400 block font-medium">Generic / Molecule</span>
                    <strong className="text-slate-800">{selectedMedicineForDetails.genericName || 'CDSCO Regulated Compound'}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-400 block font-medium">Manufacturer</span>
                    <strong className="text-slate-800">{selectedMedicineForDetails.manufacturer || 'Approved Pharmaceutical Maker'}</strong>
                  </div>
                </div>
              </div>

              {/* SECTION 2: BATCH & DATES */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  2. Batch & Dates
                </h3>
                <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Batch Number</span>
                    <strong className="font-mono text-slate-800">{selectedMedicineForDetails.batchNo || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Storage Requirement</span>
                    <strong className="text-slate-800 flex items-center gap-1">
                      <Thermometer className="w-3.5 h-3.5 text-cyan-600" />
                      {selectedMedicineForDetails.storageType}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Manufacturing Date</span>
                    <strong className="font-mono text-slate-700">{getMfgDate(selectedMedicineForDetails)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Expiry Date</span>
                    <strong className="font-mono text-slate-900">{selectedMedicineForDetails.expiryDate}</strong>
                  </div>
                </div>
              </div>

              {/* SECTION 3: STOCK */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  3. Stock & Availability
                </h3>
                <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Available</span>
                    <div className="text-base font-black text-slate-900 font-mono">
                      {selectedMedicineForDetails.quantity}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Reserved</span>
                    <div className="text-base font-black text-slate-500 font-mono">0</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Minimum Buffer</span>
                    <div className="text-base font-black text-slate-500 font-mono">10</div>
                  </div>
                </div>
              </div>

              {/* SECTION 4: PRICING */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  4. Pricing & Concession
                </h3>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Original MRP:</span>
                    <span className="font-mono font-bold text-slate-700">₹{selectedMedicineForDetails.unitOriginalPrice} / unit</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Shelf-Life Concession:</span>
                    <span className="font-mono font-bold text-emerald-700">-{selectedMedicineForDetails.concessionPercent || 0}%</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-extrabold text-slate-900">
                    <span>Effective Selling Price:</span>
                    <span className="font-mono text-primary-700">
                      ₹{Math.round(selectedMedicineForDetails.unitOriginalPrice * (1 - (selectedMedicineForDetails.concessionPercent || 0) / 100) * 100) / 100} / unit
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* ONE OBVIOUS NEXT ACTION */}
            <div className="p-5 border-t border-slate-200 bg-white sticky bottom-0 space-y-2">
              {selectedMedicineForDetails.expiryMeta?.isExpired ? (
                <button
                  onClick={() => {
                    const m = selectedMedicineForDetails;
                    setSelectedMedicineForDetails(null);
                    navigate(`/hospital/waste-management?name=${encodeURIComponent(m.brandName)}&batch=${encodeURIComponent(m.batchNo || '')}&qty=${m.quantity}&unit=units`);
                  }}
                  className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Dispose via Bio-Waste Management</span>
                </button>
              ) : selectedMedicineForDetails.expiryMeta?.status === 'near-expiry' || selectedMedicineForDetails.expiryMeta?.status === 'critical' ? (
                <button
                  onClick={() => {
                    setSelectedMedicineForDetails(null);
                    navigate('/marketplace');
                  }}
                  className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>List for Inter-Hospital Redistribution</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const med = selectedMedicineForDetails;
                      setSelectedMedicineForDetails(null);
                      handleOpenEdit(med);
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs text-center"
                  >
                    Edit Medicine Record
                  </button>
                  <button
                    onClick={() => setDeleteConfirmMed(selectedMedicineForDetails)}
                    className="py-2.5 px-3 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-xs"
                    title="Delist from inventory"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Add / Edit Modal (Preserved form logic) */}
      <MedicineModal
        isOpen={addEditModalOpen}
        onClose={() => setAddEditModalOpen(false)}
        onSubmit={handleSaveMedicine}
        initialData={editingMedicine}
        isEdit={!!editingMedicine}
      />

      {/* CSV Import Wizard Modal */}
      <CSVImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImportSuccess={() => {
          if (user?.id) {
            dispatch(fetchInventory(user.id));
          }
        }}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmMed}
        onClose={() => setDeleteConfirmMed(null)}
        title="Confirm Removal from Inventory"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 pt-1">
          <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-rose-800 leading-relaxed">
              Are you sure you want to remove <strong className="font-bold">{deleteConfirmMed?.brandName}</strong>? It will be removed from your hospital ledger immediately.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDeleteConfirmMed(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
            >
              Confirm Removal
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default HospitalInventory;
