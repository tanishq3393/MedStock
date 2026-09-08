import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  Trash2, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Building2, 
  Filter, 
  ArrowRight, 
  Sparkles, 
  Info, 
  Calendar, 
  X, 
  FileText, 
  HelpCircle, 
  PackageCheck,
  Flame,
  FileCheck2,
  Boxes,
  RotateCcw,
  Search,
  ExternalLink,
  MapPin
} from 'lucide-react';
import { 
  fetchHospitalDisposals, 
  disposeMedicineItem,
  fetchInventory 
} from '../../store/slices/hospitalSlice';
import DisposalCertificateModal from '../../components/common/DisposalCertificateModal';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { calculateMedicineExpiry } from '../../utils/expiryUtils';
import toast from 'react-hot-toast';

export const HospitalWasteManagement = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { inventory = [], disposals = [], isLoading } = useSelector((state) => state.hospital);

  const [activeTab, setActiveTab] = useState('expired'); // 'expired' | 'history'
  const [selectedDisposalForCert, setSelectedDisposalForCert] = useState(null);
  
  // Confirmation Modal State
  const [medicineToDispose, setMedicineToDispose] = useState(null);
  const [isDisposing, setIsDisposing] = useState(false);

  // Search in disposal history
  const [historySearch, setHistorySearch] = useState('');

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchInventory(user.id));
      dispatch(fetchHospitalDisposals(user.id));
    }
  }, [dispatch, user?.id]);

  // Derive Expired Medicines Requiring Disposal from Inventory (Single Source of Truth)
  const expiredMedicines = useMemo(() => {
    return inventory
      .filter((med) => {
        // Exclude already disposed medicines
        if (med.status === 'disposed') return false;
        const expiryMeta = calculateMedicineExpiry(med.expiryDate, med.quantity);
        return expiryMeta.isExpired;
      })
      .map((med) => {
        const expiryMeta = calculateMedicineExpiry(med.expiryDate, med.quantity);
        const daysExpired = Math.abs(expiryMeta.daysRemaining);
        return {
          ...med,
          expiryMeta,
          daysExpired,
          disposalStatus: med.status === 'pending_disposal' ? 'Disposal Requested' : 'Expired - Action Required',
        };
      })
      .sort((a, b) => b.daysExpired - a.daysExpired);
  }, [inventory]);

  // Combined Disposal History records
  const combinedDisposalHistory = useMemo(() => {
    return disposals
      .filter((item) => {
        if (!historySearch) return true;
        const q = historySearch.toLowerCase();
        return (
          item.medicineName?.toLowerCase().includes(q) ||
          item.brandName?.toLowerCase().includes(q) ||
          item.batchNo?.toLowerCase().includes(q) ||
          item.facilityName?.toLowerCase().includes(q) ||
          item.bioCentreName?.toLowerCase().includes(q)
        );
      });
  }, [disposals, historySearch]);

  // Summary counts
  const summaryMetrics = useMemo(() => {
    const expiredCount = expiredMedicines.length;
    const expiredUnits = expiredMedicines.reduce((sum, m) => sum + (Number(m.quantity) || 0), 0);
    const historyCount = disposals.length;
    const historyUnits = disposals.reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);

    return {
      expiredCount,
      expiredUnits,
      historyCount,
      historyUnits,
    };
  }, [expiredMedicines, disposals]);

  // Handle open confirmation modal
  const handleOpenDisposeModal = (med) => {
    setMedicineToDispose(med);
  };

  // Confirm Disposal Handler
  const handleConfirmDisposal = async () => {
    if (!medicineToDispose) return;
    setIsDisposing(true);

    try {
      await dispatch(disposeMedicineItem({
        hospitalId: user?.id,
        medicineId: medicineToDispose.id,
        reason: 'Statutory Expiration Safe Bio-Disposal',
        facilityName: 'GreenBio Medical Waste Centre',
      })).unwrap();

      toast.success(
        `Successfully disposed ${medicineToDispose.quantity} units of ${medicineToDispose.brandName || medicineToDispose.medicineName} at GreenBio Medical Waste Centre`,
        { duration: 4500 }
      );

      setMedicineToDispose(null);
      // Switch view to history so user immediately sees their record
      setActiveTab('history');
    } catch (err) {
      toast.error('Failed to process bio-waste disposal: ' + (err.message || err));
    } finally {
      setIsDisposing(false);
    }
  };

  return (
    <div className="space-y-7 pb-10">
      
      {/* 1. Page Header (WHERE AM I? + WHAT IS THE PURPOSE?) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Bio-Waste Disposal
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-mono font-bold">
              CPCB Form-IV Compliant
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Review expired medicines and send them for safe disposal.
          </p>
        </div>

        {/* Authorized Center Live Badge */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>GreenBio Medical Waste Centre</span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono">
              Authorized CBMWTF Facility • Taloja MIDC
            </p>
          </div>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        
        {/* Card 1: Expired Requiring Action */}
        <div 
          onClick={() => setActiveTab('expired')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-sm space-y-1 ${
            activeTab === 'expired' 
              ? 'bg-rose-50/40 border-rose-300 ring-2 ring-rose-500/20' 
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 block">
            Needing Disposal
          </span>
          <div className="text-2xl font-black text-rose-800 font-mono">
            {summaryMetrics.expiredCount} <span className="text-xs font-normal text-rose-600">batches</span>
          </div>
          <p className="text-[11px] text-rose-600 font-medium">
            {summaryMetrics.expiredUnits.toLocaleString()} units expired
          </p>
        </div>

        {/* Card 2: Total Disposed Batches */}
        <div 
          onClick={() => setActiveTab('history')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-sm space-y-1 ${
            activeTab === 'history' 
              ? 'bg-purple-50/40 border-purple-300 ring-2 ring-purple-500/20' 
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 block">
            Disposed Batches
          </span>
          <div className="text-2xl font-black text-purple-800 font-mono">
            {summaryMetrics.historyCount} <span className="text-xs font-normal text-purple-600">batches</span>
          </div>
          <p className="text-[11px] text-purple-600 font-medium">
            Form-IV certified
          </p>
        </div>

        {/* Card 3: Total Units Destroyed */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Units Destroyed
          </span>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {summaryMetrics.historyUnits.toLocaleString()} <span className="text-xs font-normal text-slate-500">units</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            High-temp incineration
          </p>
        </div>

        {/* Card 4: Environmental Compliance */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200/70 bg-emerald-50/20 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
            Regulatory Compliance
          </span>
          <div className="text-2xl font-black text-emerald-800 font-mono">
            100%
          </div>
          <p className="text-[11px] text-emerald-600 font-medium">
            Zero landfill bio-hazard
          </p>
        </div>

      </div>

      {/* 3. Section Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('expired')}
          className={`pb-3 px-4 text-xs font-bold transition-all relative flex items-center gap-2 ${
            activeTab === 'expired'
              ? 'text-rose-700 border-b-2 border-rose-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Expired Medicines Requiring Disposal</span>
          {expiredMedicines.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-rose-100 text-rose-800">
              {expiredMedicines.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-4 text-xs font-bold transition-all relative flex items-center gap-2 ${
            activeTab === 'history'
              ? 'text-primary-700 border-b-2 border-primary-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Disposal History</span>
          {disposals.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
              {disposals.length}
            </span>
          )}
        </button>
      </div>

      {/* 4. SECTION CONTENT: EXPIRED MEDICINES */}
      {activeTab === 'expired' && (
        <div className="space-y-4">
          
          <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <h3 className="text-xs font-bold text-rose-900">
                  Automatic Expiry Identification Active
                </h3>
                <p className="text-[11px] text-rose-700">
                  These medicines are identified as expired based on their recorded expiry dates in hospital inventory.
                </p>
              </div>
            </div>
            <Link
              to="/hospital/inventory"
              className="text-xs font-bold text-rose-800 hover:text-rose-900 hover:underline flex items-center gap-1 self-start sm:self-auto flex-shrink-0"
            >
              <span>View Full Inventory</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {isLoading && inventory.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <LoadingSpinner text="Checking hospital inventory for expired batches..." />
            </div>
          ) : expiredMedicines.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                No Expired Medicines Requiring Disposal
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                All medicines currently in your hospital inventory are within their valid shelf life. Any expired batches added will automatically appear here for bio-waste destruction.
              </p>
              <div className="pt-2">
                <Link
                  to="/hospital/inventory"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-sm"
                >
                  <Boxes className="w-4 h-4" />
                  <span>Manage Hospital Inventory</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
              
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-4 py-3.5 text-left">Medicine / Brand</th>
                      <th className="px-3 py-3.5 text-left">Batch Number</th>
                      <th className="px-3 py-3.5 text-center">Expired Quantity</th>
                      <th className="px-3 py-3.5 text-left">Expiry Date</th>
                      <th className="px-3 py-3.5 text-left">Days Expired</th>
                      <th className="px-3 py-3.5 text-center">Status</th>
                      <th className="px-4 py-3.5 text-center">Disposal Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {expiredMedicines.map((med) => (
                      <tr key={med.id} className="hover:bg-rose-50/20 transition-colors">
                        
                        {/* Medicine / Brand */}
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900 leading-tight text-sm">
                            {med.brandName}
                          </div>
                          <div className="text-[11px] text-slate-500 line-clamp-1">
                            {med.genericName || med.power} • {med.form || 'Pharmaceutical Formulation'}
                          </div>
                        </td>

                        {/* Batch Number */}
                        <td className="px-3 py-3.5 font-mono font-bold text-slate-800">
                          {med.batchNo || 'N/A'}
                        </td>

                        {/* Quantity */}
                        <td className="px-3 py-3.5 text-center font-mono font-extrabold text-slate-900 text-sm">
                          {med.quantity} <span className="text-[10px] text-slate-500 font-normal">units</span>
                        </td>

                        {/* Expiry Date */}
                        <td className="px-3 py-3.5 font-mono font-bold text-rose-700">
                          {med.expiryDate}
                        </td>

                        {/* Days Expired */}
                        <td className="px-3 py-3.5">
                          <span className="inline-flex items-center gap-1 font-bold text-rose-700 text-xs font-mono">
                            <Clock className="w-3.5 h-3.5 text-rose-500" />
                            <span>{med.daysExpired} days ago</span>
                          </span>
                        </td>

                        {/* Disposal Status */}
                        <td className="px-3 py-3.5 text-center">
                          <StatusBadge status={med.disposalStatus} />
                        </td>

                        {/* Prominent Action Button */}
                        <td className="px-4 py-3.5 text-center">
                          <button
                            onClick={() => handleOpenDisposeModal(med)}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 hover:scale-[1.02] transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Dispose Medicine</span>
                          </button>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View */}
              <div className="block md:hidden divide-y divide-slate-100 p-3 space-y-3">
                {expiredMedicines.map((med) => (
                  <div 
                    key={med.id}
                    className="p-4 rounded-2xl bg-white border border-rose-200 space-y-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">{med.brandName}</h4>
                        <p className="text-xs text-slate-500 font-medium">{med.power} • Batch: <span className="font-mono text-slate-700 font-bold">{med.batchNo}</span></p>
                      </div>
                      <StatusBadge status={med.disposalStatus} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">EXPIRED QUANTITY</span>
                        <span className="text-sm font-bold text-slate-900 font-mono">{med.quantity} units</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-medium">DAYS EXPIRED</span>
                        <span className="text-xs font-bold text-rose-700 font-mono">{med.daysExpired} days ago</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-mono">
                        Exp: {med.expiryDate}
                      </span>
                      <button
                        onClick={() => handleOpenDisposeModal(med)}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Dispose Medicine</span>
                      </button>
                    </div>

                  </div>
                ))}
              </div>

            </div>
          )}

        </div>
      )}

      {/* 5. SECTION CONTENT: DISPOSAL HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          
          {/* History Search & Filter */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search disposal history by medicine, batch, facility..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{combinedDisposalHistory.length} statutory disposal records</span>
            </div>
          </div>

          {combinedDisposalHistory.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
              <Clock className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">
                No Disposal Records Found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                When expired medicines are disposed through this portal, their legal destruction records and certificates will appear here.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-4 py-3.5 text-left">Medicine / Formulation</th>
                      <th className="px-3 py-3.5 text-left">Batch</th>
                      <th className="px-3 py-3.5 text-center">Quantity</th>
                      <th className="px-3 py-3.5 text-left">Disposal Date & Time</th>
                      <th className="px-4 py-3.5 text-left">Disposal Centre</th>
                      <th className="px-3 py-3.5 text-center">Status</th>
                      <th className="px-4 py-3.5 text-center">Certificate</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {combinedDisposalHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        
                        {/* Medicine */}
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900 leading-tight">
                            {item.medicineName || item.brandName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {item.genericName || item.wasteCategory || 'Expired Pharmaceuticals'}
                          </div>
                        </td>

                        {/* Batch */}
                        <td className="px-3 py-3.5 font-mono font-bold text-slate-700">
                          {item.batchNo || 'N/A'}
                        </td>

                        {/* Quantity */}
                        <td className="px-3 py-3.5 text-center font-mono font-extrabold text-slate-900">
                          {item.quantity} {item.unit || 'units'}
                        </td>

                        {/* Disposal Date */}
                        <td className="px-3 py-3.5 font-mono text-slate-800 text-xs">
                          {item.disposalDate || item.createdDate || 'Recent'}
                        </td>

                        {/* Disposal Centre */}
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            <span>{item.bioCentreName || item.facilityName || 'GreenBio Medical Waste Centre'}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {item.treatmentMethod || 'High-Temperature Incineration (1100°C)'}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3.5 text-center">
                          <StatusBadge status={item.status || 'Disposed'} />
                        </td>

                        {/* Certificate */}
                        <td className="px-4 py-3.5 text-center">
                          <button
                            onClick={() => setSelectedDisposalForCert(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary-200 bg-primary-50/70 hover:bg-primary-100 text-primary-800 text-xs font-bold transition-all shadow-sm"
                          >
                            <FileCheck2 className="w-3.5 h-3.5 text-primary-600" />
                            <span>Certificate</span>
                          </button>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* 6. CONFIRMATION MODAL FOR "DISPOSE MEDICINE" */}
      <Modal
        isOpen={!!medicineToDispose}
        onClose={() => !isDisposing && setMedicineToDispose(null)}
        title="Confirm Bio-Waste Disposal"
        subtitle="Authorize the irreversible de-inventorying and statutory destruction of this expired batch."
        maxWidth="max-w-lg"
      >
        {medicineToDispose && (
          <div className="space-y-4 pt-1 text-xs">
            
            {/* Detailed Medicine Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Medicine Selected for Disposal
                  </span>
                  <h3 className="text-base font-black text-slate-900">
                    {medicineToDispose.brandName || medicineToDispose.medicineName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {medicineToDispose.genericName || medicineToDispose.power}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-rose-100 text-rose-800">
                  Expired {medicineToDispose.daysExpired}d ago
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/80 font-medium">
                <div>
                  <span className="text-[10px] text-slate-400 block">BATCH NUMBER</span>
                  <strong className="font-mono text-slate-800">{medicineToDispose.batchNo || 'N/A'}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">EXPIRY DATE</span>
                  <strong className="font-mono text-rose-700">{medicineToDispose.expiryDate}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">QUANTITY TO DISPOSE</span>
                  <strong className="font-mono text-slate-900 text-sm font-black">{medicineToDispose.quantity} units</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">DESIGNATED CENTRE</span>
                  <strong className="text-emerald-700">GreenBio Medical Waste Centre</strong>
                </div>
              </div>
            </div>

            {/* Clear Warning Notice */}
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Important Inventory & Statutory Effect:</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Confirming disposal will <strong>remove all {medicineToDispose.quantity} units from your hospital's usable inventory count</strong> and register a certified bio-waste destruction record at <strong>GreenBio Medical Waste Centre</strong> under CDSCO Rule 65 regulations.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setMedicineToDispose(null)}
                disabled={isDisposing}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              
              <button
                type="button"
                onClick={handleConfirmDisposal}
                disabled={isDisposing}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all disabled:opacity-50"
              >
                {isDisposing ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Processing Disposal...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Confirm Disposal</span>
                  </>
                )}
              </button>
            </div>

          </div>
        )}
      </Modal>

      {/* 7. DISPOSAL CERTIFICATE MODAL */}
      {selectedDisposalForCert && (
        <DisposalCertificateModal
          isOpen={!!selectedDisposalForCert}
          onClose={() => setSelectedDisposalForCert(null)}
          disposal={selectedDisposalForCert}
        />
      )}

    </div>
  );
};

export default HospitalWasteManagement;
