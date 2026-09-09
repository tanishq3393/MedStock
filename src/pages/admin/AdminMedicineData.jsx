import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Building2, 
  Search, 
  PlusCircle, 
  Edit3, 
  Trash2, 
  Layers, 
  Calendar,
  AlertTriangle,
  Boxes,
  CheckCircle2,
  ShieldCheck,
  Eye,
  Filter,
  ArrowUpDown,
  Tag,
  Clock,
  Pill,
  X,
  Package,
  FileText
} from 'lucide-react';
import { 
  fetchHospitals, 
  fetchAdminMedicines, 
  addAdminMedicine, 
  updateAdminMedicine, 
  deleteAdminMedicine 
} from '../../store/slices/adminSlice';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { calculateMedicineExpiry } from '../../utils/expiryUtils';
import toast from 'react-hot-toast';

export const AdminMedicineData = () => {
  const dispatch = useDispatch();
  const { hospitals, medicines, isLoading } = useSelector((state) => state.admin);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState('all');
  const [expiryFilter, setExpiryFilter] = useState('all');
  const [hospitalFilter, setHospitalFilter] = useState('all');

  // Modals state
  const [addEditModalOpen, setAddEditModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingMedicineId, setEditingMedicineId] = useState(null);

  const [detailsMedicine, setDetailsMedicine] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Add / Edit Form State
  const initialFormState = {
    medicineName: '',
    genericName: '',
    category: 'Antibiotics & Anti-Infectives',
    manufacturer: '',
    batchNumber: '',
    mfgDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
    quantity: 100,
    minStockLevel: 20,
    supplier: '',
    price: 450,
    hospitalId: '',
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    dispatch(fetchHospitals());
    dispatch(fetchAdminMedicines('all'));
  }, [dispatch]);

  // Compute status for any medicine
  const getMedicineStatus = (med) => {
    const exp = calculateMedicineExpiry(med.expiryDate, med.mfgDate, med.quantity, med.minStockLevel || 20);
    const qty = Number(med.quantity || 0);

    if (exp.isExpired) {
      return { label: 'Expired', badgeColor: 'bg-rose-100 text-rose-800 border-rose-300', key: 'expired' };
    }
    if (qty === 0) {
      return { label: 'Out of Stock', badgeColor: 'bg-red-100 text-red-800 border-red-200', key: 'out_of_stock' };
    }
    if (exp.isNearExpiry) {
      return { label: 'Expiring Soon', badgeColor: 'bg-amber-100 text-amber-800 border-amber-300', key: 'expiring_soon' };
    }
    if (qty <= (med.minStockLevel || 20) || exp.isLowStock) {
      return { label: 'Low Stock', badgeColor: 'bg-orange-100 text-orange-800 border-orange-200', key: 'low_stock' };
    }
    return { label: 'In Stock', badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200', key: 'in_stock' };
  };

  // Distinct categories from data
  const categories = useMemo(() => {
    const set = new Set();
    medicines.forEach((m) => {
      if (m.category) set.add(m.category);
    });
    return Array.from(set);
  }, [medicines]);

  // Filtered medicines
  const filteredMedicines = useMemo(() => {
    return medicines.filter((med) => {
      const name = (med.brandName || med.medicineName || '').toLowerCase();
      const generic = (med.genericName || '').toLowerCase();
      const mfr = (med.manufacturer || '').toLowerCase();
      const batch = (med.batchNo || med.batchNumber || '').toLowerCase();
      const hosp = (med.hospitalName || '').toLowerCase();
      const q = searchTerm.toLowerCase();

      // Search match
      const matchesSearch = !searchTerm || 
        name.includes(q) || generic.includes(q) || mfr.includes(q) || batch.includes(q) || hosp.includes(q);

      // Category match
      const matchesCategory = categoryFilter === 'all' || med.category === categoryFilter;

      // Hospital match
      const matchesHospital = hospitalFilter === 'all' || med.hospitalId === hospitalFilter;

      // Status match
      const statusObj = getMedicineStatus(med);
      const matchesStockStatus = stockStatusFilter === 'all' || statusObj.key === stockStatusFilter;

      // Expiry filter
      let matchesExpiry = true;
      if (expiryFilter !== 'all') {
        const exp = calculateMedicineExpiry(med.expiryDate, med.mfgDate, med.quantity);
        if (expiryFilter === 'expired') matchesExpiry = exp.isExpired;
        else if (expiryFilter === '30d') matchesExpiry = !exp.isExpired && exp.daysRemaining <= 30;
        else if (expiryFilter === '60d') matchesExpiry = !exp.isExpired && exp.daysRemaining <= 60;
        else if (expiryFilter === '90d') matchesExpiry = !exp.isExpired && exp.daysRemaining <= 90;
        else if (expiryFilter === 'healthy') matchesExpiry = !exp.isExpired && exp.daysRemaining > 90;
      }

      return matchesSearch && matchesCategory && matchesHospital && matchesStockStatus && matchesExpiry;
    });
  }, [medicines, searchTerm, categoryFilter, stockStatusFilter, expiryFilter, hospitalFilter]);

  // Modal Handlers
  const handleOpenAdd = () => {
    setIsEditMode(false);
    setEditingMedicineId(null);
    setFormData({
      ...initialFormState,
      batchNumber: 'BAT-' + Math.floor(10000 + Math.random() * 90000),
      hospitalId: hospitals[0]?.id || 'hosp-1',
    });
    setAddEditModalOpen(true);
  };

  const handleOpenEdit = (med) => {
    setIsEditMode(true);
    setEditingMedicineId(med.id);
    setFormData({
      medicineName: med.brandName || med.medicineName || '',
      genericName: med.genericName || '',
      category: med.category || 'Antibiotics & Anti-Infectives',
      manufacturer: med.manufacturer || '',
      batchNumber: med.batchNo || med.batchNumber || '',
      mfgDate: med.mfgDate || '',
      expiryDate: med.expiryDate || '',
      quantity: med.quantity || 0,
      minStockLevel: med.minStockLevel || 20,
      supplier: med.supplier || med.manufacturer || 'Approved Pharmaceutical Distributor',
      price: med.unitOriginalPrice || med.price || 450,
      hospitalId: med.hospitalId || (hospitals[0]?.id || 'hosp-1'),
    });
    setAddEditModalOpen(true);
  };

  const handleSaveMedicine = async (e) => {
    e.preventDefault();
    if (!formData.medicineName.trim()) {
      toast.error('Medicine name is required');
      return;
    }

    try {
      const payload = {
        brandName: formData.medicineName,
        medicineName: formData.medicineName,
        genericName: formData.genericName,
        category: formData.category,
        manufacturer: formData.manufacturer,
        batchNo: formData.batchNumber,
        mfgDate: formData.mfgDate,
        expiryDate: formData.expiryDate,
        quantity: Number(formData.quantity),
        minStockLevel: Number(formData.minStockLevel),
        supplier: formData.supplier,
        unitOriginalPrice: Number(formData.price),
        hospitalId: formData.hospitalId || hospitals[0]?.id,
      };

      if (isEditMode && editingMedicineId) {
        await dispatch(updateAdminMedicine({ id: editingMedicineId, data: payload })).unwrap();
        toast.success(`Updated ${formData.medicineName} record`);
      } else {
        await dispatch(addAdminMedicine(payload)).unwrap();
        toast.success(`Added ${formData.medicineName} to medicine registry`);
      }
      setAddEditModalOpen(false);
    } catch (err) {
      toast.error('Failed to save medicine');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await dispatch(deleteAdminMedicine(deleteTarget.id)).unwrap();
      toast.success(`Deleted ${deleteTarget.brandName || deleteTarget.medicineName}`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error('Failed to delete medicine record');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-secondary-950 via-secondary-900 to-primary-950 rounded-2xl p-5 sm:p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-[radial-gradient(ellipse_at_top_right,rgba(10,110,121,0.25),transparent_70%)] pointer-events-none" />
        
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-primary-500/20 text-cyan-300 border border-primary-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              Central Pharmaceutical Formulary
            </span>
            <span className="text-xs text-slate-400 font-mono">CDSCO Rule 65 Ledger</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Central Medicine Management</h1>
          <p className="text-xs text-slate-300 max-w-xl font-normal">
            Supervise accredited drug inventory, batch lot verification, safety buffer levels, and automated shelf-life concession calculations.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2.5">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold shadow-lg shadow-primary-600/20 transition-all flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Medicine</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        
        {/* Row 1: Search & Hospital Filter */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by brand, generic name, batch, or manufacturer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              <span>Hospital:</span>
            </span>
            <select
              value={hospitalFilter}
              onChange={(e) => setHospitalFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 max-w-[220px]"
            >
              <option value="all">All Hospitals ({hospitals.length})</option>
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Category, Stock Status & Expiry Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs">
          
          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Stock Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Stock Status:</span>
            <select
              value={stockStatusFilter}
              onChange={(e) => setStockStatusFilter(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="all">All Statuses</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="expiring_soon">Expiring Soon</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          {/* Expiry Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Expiry Timeline:</span>
            <select
              value={expiryFilter}
              onChange={(e) => setExpiryFilter(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="all">All Expiries</option>
              <option value="30d">Critical (Within 30 Days)</option>
              <option value="60d">Concession (Within 60 Days)</option>
              <option value="90d">Near Expiry (Within 90 Days)</option>
              <option value="healthy">Healthy Shelf Life (&gt; 90 Days)</option>
              <option value="expired">Expired Batches</option>
            </select>
          </div>

          {/* Reset Filters */}
          {(searchTerm || categoryFilter !== 'all' || stockStatusFilter !== 'all' || expiryFilter !== 'all' || hospitalFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('all');
                setStockStatusFilter('all');
                setExpiryFilter('all');
                setHospitalFilter('all');
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-bold ml-auto flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}

        </div>

      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading && medicines.length === 0 ? (
          <div className="py-20">
            <LoadingSpinner text="Loading centralized medicine directory..." />
          </div>
        ) : filteredMedicines.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto">
              <Layers className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No medicines match current filters</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting your search keyword or clearing the stock status and expiry filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200/80 text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-3.5 text-left">Medicine Name</th>
                  <th className="py-3 px-3 text-left">Generic Name</th>
                  <th className="py-3 px-3 text-left">Category</th>
                  <th className="py-3 px-3 text-left">Manufacturer</th>
                  <th className="py-3 px-2.5 text-center">Batch Number</th>
                  <th className="py-3 px-2.5 text-center">Available Stock</th>
                  <th className="py-3 px-2.5 text-center">Min Level</th>
                  <th className="py-3 px-3 text-center">Expiry Date</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMedicines.map((med) => {
                  const status = getMedicineStatus(med);
                  const hosp = hospitals.find((h) => h.id === med.hospitalId);

                  return (
                    <tr key={med.id} className="hover:bg-slate-50/70 transition-colors">
                      
                      {/* Medicine Name */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                            <Pill className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{med.brandName || med.medicineName}</div>
                            <div className="text-[10px] text-slate-400">
                              {hosp?.name || med.hospitalName || 'Health Facility'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Generic Name */}
                      <td className="py-3 px-3">
                        <div className="text-slate-700 font-medium max-w-[150px] truncate" title={med.genericName}>
                          {med.genericName || 'Active Formulation'}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
                          {med.category || 'Therapeutic'}
                        </span>
                      </td>

                      {/* Manufacturer */}
                      <td className="py-3 px-3 text-slate-600 font-medium">
                        {med.manufacturer || 'Approved Pharma Lab'}
                      </td>

                      {/* Batch Number */}
                      <td className="py-3 px-2.5 text-center">
                        <span className="font-mono text-[10px] font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {med.batchNo || med.batchNumber || 'BAT-2024'}
                        </span>
                      </td>

                      {/* Available Stock */}
                      <td className="py-3 px-2.5 text-center font-mono font-black text-slate-900">
                        {med.quantity}
                      </td>

                      {/* Minimum Stock Level */}
                      <td className="py-3 px-2.5 text-center font-mono text-slate-500 text-[11px]">
                        {med.minStockLevel || 20}
                      </td>

                      {/* Expiry Date */}
                      <td className="py-3 px-3 text-center font-mono text-slate-600 text-[11px] whitespace-nowrap">
                        {med.expiryDate || '2025-06-30'}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${status.badgeColor}`}>
                          {status.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setDetailsMedicine(med)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-primary-700 hover:bg-primary-50 transition-colors"
                            title="View Medicine Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(med)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                            title="Edit Medicine"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(med)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                            title="Delete Medicine"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* ADD / EDIT MEDICINE MODAL */}
      {/* ============================================================ */}
      <Modal
        isOpen={addEditModalOpen}
        onClose={() => setAddEditModalOpen(false)}
        title={isEditMode ? 'Edit Medicine Record' : 'Add New Medicine to Registry'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveMedicine} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Medicine Brand Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Paracetamol 500mg"
                value={formData.medicineName}
                onChange={(e) => setFormData({ ...formData, medicineName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Generic Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Acetaminophen"
                value={formData.genericName}
                onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-primary-500"
              >
                <option value="Antibiotics & Anti-Infectives">Antibiotics & Anti-Infectives</option>
                <option value="Critical Care / Antibiotic">Critical Care / Antibiotic</option>
                <option value="Cardiovascular">Cardiovascular</option>
                <option value="Analgesics & Antipyretics">Analgesics & Antipyretics</option>
                <option value="Oncology">Oncology</option>
                <option value="Emergency & ICU Supplies">Emergency & ICU Supplies</option>
                <option value="Diabetes & Endocrinology">Diabetes & Endocrinology</option>
                <option value="Respiratory">Respiratory</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Manufacturer *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sun Pharmaceutical Industries"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Batch Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. BAT-88210"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 font-mono font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Allocated Hospital
              </label>
              <select
                value={formData.hospitalId}
                onChange={(e) => setFormData({ ...formData, hospitalId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-primary-500"
              >
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Manufacturing Date
              </label>
              <input
                type="date"
                value={formData.mfgDate}
                onChange={(e) => setFormData({ ...formData, mfgDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Expiry Date *
              </label>
              <input
                type="date"
                required
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Quantity (Units) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Minimum Stock Level (Safety Buffer) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.minStockLevel}
                onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Authorized Supplier
              </label>
              <input
                type="text"
                placeholder="e.g. National Healthcare Distributors Ltd."
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Unit Price (₹ INR) *
              </label>
              <input
                type="number"
                min="1"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 font-mono font-bold text-primary-800"
              />
            </div>

          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddEditModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs shadow-md shadow-primary-600/20"
            >
              {isEditMode ? 'Update Medicine' : 'Save & Register Medicine'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ============================================================ */}
      {/* VIEW MEDICINE DETAILS MODAL */}
      {/* ============================================================ */}
      {detailsMedicine && (
        <Modal
          isOpen={Boolean(detailsMedicine)}
          onClose={() => setDetailsMedicine(null)}
          title="Medicine Detailed Dossier"
          maxWidth="max-w-xl"
        >
          {(() => {
            const status = getMedicineStatus(detailsMedicine);
            const hosp = hospitals.find((h) => h.id === detailsMedicine.hospitalId);

            return (
              <div className="space-y-4 text-xs">
                
                {/* Header card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-primary-50/40 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary-700 bg-primary-100/80 px-2 py-0.5 rounded">
                      {detailsMedicine.category || 'Pharmaceutical'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${status.badgeColor}`}>
                      {status.label}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900">{detailsMedicine.brandName || detailsMedicine.medicineName}</h3>
                  <p className="text-slate-500 font-medium">Generic: {detailsMedicine.genericName || 'Active Formulation'}</p>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div>
                    <span className="text-slate-400 font-bold text-[10px] block">MANUFACTURER</span>
                    <span className="font-semibold text-slate-800">{detailsMedicine.manufacturer || 'Approved Pharma Ltd'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold text-[10px] block">BATCH NUMBER</span>
                    <span className="font-mono font-bold text-slate-800">{detailsMedicine.batchNo || detailsMedicine.batchNumber || 'BAT-2024'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold text-[10px] block">AVAILABLE STOCK</span>
                    <span className="font-mono font-black text-primary-700 text-sm">{detailsMedicine.quantity} Units</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold text-[10px] block">MINIMUM SAFETY LEVEL</span>
                    <span className="font-mono font-bold text-slate-700">{detailsMedicine.minStockLevel || 20} Units</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold text-[10px] block">MANUFACTURED DATE</span>
                    <span className="font-mono text-slate-600">{detailsMedicine.mfgDate || '2024-01-10'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold text-[10px] block">EXPIRY DATE</span>
                    <span className="font-mono font-bold text-rose-700">{detailsMedicine.expiryDate || '2025-06-30'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold text-[10px] block">FACILITY LOCATION</span>
                    <span className="font-semibold text-slate-800">{hosp?.name || detailsMedicine.hospitalName || 'Health Facility'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold text-[10px] block">UNIT PRICE</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">₹ {detailsMedicine.unitOriginalPrice || detailsMedicine.price || 450}</span>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setDetailsMedicine(null)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
                  >
                    Close Dossier
                  </button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* ============================================================ */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ============================================================ */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Confirm Medicine Deletion"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Irreversible Action</p>
              <p className="text-[11px] mt-0.5 leading-relaxed">
                Are you sure you want to remove <span className="font-bold">{deleteTarget?.brandName || deleteTarget?.medicineName}</span> (Batch #{deleteTarget?.batchNo || deleteTarget?.batchNumber}) from the central directory?
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-sm"
            >
              Confirm Deletion
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default AdminMedicineData;
