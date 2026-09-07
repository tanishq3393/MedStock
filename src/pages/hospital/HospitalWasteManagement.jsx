import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { 
  Flame, 
  Trash2, 
  ShieldCheck, 
  PlusCircle, 
  FileCheck2, 
  Truck, 
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
  PackageCheck
} from 'lucide-react';
import { fetchHospitalDisposals, createHospitalWasteRequest } from '../../store/slices/hospitalSlice';
import DisposalCertificateModal from '../../components/common/DisposalCertificateModal';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { adminService } from '../../services/adminService';
import toast from 'react-hot-toast';

// 6-step simple statutory disposal process
const PROCESS_STEPS = [
  { step: 1, key: 'reported', label: 'Request', desc: 'Logged by hospital' },
  { step: 2, key: 'assigned', label: 'Assigned', desc: 'Bio-centre designated' },
  { step: 3, key: 'pickup_scheduled', label: 'Pickup', desc: 'Vehicle scheduled' },
  { step: 4, key: 'in_transit', label: 'Collected', desc: 'In transit to facility' },
  { step: 5, key: 'incinerated', label: 'Disposal', desc: 'Thermal destruction' },
  { step: 6, key: 'certified', label: 'Certificate', desc: 'Form-IV certificate issued' }
];

export const HospitalWasteManagement = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const { user } = useSelector((state) => state.auth);
  const { disposals = [], isLoading } = useSelector((state) => state.hospital);

  const [activeTab, setActiveTab] = useState('all');
  const [selectedDisposalForCert, setSelectedDisposalForCert] = useState(null);
  const [selectedDisposalForDetails, setSelectedDisposalForDetails] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form State with beginner-friendly defaults
  const [formData, setFormData] = useState({
    medicineName: '',
    category: 'Expired Pharmaceuticals (Yellow Bag)',
    quantity: '',
    batchNo: '',
    expiryDate: '',
    reason: 'Expired beyond statutory shelf life',
    preferredPickupDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    instructions: ''
  });

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchHospitalDisposals(user.id));
    }
  }, [dispatch, user?.id]);

  // Handle URL prefill params (e.g. from Inventory "Dispose")
  useEffect(() => {
    const prefillName = searchParams.get('name');
    const prefillBatch = searchParams.get('batch');
    const prefillQty = searchParams.get('qty');

    if (prefillName || prefillBatch) {
      setFormData((prev) => ({
        ...prev,
        medicineName: prefillName || prev.medicineName,
        batchNo: prefillBatch || prev.batchNo,
        quantity: prefillQty || prev.quantity,
      }));
      setIsCreateModalOpen(true);
    }
  }, [searchParams]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateManifest = async (e) => {
    e.preventDefault();
    if (!formData.medicineName || !formData.batchNo || !formData.quantity) {
      toast.error('Please enter the medicine name, batch number, and quantity');
      return;
    }

    try {
      const payload = {
        hospitalId: user?.id,
        hospitalName: user?.name || 'Hospital Pharmacy',
        medicineName: formData.medicineName,
        batchNo: formData.batchNo,
        quantity: Number(formData.quantity),
        unit: 'units',
        category: formData.category,
        reason: formData.reason,
        facilityName: 'Maharashtra Enviro Power Bio-Medical Waste Plant, Taloja',
        treatmentMethod: 'High-Temperature Thermal Incineration (1100°C)',
        preferredPickupDate: formData.preferredPickupDate,
        notes: formData.instructions
      };

      await dispatch(createHospitalWasteRequest(payload)).unwrap();
      toast.success('Disposal request registered successfully');
      setIsCreateModalOpen(false);
      setFormData({
        medicineName: '',
        category: 'Expired Pharmaceuticals (Yellow Bag)',
        quantity: '',
        batchNo: '',
        expiryDate: '',
        reason: 'Expired beyond statutory shelf life',
        preferredPickupDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
        instructions: ''
      });
      if (user?.id) {
        dispatch(fetchHospitalDisposals(user.id));
      }
    } catch (err) {
      toast.error('Failed to create disposal request: ' + err.message);
    }
  };

  // Demo simulator helper to advance stage
  const handleAdvanceStage = async (disposal, e) => {
    e.stopPropagation();
    const stageMap = ['reported', 'pickup_scheduled', 'in_transit', 'quarantine', 'incinerated', 'certified'];
    let currentIdx = stageMap.indexOf(disposal.status?.toLowerCase());
    if (currentIdx === -1) {
      if (disposal.status?.toLowerCase().includes('pickup')) currentIdx = 1;
      else if (disposal.status?.toLowerCase().includes('transit')) currentIdx = 2;
      else if (disposal.status?.toLowerCase().includes('incinerat') || disposal.status?.toLowerCase().includes('cert')) currentIdx = 5;
      else currentIdx = 0;
    }

    if (currentIdx < stageMap.length - 1) {
      const nextStage = stageMap[currentIdx + 1];
      await adminService.updateBioWasteStatus(
        disposal.id,
        nextStage,
        nextStage === 'certified' ? `BMW-INC-2024-${Math.floor(10000 + Math.random() * 90000)}` : null
      );
      toast.success(`Demo Simulator: Request ${disposal.id} moved to next step`);
      if (user?.id) {
        dispatch(fetchHospitalDisposals(user.id));
      }
      if (selectedDisposalForDetails?.id === disposal.id) {
        setSelectedDisposalForDetails((prev) => ({ ...prev, status: nextStage }));
      }
    }
  };

  // Categorize helper for the 4 summary metrics
  const summaryMetrics = useMemo(() => {
    let pending = 0;
    let scheduled = 0;
    let underDisposal = 0;
    let completed = 0;

    disposals.forEach((d) => {
      const s = (d.status || '').toLowerCase();
      if (s === 'reported' || s === 'pending') {
        pending++;
      } else if (s.includes('pickup') || s === 'pickup_scheduled') {
        scheduled++;
      } else if (s.includes('transit') || s === 'quarantine' || s === 'in_transit') {
        underDisposal++;
      } else if (s.includes('cert') || s.includes('incinerat')) {
        completed++;
      } else {
        pending++;
      }
    });

    return { pending, scheduled, underDisposal, completed };
  }, [disposals]);

  // Filtered requests
  const filteredDisposals = useMemo(() => {
    return disposals.filter((item) => {
      const s = (item.status || '').toLowerCase();
      if (activeTab === 'all') return true;
      if (activeTab === 'pending') return s === 'reported' || s === 'pending';
      if (activeTab === 'scheduled') return s.includes('pickup');
      if (activeTab === 'in_transit') return s.includes('transit') || s === 'quarantine';
      if (activeTab === 'completed') return s.includes('cert') || s.includes('incinerat');
      return true;
    });
  }, [disposals, activeTab]);

  const getStepProgressIndex = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('cert') || s.includes('incinerat')) return 5;
    if (s.includes('transit') || s.includes('quarantine')) return 3;
    if (s.includes('pickup')) return 2;
    if (s.includes('assigned')) return 1;
    return 0; // reported / pending
  };

  return (
    <div className="space-y-7 pb-10">
      
      {/* 1. Header (WHERE AM I? + WHAT CAN I DO NEXT?) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Waste Disposal
            </h1>
            <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Biomedical waste management
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Safely manage expired or unusable medicines and track their disposal.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-md shadow-primary-600/20 transition-all hover:scale-[1.02] flex-shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Create Disposal Request</span>
        </button>
      </div>

      {/* 2. EXPLAIN THE PROCESS VISUALLY (6-Step Visual Workflow) */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
            How Disposal Works (6-Step Safe Process)
          </span>
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            Compliant with State Pollution Control Board & CPCB Form-IV
          </span>
        </div>

        {/* Stepper bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
          {PROCESS_STEPS.map((step) => (
            <div 
              key={step.step}
              className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-1"
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-mono">
                  {step.step}
                </span>
                <span className="text-[10px] uppercase font-mono text-slate-400">Step {step.step}</span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">{step.label}</h4>
                <p className="text-[10px] text-slate-500 leading-snug">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. WASTE SUMMARY (4 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Pending Requests
          </span>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {summaryMetrics.pending}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Awaiting bio-centre assignment
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-200/80 bg-blue-50/20 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 block">
            Pickup Scheduled
          </span>
          <div className="text-2xl font-black text-blue-700 font-mono">
            {summaryMetrics.scheduled}
          </div>
          <p className="text-[11px] text-blue-600 font-medium">
            Authorized vehicle dispatched
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200/90 bg-amber-50/25 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block">
            Under Disposal
          </span>
          <div className="text-2xl font-black text-amber-700 font-mono">
            {summaryMetrics.underDisposal}
          </div>
          <p className="text-[11px] text-amber-700 font-medium">
            In transit or high-temp destruction
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
            Completed
          </span>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            {summaryMetrics.completed}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium">
            Certified & destroyed with Form-IV
          </p>
        </div>

      </div>

      {/* 4. Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { key: 'all', label: 'All Requests' },
            { key: 'pending', label: 'Pending' },
            { key: 'scheduled', label: 'Pickup Scheduled' },
            { key: 'in_transit', label: 'In Transit' },
            { key: 'completed', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.key
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400 font-medium">
          Showing {filteredDisposals.length} disposal requests
        </span>
      </div>

      {/* 5. WASTE REQUEST CARDS (Status is the most prominent element) */}
      {isLoading && disposals.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
          <LoadingSpinner text="Loading waste disposal records..." />
        </div>
      ) : filteredDisposals.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
          <Trash2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            No disposal requests.
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Expired or unusable medicines can be sent for safe disposal.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Disposal Request</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDisposals.map((item) => {
            const stepIdx = getStepProgressIndex(item.status);
            const isCompleted = stepIdx >= 4;

            return (
              <div
                key={item.id}
                onClick={() => setSelectedDisposalForDetails(item)}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 space-y-4 hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
              >
                {/* Card Top: Medicine + PROMINENT STATUS */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                      {item.medicineName}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {item.quantity} units • Batch: <span className="font-mono text-slate-700 font-bold">{item.batchNo || 'N/A'}</span>
                    </p>
                  </div>

                  {/* Most Visually Prominent Element: Status */}
                  <div className="text-right">
                    <StatusBadge status={item.status || 'Reported'} className="text-xs font-extrabold px-3 py-1.5" />
                  </div>
                </div>

                {/* Mini Visual Step Progress Indicator */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Process Status</span>
                    <span className="font-bold text-slate-700">
                      Step {stepIdx + 1} of 6: {PROCESS_STEPS[stepIdx]?.label || 'Logged'}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        isCompleted ? 'bg-emerald-500' : 'bg-primary-600'
                      }`}
                      style={{ width: `${((stepIdx + 1) / 6) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Key Logistics Meta */}
                <div className="grid grid-cols-2 gap-2 text-xs p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">PICKUP DATE</span>
                    <strong className="text-slate-800 font-mono">
                      {item.pickupDate || item.preferredPickupDate || 'Scheduled on dispatch'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">AUTHORIZED BIO CENTRE</span>
                    <strong className="text-slate-800 line-clamp-1">
                      {item.bioCentreName || item.facilityName || 'Enviro Power CBMWTF Facility'}
                    </strong>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDisposalForDetails(item);
                      }}
                      className="text-xs font-bold text-primary-600 hover:text-primary-700"
                    >
                      View Details
                    </button>

                    {/* Demo Stage Advance Simulator */}
                    {stepIdx < 5 && (
                      <button
                        onClick={(e) => handleAdvanceStage(item, e)}
                        title="Simulate advancing manifest through environmental logistics"
                        className="text-[10px] font-mono font-bold text-slate-500 hover:text-slate-800 px-2 py-0.5 rounded-lg border border-dashed border-slate-300 hover:bg-slate-50 flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>Advance Step (Demo)</span>
                      </button>
                    )}
                  </div>

                  {item.certificateNo && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDisposalForCert(item);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>View Certificate</span>
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* 6. CREATE DISPOSAL REQUEST MODAL (Beginner-Friendly Grouped Fields) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
            
            {/* Header */}
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">Create Disposal Request</h3>
                <p className="text-xs text-slate-500 font-medium">Safe disposal manifest for expired medicines</p>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateManifest} className="p-6 space-y-5 text-xs">
              
              {/* GROUP 1: WHAT ARE YOU DISPOSING? */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                  1. What are you disposing?
                </span>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Medicine / Waste Name *</label>
                  <input
                    type="text"
                    name="medicineName"
                    required
                    placeholder="e.g. Amoxicillin 500mg or Expired Paracetamol"
                    value={formData.medicineName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Quantity (Units) *</label>
                    <input
                      type="number"
                      name="quantity"
                      required
                      placeholder="e.g. 120"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium font-mono"
                    />
                    <span className="text-[10px] text-slate-400">Enter the number of units to be disposed.</span>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Batch Number *</label>
                    <input
                      type="text"
                      name="batchNo"
                      required
                      placeholder="e.g. AMX-2312"
                      value={formData.batchNo}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Waste Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="Expired Pharmaceuticals (Yellow Bag)">Expired Pharmaceuticals (Yellow Bag)</option>
                    <option value="Cytotoxic & Oncology Waste (Hazardous)">Cytotoxic & Oncology Waste (Hazardous)</option>
                    <option value="Cold-Chain Breach / Biologicals">Cold-Chain Breach / Biologicals</option>
                    <option value="Controlled Anesthetics & Sedatives">Controlled Anesthetics & Sedatives</option>
                    <option value="Contaminated Consumables">Contaminated Consumables</option>
                  </select>
                </div>
              </div>

              {/* GROUP 2: WHY? */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                  2. Why?
                </span>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Reason for Disposal</label>
                  <input
                    type="text"
                    name="reason"
                    placeholder="e.g. Expired beyond statutory shelf life"
                    value={formData.reason}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium"
                  />
                </div>
              </div>

              {/* GROUP 3: PICKUP */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                  3. Pickup Details
                </span>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Preferred Pickup Date</label>
                  <input
                    type="date"
                    name="preferredPickupDate"
                    value={formData.preferredPickupDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Additional Instructions (Optional)</label>
                  <input
                    type="text"
                    name="instructions"
                    placeholder="e.g. Stored in Basement Holding Bay Room B2"
                    value={formData.instructions}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold shadow-md shadow-primary-600/20"
                >
                  Submit Disposal Request
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 7. WASTE DETAILS MODAL / DRAWER (Clear Vertical Timeline) */}
      {selectedDisposalForDetails && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="absolute inset-0" onClick={() => setSelectedDisposalForDetails(null)} />
          
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto z-10 animate-slideLeft">
            
            {/* Top */}
            <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50 sticky top-0 z-10">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Disposal Requisition #{selectedDisposalForDetails.id}
                </span>
                <h2 className="text-xl font-black text-slate-900 leading-tight">
                  {selectedDisposalForDetails.medicineName}
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {selectedDisposalForDetails.quantity} units • Batch: {selectedDisposalForDetails.batchNo || 'N/A'}
                </p>
              </div>

              <button
                onClick={() => setSelectedDisposalForDetails(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content: Timeline */}
            <div className="p-6 space-y-6 flex-1 text-xs">
              
              {/* Prominent Status Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Current Status</span>
                  <div className="mt-1">
                    <StatusBadge status={selectedDisposalForDetails.status || 'Reported'} className="text-xs font-bold" />
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Waste Manifest</span>
                  <span className="text-xs font-mono font-bold text-slate-800">
                    {selectedDisposalForDetails.manifestNumber || `MPCB-BMW-${selectedDisposalForDetails.id}`}
                  </span>
                </div>
              </div>

              {/* VERTICAL TIMELINE */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Disposal Progress Timeline
                </h3>

                <div className="space-y-4 pt-1">
                  {[
                    {
                      title: 'REQUEST CREATED',
                      time: selectedDisposalForDetails.reportedDate || selectedDisposalForDetails.date || 'Today, 09:20 AM',
                      detail: `Reported by ${selectedDisposalForDetails.hospitalName || 'Hospital Pharmacy'}`,
                      completed: true,
                    },
                    {
                      title: 'BIO CENTRE ASSIGNED',
                      time: 'Today, 11:00 AM',
                      detail: selectedDisposalForDetails.bioCentreName || selectedDisposalForDetails.facilityName || 'Enviro-Clean CBMWTF',
                      completed: getStepProgressIndex(selectedDisposalForDetails.status) >= 1,
                    },
                    {
                      title: 'PICKUP SCHEDULED',
                      time: selectedDisposalForDetails.pickupDate || selectedDisposalForDetails.preferredPickupDate || 'Scheduled',
                      detail: selectedDisposalForDetails.vehicleNo ? `Vehicle: ${selectedDisposalForDetails.vehicleNo}` : 'Authorized CPCB Vehicle assigned',
                      completed: getStepProgressIndex(selectedDisposalForDetails.status) >= 2,
                    },
                    {
                      title: 'COLLECTED',
                      time: getStepProgressIndex(selectedDisposalForDetails.status) >= 3 ? 'Completed' : 'Pending',
                      detail: 'Barcoded tamper-evident bio-hazard container sealed',
                      completed: getStepProgressIndex(selectedDisposalForDetails.status) >= 3,
                    },
                    {
                      title: 'DISPOSAL (INCINERATION)',
                      time: getStepProgressIndex(selectedDisposalForDetails.status) >= 4 ? 'Completed' : 'Pending',
                      detail: selectedDisposalForDetails.treatmentMethod || 'High-Temperature Thermal Destruction (1100°C)',
                      completed: getStepProgressIndex(selectedDisposalForDetails.status) >= 4,
                    },
                    {
                      title: 'CERTIFICATE ISSUED',
                      time: selectedDisposalForDetails.certificateNo ? selectedDisposalForDetails.certificateDate || 'Completed' : 'Pending',
                      detail: selectedDisposalForDetails.certificateNo ? `Form-IV Certificate: ${selectedDisposalForDetails.certificateNo}` : 'Awaiting final thermal destruction completion',
                      completed: !!selectedDisposalForDetails.certificateNo,
                    },
                  ].map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3 relative">
                      {idx !== 5 && (
                        <div className={`absolute left-3 top-5 w-0.5 h-8 ${
                          step.completed ? 'bg-emerald-500' : 'bg-slate-200'
                        }`} />
                      )}
                      
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white flex-shrink-0 z-10 ${
                        step.completed ? 'bg-emerald-600 ring-2 ring-emerald-100' : 'bg-slate-200 text-slate-400'
                      }`}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className={`font-bold ${step.completed ? 'text-slate-900' : 'text-slate-400'}`}>
                            {step.title}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">{step.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{step.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="p-5 border-t border-slate-200 bg-white sticky bottom-0">
              {selectedDisposalForDetails.certificateNo ? (
                <button
                  onClick={() => {
                    const item = selectedDisposalForDetails;
                    setSelectedDisposalForDetails(null);
                    setSelectedDisposalForCert(item);
                  }}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span>View Form-IV Destruction Certificate</span>
                </button>
              ) : (
                <div className="flex items-center justify-between text-xs text-slate-500 p-2 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>Destruction Certificate generates automatically upon completed incineration.</span>
                  </span>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* 8. FORM-IV DESTRUCTION CERTIFICATE MODAL */}
      <DisposalCertificateModal
        isOpen={!!selectedDisposalForCert}
        onClose={() => setSelectedDisposalForCert(null)}
        disposal={selectedDisposalForCert}
      />

    </div>
  );
};

export default HospitalWasteManagement;
