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
  FileSpreadsheet
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

export const HospitalInventory = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { inventory, isLoading } = useSelector((state) => state.hospital);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStorage, setSelectedStorage] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [deleteConfirmMed, setDeleteConfirmMed] = useState(null);

  useEffect(() => {
    dispatch(fetchInventory(user?.id || 'hosp-1'));
  }, [dispatch, user]);

  const handleOpenAdd = () => {
    setEditingMedicine(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (med) => {
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
    try {
      await dispatch(deleteMedicineItem(deleteConfirmMed.id));
      toast.success(`Removed ${deleteConfirmMed.brandName} from inventory`);
      setDeleteConfirmMed(null);
    } catch (err) {
      toast.error('Failed to delete medicine');
    }
  };

  // Filter medicines
  const filteredMedicines = inventory.filter((med) => {
    const matchesSearch = med.brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.genericName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.power.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStorage = selectedStorage === 'all' || med.storageType.includes(selectedStorage);
    return matchesSearch && matchesStorage;
  });

  const getExpiryStatus = (dateStr) => {
    if (!dateStr) return { label: 'Valid', color: 'bg-slate-100 text-slate-700' };
    const today = new Date();
    const exp = new Date(dateStr);
    const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));

    if (diffDays <= 60) {
      return { label: `Expiring (${diffDays}d)`, color: 'bg-rose-100 text-rose-800 border-rose-200' };
    } else if (diffDays <= 120) {
      return { label: `Near Expiry (${Math.ceil(diffDays / 30)}m)`, color: 'bg-amber-100 text-amber-800 border-amber-200' };
    }
    return { label: `${Math.ceil(diffDays / 30)}m left`, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 tracking-tight">Hospital Medicine Inventory</h1>
          <p className="text-xs text-slate-500">
            Manage pharmaceutical stock, storage parameters, automated expiry concession rates, and live quantities.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-lg shadow-primary-500/25 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Medicine</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by brand name, power, formulation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Storage:</span>
          </div>
          <select
            value={selectedStorage}
            onChange={(e) => setSelectedStorage(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:outline-none"
          >
            <option value="all">All Storage Types</option>
            <option value="Cold Storage">Cold Storage (2°C - 8°C)</option>
            <option value="Room Temperature">Room Temperature</option>
            <option value="Protect from Light">Light Protected</option>
            <option value="Deep Freeze">Deep Freeze (-20°C)</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading && inventory.length === 0 ? (
          <LoadingSpinner text="Fetching inventory records..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5 text-left">Brand & Formulation</th>
                  <th className="px-4 py-3.5 text-left">Power / Dosage</th>
                  <th className="px-4 py-3.5 text-left">Storage Condition</th>
                  <th className="px-4 py-3.5 text-left">Expiry Date</th>
                  <th className="px-4 py-3.5 text-center">Stock Qty</th>
                  <th className="px-4 py-3.5 text-right">Original MRP</th>
                  <th className="px-4 py-3.5 text-center">Concession %</th>
                  <th className="px-4 py-3.5 text-right">Final Price</th>
                  <th className="px-5 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredMedicines.length > 0 ? (
                  filteredMedicines.map((med) => {
                    const expiryInfo = getExpiryStatus(med.expiryDate);
                    const finalPrice = Math.round(
                      med.unitOriginalPrice * (1 - (med.concessionPercent || 0) / 100) * 100
                    ) / 100;

                    return (
                      <tr key={med.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900">{med.brandName}</div>
                          <div className="text-[11px] text-slate-500">{med.genericName || med.category}</div>
                          {med.batchNo && (
                            <span className="text-[10px] font-mono text-slate-400">Lot: {med.batchNo}</span>
                          )}
                        </td>
                        <td className="px-4 py-4 font-semibold text-slate-800">{med.power}</td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            <Thermometer className="w-3 h-3 text-primary-600" />
                            {med.storageType}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-semibold text-slate-800">{med.expiryDate}</div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border mt-0.5 ${expiryInfo.color}`}>
                            {expiryInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="font-bold text-slate-900 text-sm">{med.quantity}</span>
                          <span className="text-[10px] text-slate-400 block">units</span>
                        </td>
                        <td className="px-4 py-4 text-right text-slate-500">
                          ₹{med.unitOriginalPrice}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            {med.concessionPercent || 0}% OFF
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right font-bold text-primary-700">
                          ₹{finalPrice}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenEdit(med)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                              title="Edit Medicine"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmMed(med)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete Medicine"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" className="px-6 py-12 text-center text-slate-400">
                      <Boxes className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="font-semibold">No medicines match your search or filter.</p>
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

      {/* Add / Edit Modal */}
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
        title="Confirm Inventory Deletion"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 pt-1">
          <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-rose-700">
              Are you sure you want to remove <strong className="font-bold">{deleteConfirmMed?.brandName}</strong> from active inventory? This action will delist it from the marketplace immediately.
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
              Delete Record
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default HospitalInventory;
