import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
  Sparkles,
  CheckCircle2,
  FileSpreadsheet,
  ArrowUpDown,
  Clock,
  Pill,
  ShieldCheck,
  Download
} from 'lucide-react';
import { 
  fetchInventory, 
  addMedicineItem, 
  updateMedicineItem, 
  deleteMedicineItem 
} from '../../store/slices/hospitalSlice';
import MedicineModal from '../../components/forms/MedicineModal';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { isHospitalSuspended } from '../../services/storage';

export const HospitalInventory = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { inventory, isLoading } = useSelector((state) => state.hospital);
  const isSuspended = isHospitalSuspended(user?.id || 'hosp-1');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStorage, setSelectedStorage] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('expiry'); // 'expiry' | 'mfg' | 'quantity' | 'name' | 'value'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'

  const [modalOpen, setModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [deleteConfirmMed, setDeleteConfirmMed] = useState(null);

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

  useEffect(() => {
    dispatch(fetchInventory(user?.id || 'hosp-1'));
  }, [dispatch, user]);

  const handleOpenAdd = () => {
    if (isSuspended) {
      toast.error('Your hospital account is currently suspended. You cannot perform transactions or operational activities.');
      return;
    }
    setEditingMedicine(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (med) => {
    if (isSuspended) {
      toast.error('Your hospital account is currently suspended. You cannot perform transactions or operational activities.');
      return;
    }
    setEditingMedicine(med);
    setModalOpen(true);
  };

  const handleSaveMedicine = async (formData) => {
    try {
      if (editingMedicine) {
        await dispatch(updateMedicineItem({ id: editingMedicine.id, data: formData }));
        toast.success(`Updated ${formData.brandName} inventory record`);
      } else {
        const payload = {
          ...formData,
          hospitalId: user?.id || 'hosp-1',
          hospitalName: user?.name || 'Apollo Hospital',
        };
        await dispatch(addMedicineItem(payload));
        toast.success(`Added ${formData.brandName} to verified inventory`);
      }
    } catch (err) {
      toast.error('Failed to save medicine');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmMed) return;
    if (isSuspended) {
      toast.error('Your hospital account is currently suspended. You cannot perform transactions or operational activities.');
      return;
    }
    try {
      await dispatch(deleteMedicineItem(deleteConfirmMed.id));
      toast.success(`Removed ${deleteConfirmMed.brandName} from inventory`);
      setDeleteConfirmMed(null);
    } catch (err) {
      toast.error('Failed to delete medicine');
    }
  };

  const getExpiryStatus = (dateStr, qty) => {
    if (!dateStr) return { label: 'HEALTHY', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    const today = new Date();
    const exp = new Date(dateStr);
    const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));

    if (diffDays <= 30) {
      return { 
        label: 'CRITICAL EXPIRY', 
        badge: `${diffDays}d left`,
        color: 'bg-rose-50 text-rose-700 border-rose-200',
        statusKey: 'critical'
      };
    } else if (diffDays <= 90) {
      return { 
        label: 'NEAR EXPIRY', 
        badge: `${Math.ceil(diffDays / 30)}m left`,
        color: 'bg-amber-50 text-amber-800 border-amber-200',
        statusKey: 'near-expiry'
      };
    } else if (qty <= 20) {
      return { 
        label: 'LOW STOCK', 
        badge: 'Reorder Buffer',
        color: 'bg-orange-50 text-orange-700 border-orange-200',
        statusKey: 'low-stock'
      };
    } else if (qty > 300) {
      return { 
        label: 'OVERSTOCKED', 
        badge: 'Surplus',
        color: 'bg-cyan-50 text-cyan-800 border-cyan-200',
        statusKey: 'overstocked'
      };
    }
    return { 
      label: 'HEALTHY', 
      badge: `${Math.ceil(diffDays / 30)}m shelf`,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      statusKey: 'healthy'
    };
  };

  // Filter & Sort medicines
  const filteredMedicines = inventory
    .filter((med) => {
      const mfg = getMfgDate(med);
      const matchesSearch = med.brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.genericName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.power.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (med.batchNo && med.batchNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (mfg && mfg.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStorage = selectedStorage === 'all' || med.storageType.includes(selectedStorage);
      
      const expiry = getExpiryStatus(med.expiryDate, med.quantity);
      const matchesStatus = selectedStatusFilter === 'all' || expiry.statusKey === selectedStatusFilter;

      return matchesSearch && matchesStorage && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.brandName.localeCompare(b.brandName);
      } else if (sortBy === 'quantity') {
        comparison = a.quantity - b.quantity;
      } else if (sortBy === 'mfg') {
        comparison = new Date(getMfgDate(a)) - new Date(getMfgDate(b));
      } else if (sortBy === 'expiry') {
        comparison = new Date(a.expiryDate) - new Date(b.expiryDate);
      } else if (sortBy === 'value') {
        comparison = (a.unitOriginalPrice * a.quantity) - (b.unitOriginalPrice * b.quantity);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleExportCsv = () => {
    const items = filteredMedicines.length > 0 ? filteredMedicines : inventory;
    if (items.length === 0) {
      toast.error('No medicines available to export');
      return;
    }
    const headers = ['Brand Name', 'Dosage', 'Batch', 'Storage', 'Mfg Date', 'Expiry Date', 'Stock Qty', 'MRP', 'Concession %', 'Final Price'];
    const rows = items.map((i) => {
      const finalPrice = Math.round(
        i.unitOriginalPrice * (1 - (i.concessionPercent || 0) / 100) * 100
      ) / 100;
      return [
        `"${i.brandName}"`,
        `"${i.power}"`,
        `"${i.batchNo || 'N/A'}"`,
        `"${i.storageType}"`,
        `"${getMfgDate(i)}"`,
        `"${i.expiryDate}"`,
        i.quantity,
        i.unitOriginalPrice,
        i.concessionPercent || 0,
        finalPrice
      ];
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SmartMediShare_Hospital_Inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${items.length} records to CSV`);
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-secondary-900 tracking-tight">
              Hospital Medicine Inventory Ledger
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded">
              CDSCO VERIFIED
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage pharmaceutical stock, storage parameters, automated expiry concession rates, and live quantities.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-sm hover:border-slate-400"
            title="Export ledger to CSV"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleOpenAdd}
            disabled={isSuspended}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-md shadow-primary-600/25 transition-all hover:scale-[1.02]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Medicine</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          
          {/* Search Box */}
          <div className="relative lg:col-span-5">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Brand, Formulation, Batch No..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium"
            />
          </div>

          {/* Storage Filter */}
          <div className="lg:col-span-4 flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <select
              value={selectedStorage}
              onChange={(e) => setSelectedStorage(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-semibold text-slate-700 focus:outline-none"
            >
              <option value="all">All Storage Conditions</option>
              <option value="Cold Storage">Cold Storage (2°C - 8°C)</option>
              <option value="Room Temperature">Room Temperature</option>
              <option value="Protect from Light">Light Protected</option>
              <option value="Deep Freeze">Deep Freeze (-20°C)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-3">
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-semibold text-slate-700 focus:outline-none"
            >
              <option value="all">All Status Profiles</option>
              <option value="critical">Critical Expiry (&lt;30d)</option>
              <option value="near-expiry">Near Expiry (30 - 90d)</option>
              <option value="healthy">Healthy Reserve</option>
              <option value="low-stock">Low Stock Warning</option>
              <option value="overstocked">Overstocked Surplus</option>
            </select>
          </div>

        </div>
      </div>

      {/* Professional Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {isLoading && inventory.length === 0 ? (
          <LoadingSpinner text="Fetching verified hospital inventory..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th 
                    onClick={() => toggleSort('name')}
                    className="px-4 py-3.5 text-left cursor-pointer hover:text-primary-700 select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>Medicine & Formulation</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="px-3 py-3.5 text-left">Dosage & Batch</th>
                  <th className="px-3 py-3.5 text-left">Storage SLA</th>
                  <th 
                    onClick={() => toggleSort('mfg')}
                    className="px-3 py-3.5 text-left cursor-pointer hover:text-primary-700 select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>Mfg Date</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th 
                    onClick={() => toggleSort('expiry')}
                    className="px-3 py-3.5 text-left cursor-pointer hover:text-primary-700 select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>Expiry Countdown</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th 
                    onClick={() => toggleSort('quantity')}
                    className="px-3 py-3.5 text-center cursor-pointer hover:text-primary-700 select-none"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Stock Qty</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="px-3 py-3.5 text-center">Status</th>
                  <th 
                    onClick={() => toggleSort('value')}
                    className="px-4 py-3.5 text-right cursor-pointer hover:text-primary-700 select-none"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Unit Price / Discount</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="px-4 py-3.5 text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredMedicines.length > 0 ? (
                  filteredMedicines.map((med) => {
                    const expiryInfo = getExpiryStatus(med.expiryDate, med.quantity);
                    const finalPrice = Math.round(
                      med.unitOriginalPrice * (1 - (med.concessionPercent || 0) / 100) * 100
                    ) / 100;
                    const isCold = med.storageType?.toLowerCase().includes('cold');
                    const mfgDate = getMfgDate(med);

                    return (
                      <tr 
                        key={med.id} 
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        {/* Medicine Name & Generic */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold flex-shrink-0 border border-slate-200">
                              <Pill className="w-4 h-4 text-primary-600 rotate-45" />
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

                        {/* Dosage & Batch */}
                        <td className="px-3 py-3.5">
                          <span className="font-semibold text-slate-800 block">{med.power}</span>
                          <span className="text-[10px] font-mono text-slate-400">
                            Lot: {med.batchNo || 'LOT-2024-X'}
                          </span>
                        </td>

                        {/* Storage Condition */}
                        <td className="px-3 py-3.5">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md border ${
                            isCold 
                              ? 'bg-cyan-50 text-cyan-800 border-cyan-200' 
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            <Thermometer className={`w-3 h-3 ${isCold ? 'text-cyan-600' : 'text-slate-400'}`} />
                            {med.storageType}
                          </span>
                        </td>

                        {/* Mfg Date */}
                        <td className="px-3 py-3.5">
                          <div className="font-bold text-slate-700 font-mono text-xs">{mfgDate}</div>
                          <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-slate-400 mt-0.5">
                            <Calendar className="w-2.5 h-2.5 text-slate-400" />
                            Batch Mfg
                          </span>
                        </td>

                        {/* Expiry Countdown */}
                        <td className="px-3 py-3.5">
                          <div className="font-bold text-slate-800 font-mono text-xs">{med.expiryDate}</div>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border mt-0.5 ${expiryInfo.color}`}>
                            <Clock className="w-2.5 h-2.5" />
                            {expiryInfo.badge}
                          </span>
                        </td>

                        {/* Quantity */}
                        <td className="px-3 py-3.5 text-center">
                          <span className="font-mono font-extrabold text-slate-900 text-sm">{med.quantity}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">units</span>
                        </td>

                        {/* Status Pill */}
                        <td className="px-3 py-3.5 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-extrabold border uppercase tracking-wider ${expiryInfo.color}`}>
                            {expiryInfo.label}
                          </span>
                        </td>

                        {/* Pricing / Concession */}
                        <td className="px-4 py-3.5 text-right font-mono">
                          <div className="font-extrabold text-primary-700 text-sm">
                            ₹{finalPrice}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            MRP ₹{med.unitOriginalPrice} • <strong className="text-amber-700">{med.concessionPercent || 0}% OFF</strong>
                          </div>
                        </td>

                        {/* Action Buttons */}
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(med)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-primary-700 hover:bg-primary-50 transition-colors"
                              title="Edit Record"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => !isSuspended && setDeleteConfirmMed(med)}
                              disabled={isSuspended}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" className="px-6 py-12 text-center text-slate-400">
                      <Boxes className="w-10 h-10 mx-auto mb-2 opacity-40" />
                      <p className="font-bold text-sm text-slate-700">No inventory batches match your query</p>
                      <button
                        onClick={handleOpenAdd}
                        className="mt-2 text-xs font-bold text-primary-600 underline"
                      >
                        Add your first medicine batch
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal (MedicineModal preserved) */}
      <MedicineModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSaveMedicine}
        initialData={editingMedicine}
        isEdit={!!editingMedicine}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmMed}
        onClose={() => setDeleteConfirmMed(null)}
        title="Confirm Delisting from Inventory"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 pt-1">
          <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-rose-800 leading-relaxed">
              Are you sure you want to remove <strong className="font-bold">{deleteConfirmMed?.brandName}</strong> ({deleteConfirmMed?.power})? This will immediately delist it from the inter-hospital marketplace.
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
              Confirm Delisting
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default HospitalInventory;
