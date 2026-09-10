import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { 
  Boxes, 
  Search, 
  Plus, 
  ArrowRightLeft, 
  History, 
  Building2, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Package,
  RotateCcw,
  Pill,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
  Info
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { getStoredItem, KEYS } from '../../services/storage';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export const AdminInventory = () => {
  const adminState = useSelector((state) => state.admin);

  const [inventoryData, setInventoryData] = useState({ items: [], summary: {} });
  const [masterMedicines, setMasterMedicines] = useState([]);
  const [hospitalList, setHospitalList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expiryFilter, setExpiryFilter] = useState('all');
  const [hospitalFilter, setHospitalFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('default');

  // Modals state
  const [selectedItem, setSelectedItem] = useState(null); // Inventory Details Modal
  const [isAddStockOpen, setIsAddStockOpen] = useState(false); // Add Stock Modal (Admin Override or From Details)
  const [isTransferOpen, setIsTransferOpen] = useState(false); // Transfer Stock Modal
  const [isTransferConfirmOpen, setIsTransferConfirmOpen] = useState(false); // Confirmation Dialog
  const [isHistoryOpen, setIsHistoryOpen] = useState(false); // Stock History Modal
  const [historyLogs, setHistoryLogs] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Add Stock Form State
  const [addForm, setAddForm] = useState({
    hospitalId: '',
    masterMedicineId: '',
    medicineName: '',
    genericName: '',
    category: '',
    dosageForm: 'Tablet',
    strength: '',
    manufacturer: '',
    packing: '15 Tablets / Strip',
    packSize: '15 Tablets / Strip',
    numberOfPacks: 10,
    unitsPerPack: 15,
    unit: 'Tablet',
    shelfLocation: 'Rack A - Shelf 3',
    storageCondition: 'Room Temperature (15°C - 25°C)',
    batchNo: '',
    quantity: 150,
    totalUnits: 150,
    mfgDate: '',
    expiryDate: '',
    minStockLevel: 25,
    mrp: 100,
    concessionRate: 95,
    costRate: 90,
    notes: 'Admin override authorized batch addition',
    isFromDetails: false,
  });

  // Transfer Form State
  const [transferForm, setTransferForm] = useState({
    targetHospitalId: '',
    quantity: 25,
    note: 'Inter-hospital reallocation quota mandate',
  });

  // Load Inventory & Reference Data
  const loadInventory = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getInventory(statusFilter, searchTerm, hospitalFilter, categoryFilter, expiryFilter);
      setInventoryData(res);
    } catch (err) {
      console.error('Failed to load inventory', err);
      toast.error('Failed to retrieve inventory records');
    } finally {
      setIsLoading(false);
    }
  };

  const loadReferenceData = async () => {
    try {
      const masterMeds = getStoredItem(KEYS.MASTER_MEDICINES, []);
      setMasterMedicines(masterMeds);

      let hosps = adminState?.hospitals || [];
      if (hosps.length === 0) {
        hosps = await adminService.getHospitals();
      }
      setHospitalList(hosps.filter((h) => h.status === 'verified' || !h.status));
    } catch (err) {
      console.error('Failed to load reference data', err);
    }
  };

  useEffect(() => {
    loadReferenceData();
  }, []);

  useEffect(() => {
    loadInventory();
  }, [statusFilter, searchTerm, hospitalFilter, categoryFilter, expiryFilter]);

  // Handle Clear Filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setExpiryFilter('all');
    setHospitalFilter('all');
    setCategoryFilter('all');
    setSortBy('default');
  };

  // Open Add Stock from Top Header (Admin Override)
  const handleOpenAddStockOverride = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultExp = new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];
    setAddForm({
      hospitalId: hospitalList[0]?.id || '',
      masterMedicineId: '',
      medicineName: '',
      genericName: '',
      category: 'Analgesics & Antipyretics',
      dosageForm: 'Tablet',
      strength: '500 mg',
      manufacturer: '',
      packing: '15 Tablets / Strip',
      packSize: '15 Tablets / Strip',
      numberOfPacks: 10,
      unitsPerPack: 15,
      unit: 'Tablet',
      shelfLocation: 'Rack A - Shelf 3',
      storageCondition: 'Room Temperature (15°C - 25°C)',
      batchNo: 'BATCH-' + Math.floor(1000 + Math.random() * 9000),
      quantity: 150,
      totalUnits: 150,
      mfgDate: today,
      expiryDate: defaultExp,
      minStockLevel: 25,
      mrp: 100,
      concessionRate: 95,
      costRate: 90,
      notes: 'Admin override - system assistance stock intake',
      isFromDetails: false,
    });
    setIsAddStockOpen(true);
  };

  // Open Add Stock from Details Modal (prefilled with specific hospital & medicine)
  const handleOpenAddStockFromDetails = () => {
    if (!selectedItem) return;
    const today = new Date().toISOString().split('T')[0];
    const uPerPack = selectedItem.unitsPerPack || 15;
    const nPacks = selectedItem.numberOfPacks || 10;
    const totUnits = nPacks * uPerPack;
    setAddForm({
      hospitalId: selectedItem.hospitalId,
      masterMedicineId: selectedItem.masterMedicineId || selectedItem.medicineId || '',
      medicineName: selectedItem.medicineName || selectedItem.medicine,
      genericName: selectedItem.genericName || '',
      category: selectedItem.category || '',
      dosageForm: selectedItem.dosageForm || selectedItem.form || 'Tablet',
      strength: selectedItem.strength || selectedItem.power || '',
      manufacturer: selectedItem.manufacturer || '',
      packing: selectedItem.packing || selectedItem.packSize || `${uPerPack} Tablets / Strip`,
      packSize: selectedItem.packSize || selectedItem.packing || `${uPerPack} Tablets / Strip`,
      numberOfPacks: nPacks,
      unitsPerPack: uPerPack,
      unit: selectedItem.unit || 'Tablet',
      shelfLocation: selectedItem.shelfLocation || 'Rack A - Shelf 3',
      storageCondition: selectedItem.storageCondition || selectedItem.storageType || 'Room Temperature (15°C - 25°C)',
      batchNo: selectedItem.batchNumber || selectedItem.batchNo || '',
      quantity: totUnits,
      totalUnits: totUnits,
      mfgDate: selectedItem.mfgDate || today,
      expiryDate: selectedItem.expiryDate || '',
      minStockLevel: selectedItem.minStockLevel || selectedItem.minimumStock || 20,
      mrp: selectedItem.mrp || selectedItem.unitOriginalPrice || 100,
      concessionRate: selectedItem.concessionRate || selectedItem.unitFinalPrice || 95,
      costRate: selectedItem.costRate || selectedItem.acquisitionCost || 90,
      notes: 'Admin override additional batch intake',
      isFromDetails: true,
    });
    setIsAddStockOpen(true);
  };

  // Master Medicine Selection in Add Stock Form
  const handleSelectMasterMedicine = (medName) => {
    const found = masterMedicines.find((m) => 
      (m.medicineName || m.brandName || '').toLowerCase() === medName.toLowerCase()
    );
    if (found) {
      const uPerPack = found.unitsPerPack || 15;
      const nPacks = 10;
      setAddForm((prev) => ({
        ...prev,
        masterMedicineId: found.id,
        medicineName: found.medicineName || found.brandName,
        genericName: found.genericName || prev.genericName,
        category: found.category || prev.category,
        dosageForm: found.dosageForm || found.form || prev.dosageForm,
        strength: found.dosage || found.strength || found.power || prev.strength,
        manufacturer: found.manufacturer || prev.manufacturer,
        packing: found.packing || found.packSize || `${uPerPack} Tablets / Strip`,
        packSize: found.packSize || found.packing || `${uPerPack} Tablets / Strip`,
        numberOfPacks: nPacks,
        unitsPerPack: uPerPack,
        quantity: nPacks * uPerPack,
        totalUnits: nPacks * uPerPack,
        unit: found.unit || prev.unit || 'Tablet',
        storageCondition: found.storageCondition || found.storageType || prev.storageCondition,
        mrp: found.mrp || prev.mrp || 100,
        concessionRate: found.concessionRate || prev.concessionRate || 95,
        costRate: found.costRate || prev.costRate || 90,
      }));
    } else {
      setAddForm((prev) => ({ ...prev, medicineName: medName }));
    }
  };

  // Submit Add Stock
  const handleSubmitAddStock = async (e) => {
    e.preventDefault();
    if (!addForm.hospitalId) {
      toast.error('Please select a hospital');
      return;
    }
    if (!addForm.medicineName?.trim()) {
      toast.error('Please specify a medicine name');
      return;
    }
    if (!addForm.batchNo?.trim()) {
      toast.error('Please enter a batch number');
      return;
    }
    if (Number(addForm.quantity) <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }
    if (!addForm.expiryDate) {
      toast.error('Please provide an expiry date');
      return;
    }

    try {
      const result = await adminService.adminAddStock(addForm);
      toast.success(`Successfully saved stock: ${result.brandName} (${addForm.quantity} units)`);
      setIsAddStockOpen(false);
      
      // If details modal was open, refresh selected item
      if (selectedItem) {
        setSelectedItem((prev) => prev ? {
          ...prev,
          quantity: prev.batchNumber === result.batchNo ? result.quantity : prev.quantity,
          availableStock: prev.batchNumber === result.batchNo ? result.availableQuantity : prev.availableStock,
          totalStock: prev.batchNumber === result.batchNo ? result.totalQuantity : prev.totalStock,
          totalQuantity: prev.batchNumber === result.batchNo ? result.totalQuantity : prev.totalQuantity,
          availableQuantity: prev.batchNumber === result.batchNo ? result.availableQuantity : prev.availableQuantity,
          totalUnits: prev.batchNumber === result.batchNo ? result.totalUnits : prev.totalUnits,
          numberOfPacks: prev.batchNumber === result.batchNo ? result.numberOfPacks : prev.numberOfPacks,
        } : null);
      }
      loadInventory();
    } catch (err) {
      toast.error(err.message || 'Failed to add stock');
    }
  };

  // Open Transfer Modal from Details
  const handleOpenTransferModal = () => {
    if (!selectedItem) return;
    if (selectedItem.isExpired) {
      toast.error('Expired stock cannot be transferred under safety regulations');
      return;
    }
    if (Number(selectedItem.availableStock || 0) <= 0) {
      toast.error('Out-of-stock item cannot be transferred');
      return;
    }

    const availableTargets = hospitalList.filter((h) => h.id !== selectedItem.hospitalId);
    setTransferForm({
      targetHospitalId: availableTargets[0]?.id || '',
      quantity: Math.min(25, Number(selectedItem.availableStock || 1)),
      note: 'Inter-hospital emergency quota transfer',
    });
    setIsTransferOpen(true);
  };

  // Proceed to Transfer Confirmation
  const handleProceedTransferConfirmation = (e) => {
    e.preventDefault();
    if (!transferForm.targetHospitalId) {
      toast.error('Please select a recipient hospital');
      return;
    }
    const transferQty = Number(transferForm.quantity);
    if (transferQty <= 0) {
      toast.error('Transfer quantity must be greater than 0');
      return;
    }
    if (transferQty > Number(selectedItem.availableStock || 0)) {
      toast.error(`Transfer quantity exceeds available stock (${selectedItem.availableStock} units)`);
      return;
    }

    setIsTransferOpen(false);
    setIsTransferConfirmOpen(true);
  };

  // Final Transfer Execution
  const handleExecuteTransfer = async () => {
    try {
      await adminService.transferStock({
        medicineId: selectedItem.id,
        sourceHospitalId: selectedItem.hospitalId,
        targetHospitalId: transferForm.targetHospitalId,
        quantity: Number(transferForm.quantity),
        note: transferForm.note,
      });

      toast.success(`Transferred ${transferForm.quantity} units to destination hospital`);
      setIsTransferConfirmOpen(false);
      setSelectedItem(null);
      loadInventory();
    } catch (err) {
      toast.error(err.message || 'Failed to complete stock transfer');
    }
  };

  // Open Stock History from Details
  const handleOpenStockHistory = async () => {
    if (!selectedItem) return;
    setIsHistoryOpen(true);
    setIsHistoryLoading(true);
    try {
      const logs = await adminService.getStockHistory(
        selectedItem.medicineId || selectedItem.id,
        selectedItem.batchNumber || selectedItem.batchNo,
        selectedItem.hospitalId
      );
      setHistoryLogs(logs);
    } catch (err) {
      console.error('Failed to load stock history', err);
      toast.error('Could not retrieve stock movement history');
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

  // Dynamic Categories from Data
  const availableCategories = useMemo(() => {
    const defaultCats = [
      'Antibiotics & Anti-Infectives',
      'Analgesics & Antipyretics',
      'Cardiovascular Health',
      'Respiratory Care',
      'Diabetes Care',
      'Gastroenterology',
      'Critical Care / Antibiotic',
      'Antihistamines & Allergy',
      'Vitamins & Minerals'
    ];
    const dynamicCats = (inventoryData.items || []).map((i) => i.category).filter(Boolean);
    return Array.from(new Set([...defaultCats, ...dynamicCats])).sort();
  }, [inventoryData.items]);

  // Sorted Items
  const sortedItems = useMemo(() => {
    if (!inventoryData.items) return [];
    const list = [...inventoryData.items];
    switch (sortBy) {
      case 'med_asc':
        return list.sort((a, b) => (a.medicineName || a.medicine || '').localeCompare(b.medicineName || b.medicine || ''));
      case 'med_desc':
        return list.sort((a, b) => (b.medicineName || b.medicine || '').localeCompare(a.medicineName || a.medicine || ''));
      case 'qty_desc':
        return list.sort((a, b) => (b.quantity || b.availableStock || 0) - (a.quantity || a.availableStock || 0));
      case 'qty_asc':
        return list.sort((a, b) => (a.quantity || a.availableStock || 0) - (b.quantity || b.availableStock || 0));
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

  const targetHospitalObj = hospitalList.find((h) => h.id === transferForm.targetHospitalId);

  return (
    <div className="space-y-6">
      
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-secondary-950 via-secondary-900 to-primary-950 rounded-2xl p-5 sm:p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-[radial-gradient(ellipse_at_top_right,rgba(10,110,121,0.25),transparent_70%)] pointer-events-none" />
        
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-primary-500/20 text-cyan-300 border border-primary-500/30">
              <Boxes className="w-3.5 h-3.5 text-cyan-400" />
              Centralized Healthcare Inventory
            </span>
            <span className="text-xs text-slate-400 font-mono">Consolidated Multi-Hospital Matrix</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Admin Central Inventory</h1>
          <p className="text-xs text-slate-300 max-w-xl font-normal">
            Real-time unified inventory monitoring across all registered hospitals. Click any inventory row to view details, add stock, authorize inter-hospital transfers, and view audit history.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
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

          {/* Section 4: Admin Add Stock (Override) Button */}
          <button
            onClick={handleOpenAddStockOverride}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold shadow-lg shadow-primary-600/30 transition-all active:scale-95"
            title="Admin Override: Add Stock to Specific Hospital"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Stock</span>
          </button>
        </div>
      </div>

      {/* 5 SUMMARY STATISTIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        {/* Card 1: Total Distinct Medicines */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-1.5">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Medicines</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 font-mono">{summary.totalMedicines}</h3>
            <span className="text-[10px] text-teal-700 font-semibold truncate block">Master catalogue formulations</span>
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
            <span className="text-[10px] text-amber-700 font-semibold truncate block">At or below safety threshold</span>
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
            <span className="text-[10px] text-rose-700 font-semibold truncate block">Depleted inventory lots</span>
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

      {/* SEARCH, FILTER & SORT BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Section 13: Search Input across medicine, generic, hospital, and batch */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search medicine, generic, hospital name, or batch number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
            />
          </div>

          {/* Section 14 & 20: Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            
            {/* Hospital Filter (Section 22: Hospital-wise Inventory) */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium hidden sm:inline">Hospital:</span>
              <select
                value={hospitalFilter}
                onChange={(e) => setHospitalFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 max-w-[150px] truncate"
              >
                <option value="all">All Hospitals</option>
                {hospitalList.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium hidden sm:inline">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 max-w-[140px] truncate"
              >
                <option value="all">All Categories</option>
                {availableCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Stock Status Filter (Section 17) */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium hidden sm:inline">Stock:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Stock Statuses</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            {/* Expiry Status Filter (Section 20) */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium hidden sm:inline">Expiry:</span>
              <select
                value={expiryFilter}
                onChange={(e) => setExpiryFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Expiry</option>
                <option value="good">Good (&gt; 90 days)</option>
                <option value="within_90">Within 90 Days</option>
                <option value="within_60">Within 60 Days</option>
                <option value="within_30">Within 30 Days</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            {/* Sort Dropdown (Section 16) */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="default">Default</option>
                <option value="med_asc">Medicine Name: A → Z</option>
                <option value="med_desc">Medicine Name: Z → A</option>
                <option value="qty_asc">Quantity: Low → High</option>
                <option value="qty_desc">Quantity: High → Low</option>
                <option value="expiry_asc">Expiry: Soonest First</option>
                <option value="expiry_desc">Expiry: Latest First</option>
                <option value="updated_desc">Recently Added</option>
              </select>
            </div>

            {/* Section 15: Clear Filters */}
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold transition-colors"
              title="Reset all active filters"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset</span>
            </button>

          </div>
        </div>
      </div>

      {/* SECTION 3 & 8: ADMIN INVENTORY MAIN TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden w-full max-w-full">
        <div className="w-full overflow-x-auto">
          <table className="w-full divide-y divide-slate-200/80 text-xs table-fixed min-w-[800px]">
            <colgroup>
              <col style={{ width: '28%' }} /> {/* Medicine */}
              <col style={{ width: '22%' }} /> {/* Hospital */}
              <col style={{ width: '14%' }} /> {/* Batch */}
              <col style={{ width: '12%' }} /> {/* Quantity */}
              <col style={{ width: '12%' }} /> {/* Expiry */}
              <col style={{ width: '12%' }} /> {/* Stock Status */}
            </colgroup>
            <thead className="bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3.5 text-left">Medicine</th>
                <th className="px-3 py-3.5 text-left">Hospital</th>
                <th className="px-3 py-3.5 text-left">Batch</th>
                <th className="px-3 py-3.5 text-center">Quantity</th>
                <th className="px-3 py-3.5 text-left">Expiry</th>
                <th className="px-3 py-3.5 text-center">Stock Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <LoadingSpinner text="Loading centralized inventory records..." />
                  </td>
                </tr>
              ) : sortedItems.length > 0 ? (
                sortedItems.map((item) => {
                  const isLow = item.status === 'low_stock';
                  const isOut = item.status === 'out_of_stock';
                  const isExp = item.status === 'expired';

                  return (
                    <tr 
                      key={item.id} 
                      onClick={() => setSelectedItem(item)}
                      className="cursor-pointer hover:bg-teal-50/20 transition-colors group"
                      title="Click row to view complete inventory details & actions"
                    >
                      
                      {/* 1. Medicine */}
                      <td className="px-4 py-3.5 overflow-hidden">
                        <div className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors truncate text-xs" title={item.medicineName}>
                          {item.medicineName}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5" title={item.genericName}>
                          {item.genericName}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="inline-block text-[10px] px-1.5 py-0.2 rounded font-medium bg-slate-100 text-slate-600 truncate max-w-[160px]">
                            {item.category}
                          </span>
                        </div>
                      </td>

                      {/* 2. Hospital */}
                      <td className="px-3 py-3.5 overflow-hidden">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 min-w-0">
                          <Building2 className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                          <span className="truncate block text-xs" title={item.hospitalName}>
                            {item.hospitalName}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono truncate block pl-5 mt-0.5">
                          {item.hospitalId}
                        </span>
                      </td>

                      {/* 3. Batch */}
                      <td className="px-3 py-3.5 overflow-hidden">
                        <span className="inline-block px-2 py-1 rounded-lg text-[11px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200/80">
                          {item.batchNumber}
                        </span>
                      </td>

                      {/* 4. Quantity */}
                      <td className="px-3 py-3.5 text-center overflow-hidden">
                        <div className="font-mono font-bold text-sm text-slate-900">
                          {Number(item.quantity || 0).toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {item.availableStock !== undefined ? `${item.availableStock} avail` : 'units'}
                        </span>
                      </td>

                      {/* 5. Expiry */}
                      <td className="px-3 py-3.5 overflow-hidden">
                        <div className="flex items-center gap-1 font-mono text-[11px] font-semibold text-slate-700">
                          <Clock className={`w-3 h-3 ${isExp ? 'text-rose-500' : item.isNearExpiry ? 'text-amber-500' : 'text-slate-400'}`} />
                          <span className={isExp ? 'text-rose-600 font-bold' : item.isNearExpiry ? 'text-amber-600 font-bold' : 'text-slate-700'}>
                            {item.expiryDate}
                          </span>
                        </div>
                        {isExp ? (
                          <span className="text-[10px] text-rose-500 font-bold block mt-0.5">Expired</span>
                        ) : item.isNearExpiry ? (
                          <span className="text-[10px] text-amber-600 font-medium block mt-0.5">Near Expiry</span>
                        ) : (
                          <span className="text-[10px] text-slate-400 block mt-0.5">Valid</span>
                        )}
                      </td>

                      {/* 6. Stock Status */}
                      <td className="px-3 py-3.5 text-center overflow-hidden">
                        <StatusBadge status={item.status} />
                      </td>

                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-14 text-center text-slate-400">
                    <Boxes className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-bold text-slate-700">No inventory records match your active filters</p>
                    <p className="text-xs text-slate-400 mt-1">Try clearing search terms or selecting "All Hospitals".</p>
                    <button
                      onClick={handleClearFilters}
                      className="mt-3 px-3.5 py-1.5 rounded-xl text-xs font-bold text-primary-600 bg-primary-50 hover:bg-primary-100 transition-colors"
                    >
                      Clear All Filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: INVENTORY DETAILS MODAL (Section 8 & 9)         */}
      {/* ======================================================== */}
      {selectedItem && (
        <Modal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          title={`Inventory Details: ${selectedItem.medicineName}`}
          subtitle={`Holding Facility: ${selectedItem.hospitalName} • Batch ${selectedItem.batchNumber}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-5 pt-1 text-xs text-slate-700">
            
            {/* 1. MEDICINE DETAILS */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-2 text-primary-700 font-bold uppercase tracking-wider text-[10px]">
                <Pill className="w-3.5 h-3.5" />
                <span>Medicine Formulation Information</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Brand / Trade Name</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedItem.medicineName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Active Generic Molecule</span>
                  <span className="font-medium text-slate-800">{selectedItem.genericName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Therapeutic Category</span>
                  <span className="font-medium text-slate-800">{selectedItem.category}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Dosage Form</span>
                  <span className="font-medium text-slate-800">{selectedItem.dosageForm || selectedItem.form || 'Tablet'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Dosage / Strength</span>
                  <span className="font-medium text-slate-800">{selectedItem.dosage || selectedItem.strength || selectedItem.power || 'Standard formulation'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Packing / Pack Size</span>
                  <span className="font-medium text-slate-800">{selectedItem.packing || selectedItem.packSize || '15 Tablets'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Dispensing Unit</span>
                  <span className="font-medium text-slate-800">{selectedItem.unit || 'Tablet'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Storage Condition</span>
                  <span className="font-medium text-slate-800">{selectedItem.storageCondition || selectedItem.storageType || 'Room Temperature (15°C - 25°C)'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Manufacturer</span>
                  <span className="font-medium text-slate-800">{selectedItem.manufacturer || 'Approved Pharmaceutical Lab'}</span>
                </div>
              </div>
            </div>

            {/* 2. HOSPITAL & LOCATION DETAILS */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-2 text-primary-700 font-bold uppercase tracking-wider text-[10px]">
                <Building2 className="w-3.5 h-3.5" />
                <span>Holding Healthcare Facility & Storage Location</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Facility Name</span>
                  <span className="font-bold text-slate-900">{selectedItem.hospitalName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Facility ID</span>
                  <span className="font-mono font-semibold text-primary-700">{selectedItem.hospitalId}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Jurisdiction</span>
                  <span className="font-medium text-slate-800">{selectedItem.hospitalCity || 'Metro'}, {selectedItem.hospitalState || 'India'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Shelf / Storage Location</span>
                  <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 inline-block mt-0.5">
                    {selectedItem.shelfLocation || 'Rack A - Shelf 3'}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. STOCK METRICS & BATCH PRICING */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary-700 font-bold uppercase tracking-wider text-[10px]">
                  <Boxes className="w-3.5 h-3.5" />
                  <span>Batch Stock Metrics, Reorder Level & Pricing</span>
                </div>
                <StatusBadge status={selectedItem.status} />
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Batch Number</span>
                  <span className="font-mono font-bold text-slate-900 bg-white px-2 py-1 rounded border border-slate-200 inline-block mt-0.5">
                    {selectedItem.batchNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Stock</span>
                  <span className="font-mono font-bold text-base text-slate-900">
                    {Number(selectedItem.totalQuantity || selectedItem.quantity || selectedItem.totalStock || 0).toLocaleString('en-IN')} Units
                  </span>
                  <span className="text-[10px] text-slate-500 block">Total physical count</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Reserved Stock</span>
                  <span className="font-mono font-bold text-base text-amber-700">
                    {Number(selectedItem.reservedQuantity || selectedItem.reservedStock || 0).toLocaleString('en-IN')} Units
                  </span>
                  <span className="text-[10px] text-amber-600 block">Pending order locks</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Available Stock</span>
                  <span className="font-mono font-bold text-base text-emerald-700">
                    {Number(selectedItem.availableQuantity || selectedItem.availableStock || 0).toLocaleString('en-IN')} Units
                  </span>
                  <span className="text-[10px] text-emerald-600 block">Unreserved for orders</span>
                </div>
              </div>

              {/* Pricing & Reorder Level Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200/60">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Reorder Level</span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedItem.reorderLevel || selectedItem.minStockLevel || selectedItem.minimumStock || 20} Units
                  </span>
                  <span className="text-[10px] text-slate-400 block">Alert threshold</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">MRP</span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{Number(selectedItem.mrp || selectedItem.unitOriginalPrice || 0).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Maximum Retail Price</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Concession Rate</span>
                  <span className="font-mono font-bold text-primary-700">
                    ₹{Number(selectedItem.concessionRate || selectedItem.unitFinalPrice || 0).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-primary-600 block">MediStock Rate</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Acquisition Cost</span>
                  <span className="font-mono font-bold text-slate-700">
                    ₹{Number(selectedItem.costRate || selectedItem.acquisitionCost || 0).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Purchase rate</span>
                </div>
              </div>

              {/* Packaging Breakdown & Lot Value */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200/60">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Packaging Structure</span>
                  <span className="font-bold text-slate-900 block mt-0.5">
                    {selectedItem.numberOfPacks || Math.ceil(Number(selectedItem.totalQuantity || selectedItem.quantity || 0) / (selectedItem.unitsPerPack || 15))} Packs ({selectedItem.unitsPerPack || 15} units/pack)
                  </span>
                  <span className="text-[10px] text-slate-500 block">{selectedItem.packSize || selectedItem.packing || '15 Tablets / Strip'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Stock Units</span>
                  <span className="font-mono font-bold text-slate-900 block mt-0.5">
                    {Number(selectedItem.totalQuantity || selectedItem.quantity || 0).toLocaleString('en-IN')} Units
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Lot Value (MRP)</span>
                  <span className="font-mono font-bold text-primary-700 block mt-0.5">
                    ₹{(Number(selectedItem.mrp || selectedItem.unitOriginalPrice || 0) * Number(selectedItem.totalQuantity || selectedItem.quantity || 0)).toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Value (Concession)</span>
                  <span className="font-mono font-bold text-emerald-700 block mt-0.5">
                    ₹{(Number(selectedItem.concessionRate || selectedItem.unitFinalPrice || 0) * Number(selectedItem.totalQuantity || selectedItem.quantity || 0)).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Expiry Date</span>
                  <span className="font-mono font-bold text-slate-900 block mt-0.5">
                    {selectedItem.expiryDate}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Manufacturing Date</span>
                  <span className="font-mono font-bold text-slate-700 block mt-0.5">
                    {selectedItem.mfgDate || 'N/A'}
                  </span>
                </div>
              </div>

              {selectedItem.isExpired && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Expired Pharmaceutical Stock</span>
                    <p className="text-[11px] text-rose-700 mt-0.5">
                      This batch passed its expiration date and is quarantined from redistribution. Retained for statutory audit and biomedical waste disposal compliance.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 9: ACTIONS INSIDE INVENTORY DETAILS */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                
                {/* [ Add Stock ] */}
                <button
                  onClick={handleOpenAddStockFromDetails}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all active:scale-95"
                  title="Add more stock to this hospital & medicine"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Stock</span>
                </button>

                {/* [ Transfer Stock ] */}
                <button
                  onClick={handleOpenTransferModal}
                  disabled={selectedItem.isExpired || Number(selectedItem.availableStock || 0) <= 0}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedItem.isExpired || Number(selectedItem.availableStock || 0) <= 0
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                      : 'text-white bg-blue-600 hover:bg-blue-700 shadow-sm active:scale-95'
                  }`}
                  title={
                    selectedItem.isExpired 
                      ? 'Expired medicine cannot be transferred' 
                      : Number(selectedItem.availableStock || 0) <= 0 
                      ? 'Stock depleted; transfer unavailable' 
                      : 'Transfer stock to another approved hospital'
                  }
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Transfer Stock</span>
                </button>

                {/* [ Stock History ] */}
                <button
                  onClick={handleOpenStockHistory}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 transition-colors active:scale-95"
                  title="View ledger history of stock additions and transfers"
                >
                  <History className="w-3.5 h-3.5 text-slate-600" />
                  <span>Stock History</span>
                </button>

              </div>

              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Close
              </button>
            </div>

          </div>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: ADD STOCK MODAL (Section 4, 6 & 10)              */}
      {/* ======================================================== */}
      {isAddStockOpen && (
        <Modal
          isOpen={isAddStockOpen}
          onClose={() => setIsAddStockOpen(false)}
          title={addForm.isFromDetails ? `Add Stock: ${addForm.medicineName}` : 'Add Stock (Admin Override)'}
          subtitle={
            addForm.isFromDetails 
              ? `Adding inventory to ${selectedItem?.hospitalName} (Duplicate batch will merge quantity)`
              : 'Admin override for authorized stock addition or system assistance'
          }
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleSubmitAddStock} className="space-y-4 pt-1 text-xs">
            
            {/* Target Hospital */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Target Hospital <span className="text-rose-500">*</span>
              </label>
              {addForm.isFromDetails ? (
                <div className="p-2.5 bg-slate-100 rounded-xl font-semibold text-slate-800 border border-slate-200">
                  {selectedItem?.hospitalName} ({selectedItem?.hospitalId})
                </div>
              ) : (
                <select
                  required
                  value={addForm.hospitalId}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, hospitalId: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white font-medium"
                >
                  <option value="">Select Target Hospital</option>
                  {hospitalList.map((h) => (
                    <option key={h.id} value={h.id}>{h.name} ({h.city || 'Hospital'})</option>
                  ))}
                </select>
              )}
            </div>

            {/* Medicine Name (with master catalogue datalist auto-fill) */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Medicine Name <span className="text-rose-500">*</span>
              </label>
              {addForm.isFromDetails ? (
                <div className="p-2.5 bg-slate-100 rounded-xl font-bold text-slate-900 border border-slate-200">
                  {addForm.medicineName}
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    required
                    list="admin-master-meds-list"
                    value={addForm.medicineName}
                    onChange={(e) => handleSelectMasterMedicine(e.target.value)}
                    placeholder="Type or select from Master Catalogue..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium"
                  />
                  <datalist id="admin-master-meds-list">
                    {masterMedicines.map((m) => (
                      <option key={m.id} value={m.medicineName || m.brandName}>
                        {m.genericName ? `${m.genericName} • ${m.category}` : m.category}
                      </option>
                    ))}
                  </datalist>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Select from existing master catalogue or enter new pharmaceutical formulation.
                  </span>
                </>
              )}
            </div>

            {/* Batch Number & Quantity */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Batch Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={addForm.batchNo}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, batchNo: e.target.value.toUpperCase() }))}
                  placeholder="e.g. PCM001"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Same batch merges with existing quantity
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Quantity to Add (Total Units) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={addForm.quantity}
                  onChange={(e) => {
                    const qty = Math.max(1, Number(e.target.value));
                    const units = Number(addForm.unitsPerPack) || 15;
                    const packs = Math.max(1, Math.ceil(qty / units));
                    setAddForm((prev) => ({ ...prev, quantity: qty, totalUnits: qty, numberOfPacks: packs }));
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  {addForm.numberOfPacks || 1} packs × {addForm.unitsPerPack || 15} units = {addForm.quantity} total units
                </span>
              </div>
            </div>

            {/* Packaging & Pack Size Structure */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Packing / Pack Size
                </label>
                <input
                  type="text"
                  value={addForm.packing}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, packing: e.target.value, packSize: e.target.value }))}
                  placeholder="e.g. 15 Tablets / Strip"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Number of Packs
                </label>
                <input
                  type="number"
                  min="1"
                  value={addForm.numberOfPacks}
                  onChange={(e) => {
                    const packs = Math.max(1, Number(e.target.value));
                    const units = Number(addForm.unitsPerPack) || 15;
                    const tot = packs * units;
                    setAddForm((prev) => ({
                      ...prev,
                      numberOfPacks: packs,
                      quantity: tot,
                      totalUnits: tot,
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Units per Pack
                </label>
                <input
                  type="number"
                  min="1"
                  value={addForm.unitsPerPack}
                  onChange={(e) => {
                    const units = Math.max(1, Number(e.target.value));
                    const packs = Number(addForm.numberOfPacks) || 1;
                    const tot = packs * units;
                    setAddForm((prev) => ({
                      ...prev,
                      unitsPerPack: units,
                      quantity: tot,
                      totalUnits: tot,
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Mfg Date & Expiry Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Manufacturing Date
                </label>
                <input
                  type="date"
                  value={addForm.mfgDate}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, mfgDate: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Expiry Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={addForm.expiryDate}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, expiryDate: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:outline-none text-xs"
                />
              </div>
            </div>

            {/* Shelf Location & Storage Condition */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Shelf / Storage Location
                </label>
                <input
                  type="text"
                  value={addForm.shelfLocation}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, shelfLocation: e.target.value }))}
                  placeholder="e.g. Rack A - Shelf 3"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:outline-none text-xs font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Storage Condition
                </label>
                <select
                  value={addForm.storageCondition}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, storageCondition: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:outline-none text-xs bg-white font-medium"
                >
                  <option value="Room Temperature (15°C - 25°C)">Room Temperature (15°C - 25°C)</option>
                  <option value="Cold Storage (2°C - 8°C)">Cold Storage (2°C - 8°C)</option>
                  <option value="Deep Freeze (-20°C)">Deep Freeze (-20°C)</option>
                  <option value="Protect from Light (<25°C)">Protect from Light (&lt;25°C)</option>
                  <option value="Dry & Cool (<25°C)">Dry & Cool (&lt;25°C)</option>
                </select>
              </div>
            </div>

            {/* Pricing Parameters */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  MRP (₹ / unit)
                </label>
                <input
                  type="number"
                  min="0"
                  value={addForm.mrp}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, mrp: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Concession Rate (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={addForm.concessionRate}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, concessionRate: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none text-emerald-700"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Acquisition Cost (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={addForm.costRate}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, costRate: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none text-slate-700"
                />
              </div>
            </div>

            {/* Minimum Stock Threshold */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Minimum Stock Safety Buffer (Units)
              </label>
              <input
                type="number"
                min="5"
                value={addForm.minStockLevel}
                onChange={(e) => setAddForm((prev) => ({ ...prev, minStockLevel: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>

            {/* Notes / Reason */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Admin Action Note / Reason
              </label>
              <input
                type="text"
                value={addForm.notes}
                onChange={(e) => setAddForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="e.g. Technical assistance for stock reconciliation"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddStockOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm"
              >
                Confirm Stock Addition
              </button>
            </div>

          </form>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: TRANSFER STOCK MODAL (Section 11)                */}
      {/* ======================================================== */}
      {isTransferOpen && selectedItem && (
        <Modal
          isOpen={isTransferOpen}
          onClose={() => setIsTransferOpen(false)}
          title="Transfer Stock"
          subtitle={`Reallocating from ${selectedItem.hospitalName}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleProceedTransferConfirmation} className="space-y-4 pt-1 text-xs">
            
            {/* Origin Summary */}
            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 space-y-1 text-blue-900">
              <div className="flex justify-between items-start">
                <span className="font-bold text-sm">{selectedItem.medicineName}</span>
                <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-blue-100 font-bold">
                  Batch: {selectedItem.batchNumber}
                </span>
              </div>
              <div className="text-[11px] text-blue-700">
                Source: <strong>{selectedItem.hospitalName}</strong>
              </div>
              <div className="text-[11px] text-blue-800 font-semibold font-mono">
                Available to transfer: {selectedItem.availableStock} Units
              </div>
            </div>

            {/* Target Hospital Selector */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Target Recipient Hospital <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={transferForm.targetHospitalId}
                onChange={(e) => setTransferForm((prev) => ({ ...prev, targetHospitalId: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
              >
                <option value="">Select Recipient Hospital</option>
                {hospitalList
                  .filter((h) => h.id !== selectedItem.hospitalId)
                  .map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.city || 'Hospital'})
                    </option>
                  ))}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Units to Transfer <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max={selectedItem.availableStock}
                required
                value={transferForm.quantity}
                onChange={(e) => setTransferForm((prev) => ({ ...prev, quantity: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Maximum transferable: {selectedItem.availableStock} units. Cannot transfer more than available.
              </span>
            </div>

            {/* Note */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Reallocation Note & Logistics Mandate
              </label>
              <input
                type="text"
                value={transferForm.note}
                onChange={(e) => setTransferForm((prev) => ({ ...prev, note: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsTransferOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm flex items-center gap-1.5"
              >
                <span>Review Transfer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </form>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: CONFIRMATION DIALOG (Section 11)                 */}
      {/* ======================================================== */}
      {isTransferConfirmOpen && selectedItem && (
        <Modal
          isOpen={isTransferConfirmOpen}
          onClose={() => setIsTransferConfirmOpen(false)}
          title="Confirm Stock Transfer?"
          subtitle="Please verify the logistics consignment details before dispatch"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 pt-1 text-xs text-slate-700">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="text-center pb-2 border-b border-slate-200">
                <span className="text-lg font-black text-slate-900 font-mono block">
                  {transferForm.quantity} Units
                </span>
                <span className="font-bold text-slate-800 text-sm">{selectedItem.medicineName}</span>
                <span className="text-[11px] font-mono text-slate-500 block">Batch: {selectedItem.batchNumber}</span>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">From:</span>
                  <span className="font-bold text-slate-900">{selectedItem.hospitalName}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">To:</span>
                  <span className="font-bold text-primary-700">{targetHospitalObj?.name || 'Selected Recipient'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Source Remaining:</span>
                  <span className="font-mono font-bold text-slate-700">
                    {Number(selectedItem.availableStock) - Number(transferForm.quantity)} Units
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic text-center">
              Stock balance will immediately update in both hospital inventories and be recorded in the centralized audit history.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsTransferConfirmOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteTransfer}
                className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirm Transfer</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: STOCK HISTORY MODAL (Section 12 - View-Only)    */}
      {/* ======================================================== */}
      {isHistoryOpen && selectedItem && (
        <Modal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          title={`Stock History: ${selectedItem.medicineName}`}
          subtitle={`Batch ${selectedItem.batchNumber} • ${selectedItem.hospitalName} (View-Only Audit Ledger)`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 pt-1 text-xs">
            {isHistoryLoading ? (
              <div className="py-12">
                <LoadingSpinner text="Retrieving verified stock history ledger..." />
              </div>
            ) : historyLogs.length > 0 ? (
              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1">
                {historyLogs.map((log) => {
                  const isPositive = Number(log.quantityDelta || 0) >= 0;
                  const deltaStr = isPositive ? `+${log.quantityDelta}` : `${log.quantityDelta}`;
                  const formattedDate = log.date || (log.timestamp ? new Date(log.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '10 Sep 2026');

                  return (
                    <div key={log.id} className="py-3 px-2 flex items-start justify-between gap-3 hover:bg-slate-50/80 rounded-xl transition-colors">
                      <div className="space-y-1 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          
                          {/* Unit delta pill */}
                          <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                            isPositive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {deltaStr} units
                          </span>

                          <span className="text-slate-300">•</span>

                          {/* Action badge */}
                          <span className="font-bold text-slate-800">
                            {log.action || log.actionType || 'Stock Movement'}
                          </span>

                          <span className="text-slate-300">•</span>

                          {/* Performed by */}
                          <span className="text-slate-600 font-medium">
                            {log.performedBy || 'Admin'}
                          </span>

                          <span className="text-slate-300">•</span>

                          {/* Date */}
                          <span className="text-slate-400 font-mono text-[11px]">
                            {formattedDate}
                          </span>
                        </div>

                        {/* Reason / Source-Destination Info */}
                        <p className="text-slate-600 text-[11px] leading-snug pl-1">
                          {log.reason || 'Authorized centralized stock movement recorded'}
                        </p>

                        {(log.partnerHospitalName) && (
                          <div className="text-[10px] text-slate-400 pl-1 font-medium">
                            Facility: {log.partnerHospitalName}
                          </div>
                        )}
                      </div>

                      {/* Resulting Balance */}
                      {log.resultingStock !== undefined && (
                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-slate-400 block uppercase font-semibold">Balance</span>
                          <span className="font-mono font-bold text-slate-800 text-xs">
                            {log.resultingStock} units
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="font-bold text-slate-700">No previous adjustments logged for this batch</p>
                <p className="text-xs text-slate-400 mt-1">Stock stands at its initial registered intake balance.</p>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-[11px] text-slate-400">
              <span>View-only statutory audit trail. Historic records cannot be modified or purged.</span>
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
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
