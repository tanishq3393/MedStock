import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Building2, 
  Search, 
  PlusCircle, 
  Edit3, 
  Trash2, 
  Layers, 
  Thermometer, 
  Calendar,
  AlertTriangle,
  Boxes,
  CheckCircle2
} from 'lucide-react';
import { 
  fetchHospitals, 
  fetchAdminMedicines, 
  addAdminMedicine, 
  updateAdminMedicine, 
  deleteAdminMedicine 
} from '../../store/slices/adminSlice';
import MedicineModal from '../../components/forms/MedicineModal';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export const AdminMedicineData = () => {
  const dispatch = useDispatch();
  const { hospitals, medicines, isLoading } = useSelector((state) => state.admin);

  const [selectedHospitalId, setSelectedHospitalId] = useState('all');
  const [hospitalSearch, setHospitalSearch] = useState('');
  const [medicineSearch, setMedicineSearch] = useState('');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    dispatch(fetchHospitals());
    dispatch(fetchAdminMedicines(selectedHospitalId));
  }, [dispatch, selectedHospitalId]);

  const handleSelectHospital = (id) => {
    setSelectedHospitalId(id);
  };

  const handleOpenAdd = () => {
    setEditingMed(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (med) => {
    setEditingMed(med);
    setModalOpen(true);
  };

  const handleSaveMedicine = async (formData) => {
    try {
      if (editingMed) {
        await dispatch(updateAdminMedicine({ id: editingMed.id, data: formData }));
        toast.success(`Admin updated ${formData.brandName} record`);
      } else {
        const targetHospId = selectedHospitalId === 'all' ? (hospitals[0]?.id || 'hosp-1') : selectedHospitalId;
        const payload = {
          ...formData,
          hospitalId: targetHospId,
        };
        await dispatch(addAdminMedicine(payload));
        toast.success(`Added ${formData.brandName} to hospital inventory`);
      }
    } catch (err) {
      toast.error('Failed to save medicine');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await dispatch(deleteAdminMedicine(deleteTarget.id));
      toast.success(`Deleted ${deleteTarget.brandName}`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error('Failed to delete medicine record');
    }
  };

  const filteredHospitals = hospitals.filter((h) =>
    h.name.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
    h.city.toLowerCase().includes(hospitalSearch.toLowerCase())
  );

  const filteredMedicines = medicines.filter((m) =>
    m.brandName.toLowerCase().includes(medicineSearch.toLowerCase()) ||
    m.genericName?.toLowerCase().includes(medicineSearch.toLowerCase()) ||
    m.hospitalName?.toLowerCase().includes(medicineSearch.toLowerCase())
  );

  const selectedHospitalObj = hospitals.find((h) => h.id === selectedHospitalId);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 tracking-tight">Central Medicine Inventory Authority</h1>
          <p className="text-xs text-slate-500">
            Supervisory directory of all hospital pharmacy stocks across national clusters.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-md shadow-primary-500/20 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Medicine to Hospital</span>
        </button>
      </div>

      {/* Split Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* LEFT PANEL: Hospital Directory */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Select Hospital Directory
          </h3>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search hospital..."
              value={hospitalSearch}
              onChange={(e) => setHospitalSearch(e.target.value)}
              className="w-full pl-8 pr-2 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none"
            />
          </div>

          <div className="space-y-1 max-h-[500px] overflow-y-auto pt-1">
            <button
              onClick={() => handleSelectHospital('all')}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                selectedHospitalId === 'all'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span>All Hospital Stocks</span>
              </div>
              <span className="text-[10px] font-mono opacity-80">{medicines.length} items</span>
            </button>

            {filteredHospitals.map((hosp) => (
              <button
                key={hosp.id}
                onClick={() => handleSelectHospital(hosp.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all flex items-start justify-between gap-2 ${
                  selectedHospitalId === hosp.id
                    ? 'bg-primary-50 text-primary-900 border border-primary-200 font-bold'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="space-y-0.5">
                  <p className="font-semibold leading-tight">{hosp.name}</p>
                  <p className="text-[10px] text-slate-400">{hosp.city}, {hosp.state}</p>
                </div>
                <span className={`w-2 h-2 rounded-full mt-1 ${hosp.status === 'verified' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL: Medicine Inventory Grid / Table */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Header Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {selectedHospitalId === 'all' ? 'All Platform Medicines' : `${selectedHospitalObj?.name} Inventory`}
              </h3>
              <p className="text-xs text-slate-400">Showing {filteredMedicines.length} recorded items</p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search medicines by name or generic..."
                value={medicineSearch}
                onChange={(e) => setMedicineSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-3 text-left">Medicine & Formulation</th>
                    <th className="px-3 py-3 text-left">Hospital Provider</th>
                    <th className="px-3 py-3 text-left">Storage Condition</th>
                    <th className="px-3 py-3 text-left">Expiry</th>
                    <th className="px-3 py-3 text-center">Qty</th>
                    <th className="px-3 py-3 text-right">Price / Concession</th>
                    <th className="px-4 py-3 text-center">Admin Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredMedicines.length > 0 ? (
                    filteredMedicines.map((med) => (
                      <tr key={med.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900">{med.brandName}</div>
                          <span className="text-[11px] text-primary-700 font-semibold">{med.power}</span>
                          <span className="text-[10px] text-slate-400 block truncate max-w-[160px]">{med.genericName}</span>
                        </td>
                        <td className="px-3 py-3.5">
                          <span className="font-semibold text-slate-800">{med.hospitalName}</span>
                          <span className="text-[10px] text-slate-400 block">{med.location}</span>
                        </td>
                        <td className="px-3 py-3.5">
                          <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            {med.storageType}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 font-semibold text-slate-800">
                          {med.expiryDate}
                        </td>
                        <td className="px-3 py-3.5 text-center font-bold text-slate-900">
                          {med.quantity}
                        </td>
                        <td className="px-3 py-3.5 text-right">
                          <span className="font-bold text-slate-900">₹{med.unitOriginalPrice}</span>
                          <span className="text-[10px] text-amber-700 font-bold block">{med.concessionPercent}% OFF</span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(med)}
                              className="p-1 text-slate-400 hover:text-primary-600 hover:bg-slate-100 rounded"
                              title="Edit Record"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(med)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-10 text-center text-slate-400">
                        <Boxes className="w-8 h-8 mx-auto mb-1 opacity-40" />
                        <p className="font-semibold">No medicines recorded for this hospital</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

      {/* Edit / Add Modal */}
      <MedicineModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSaveMedicine}
        initialData={editingMed}
        isEdit={!!editingMed}
      />

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Admin Record Removal"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 pt-1">
          <p className="text-xs text-slate-600">
            Confirm administrative deletion of <strong>{deleteTarget?.brandName}</strong> from hospital {deleteTarget?.hospitalName}?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
            >
              Confirm Admin Delete
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default AdminMedicineData;
