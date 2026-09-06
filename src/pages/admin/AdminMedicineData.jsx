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
  CheckCircle2,
  ThermometerSnowflake,
  ShieldCheck,
  ChevronRight
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-ocean-950 via-ocean-900 to-teal-950 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-[radial-gradient(ellipse_at_top_right,rgba(10,110,121,0.25),transparent_70%)] pointer-events-none" />
        
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <ShieldCheck className="w-3 h-3 text-teal-400" />
              CDSCO Pharmaceutical Authority
            </span>
            <span className="text-xs text-slate-400 font-mono">Form 20B / 21B Ledger</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Central Medicine Inventory Authority</h1>
          <p className="text-xs text-slate-300 max-w-xl font-normal">
            Supervisory inventory oversight across all regional hospital pharmacies with administrative batch modification privileges.
          </p>
        </div>

        <div className="relative z-10">
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-lg shadow-teal-600/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Batch to Institution</span>
          </button>
        </div>
      </div>

      {/* Split Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* LEFT PANEL: Hospital Directory */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Hospital Directory
            </h3>
            <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
              {hospitals.length} Hubs
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search hospital or city..."
              value={hospitalSearch}
              onChange={(e) => setHospitalSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>

          <div className="space-y-1.5 max-h-[540px] overflow-y-auto pt-1">
            <button
              onClick={() => handleSelectHospital('all')}
              className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                selectedHospitalId === 'all'
                  ? 'bg-ocean-900 text-white shadow-sm'
                  : 'hover:bg-slate-50 text-slate-700 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-400" />
                <span>All Hospital Stocks</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                selectedHospitalId === 'all' ? 'bg-white/10 text-teal-300' : 'bg-slate-100 text-slate-600'
              }`}>
                {medicines.length}
              </span>
            </button>

            {filteredHospitals.map((hosp) => (
              <button
                key={hosp.id}
                onClick={() => handleSelectHospital(hosp.id)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs transition-all flex items-start justify-between gap-2 ${
                  selectedHospitalId === hosp.id
                    ? 'bg-teal-50 text-teal-950 border border-teal-200 font-bold shadow-sm'
                    : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                }`}
              >
                <div className="space-y-0.5">
                  <p className="font-bold leading-tight truncate max-w-[140px]">{hosp.name}</p>
                  <p className="text-[10px] text-slate-400">{hosp.city}, {hosp.state}</p>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className={`w-2 h-2 rounded-full ${hosp.status === 'verified' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL: Medicine Inventory Grid / Table */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Header Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-900">
                {selectedHospitalId === 'all' ? 'Consolidated Multi-Hospital Stock' : `${selectedHospitalObj?.name} Master Ledger`}
              </h3>
              <p className="text-xs text-slate-400 font-mono">Showing {filteredMedicines.length} recorded formulations</p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter brand, generic, or batch..."
                value={medicineSearch}
                onChange={(e) => setMedicineSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200/80 text-xs">
                <thead className="bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-3.5 text-left">Medicine & Formulation</th>
                    <th className="px-3 py-3.5 text-left">Hospital Provider</th>
                    <th className="px-3 py-3.5 text-left">Storage Protocol</th>
                    <th className="px-3 py-3.5 text-left">Mfg Date</th>
                    <th className="px-3 py-3.5 text-left">Expiry Date</th>
                    <th className="px-3 py-3.5 text-center">Batch Qty</th>
                    <th className="px-3 py-3.5 text-right">Price / Concession</th>
                    <th className="px-4 py-3.5 text-center">Supervisory Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredMedicines.length > 0 ? (
                    filteredMedicines.map((med) => (
                      <tr key={med.id} className="hover:bg-teal-50/20 transition-colors group">
                        
                        {/* Medicine Name */}
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors">{med.brandName}</div>
                          <div className="text-[11px] text-teal-800 font-semibold">{med.power}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[170px]">{med.genericName}</div>
                        </td>

                        {/* Hospital */}
                        <td className="px-3 py-3.5">
                          <div className="font-bold text-slate-800">{med.hospitalName}</div>
                          <span className="text-[10px] text-slate-400 block">{med.location}</span>
                        </td>

                        {/* Storage */}
                        <td className="px-3 py-3.5">
                          <span className="inline-flex items-center gap-1 text-[11px] text-sky-800 font-medium bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                            <ThermometerSnowflake className="w-3 h-3 text-sky-600" />
                            {med.storageType}
                          </span>
                        </td>

                        {/* Mfg Date */}
                        <td className="px-3 py-3.5 font-medium text-slate-600 font-mono">
                          {med.mfgDate || '2023-11-15'}
                        </td>

                        {/* Expiry */}
                        <td className="px-3 py-3.5 font-semibold text-slate-800 font-mono">
                          {med.expiryDate}
                        </td>

                        {/* Qty */}
                        <td className="px-3 py-3.5 text-center font-black text-slate-900 font-mono text-sm">
                          {med.quantity}
                        </td>

                        {/* Price & Concession */}
                        <td className="px-3 py-3.5 text-right">
                          <span className="font-bold text-slate-900 font-mono">₹{med.unitOriginalPrice}</span>
                          <span className="text-[10px] text-amber-700 font-bold block">{med.concessionPercent}% Concession</span>
                        </td>

                        {/* Admin Action */}
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(med)}
                              className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                              title="Edit Record"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(med)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                        <Boxes className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="font-bold text-slate-700">No medicines recorded for this hospital</p>
                        <p className="text-xs text-slate-400 mt-1">Select a different hospital or clear search terms.</p>
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
        title="Administrative Record Removal"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 pt-1">
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 leading-relaxed">
            Confirm administrative deletion of <strong>{deleteTarget?.brandName}</strong> from hospital {deleteTarget?.hospitalName}? This action is logged under statutory audit.
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm"
            >
              Confirm Admin Removal
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default AdminMedicineData;
