import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  FileText, 
  Edit3, 
  Save, 
  ShieldCheck, 
  MapPin, 
  Phone, 
  Mail, 
  Eye, 
  Download, 
  CheckCircle2, 
  Clock,
  Sparkles,
  Search,
  Ban,
  RotateCcw,
  Check,
  X,
  ArrowLeft,
  ShoppingBag,
  History,
  AlertTriangle,
  FileCheck2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { 
  fetchHospitals, 
  updateHospitalDetailsAction, 
  verifyHospitalAction,
  rejectHospitalAction,
  suspendHospitalAction, 
  reactivateHospitalAction
} from '../../store/slices/adminSlice';
import StatusBadge from '../../components/common/StatusBadge';
import DocumentViewerModal from '../../components/common/DocumentViewerModal';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getStoredItem, getHospitalDocumentChecklist, KEYS } from '../../services/storage';
import toast from 'react-hot-toast';

export const AdminHospitalDetails = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { hospitals, isLoading } = useSelector((state) => state.admin);
  const [searchParams] = useSearchParams();

  const [selectedHospId, setSelectedHospId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [viewerDoc, setViewerDoc] = useState(null);

  // Overall Hospital Application Status Modals
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');

  // Active view tab
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'documents' | 'orders' | 'activity'

  const [editFormData, setEditFormData] = useState({
    name: '',
    registrationNo: '',
    authorizedPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  useEffect(() => {
    dispatch(fetchHospitals());
  }, [dispatch]);

  useEffect(() => {
    if (hospitals.length === 0) return;
    const requestedHospitalId = searchParams.get('hospitalId');
    if (requestedHospitalId && hospitals.some((hospital) => hospital.id === requestedHospitalId)) {
      setSelectedHospId(requestedHospitalId);
    } else if (!selectedHospId) {
      setSelectedHospId(hospitals[0].id);
    }
  }, [hospitals, searchParams, selectedHospId]);

  const selectedHospital = hospitals.find((h) => h.id === selectedHospId) || hospitals[0];
  const filteredHospitals = hospitals.filter((hospital) =>
    hospital.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (selectedHospital) {
      setEditFormData({
        name: selectedHospital.name || '',
        registrationNo: selectedHospital.registrationNo || '',
        authorizedPerson: selectedHospital.authorizedPerson || '',
        email: selectedHospital.email || '',
        phone: selectedHospital.phone || '',
        address: selectedHospital.address || '',
        city: selectedHospital.city || '',
        state: selectedHospital.state || '',
        pincode: selectedHospital.pincode || '',
      });
      setIsEditing(false);
    }
  }, [selectedHospital]);

  // Order Summary from Storage
  const allRequests = getStoredItem(KEYS.REQUESTS, []);
  const hospitalOrders = allRequests.filter(
    (r) => r.fromHospitalId === selectedHospital?.id || r.toHospitalId === selectedHospital?.id
  );
  const orderStats = {
    total: hospitalOrders.length,
    pending: hospitalOrders.filter((r) => r.status === 'pending').length,
    processing: hospitalOrders.filter((r) => ['accepted', 'processing', 'dispatched', 'shipped'].includes(r.status)).length,
    completed: hospitalOrders.filter((r) => ['delivered', 'paid'].includes(r.status)).length,
  };

  // Recent Activity Ledger from Storage
  const allAuditLogs = getStoredItem(KEYS.AUDIT_TRAIL, []);
  const hospitalActivity = allAuditLogs.filter(
    (a) => a.hospitalId === selectedHospital?.id || a.entityId === selectedHospital?.id || a.summary?.includes(selectedHospital?.name) || a.description?.includes(selectedHospital?.name)
  );

  // Handlers
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updateHospitalDetailsAction({
        hospitalId: selectedHospital.id,
        data: editFormData
      })).unwrap();
      setIsEditing(false);
      toast.success(`Updated institutional profile for ${editFormData.name}`);
    } catch (err) {
      toast.error('Failed to update hospital details');
    }
  };

  const handleApprove = async () => {
    if (!selectedHospital) return;
    try {
      await dispatch(verifyHospitalAction(selectedHospital.id)).unwrap();
      toast.success(`${selectedHospital.name} verified and granted full MEDEX trading access`);
    } catch (err) {
      toast.error('Failed to approve hospital');
    }
  };

  const handleRejectConfirm = async (e) => {
    e.preventDefault();
    if (!selectedHospital || !rejectReason.trim()) return;
    try {
      await dispatch(rejectHospitalAction({
        hospitalId: selectedHospital.id,
        reason: rejectReason.trim()
      })).unwrap();
      toast.success(`Application rejected for ${selectedHospital.name}`);
      setShowRejectModal(false);
      setRejectReason('');
    } catch (err) {
      toast.error('Failed to record rejection');
    }
  };

  const handleSuspendConfirm = async (e) => {
    e.preventDefault();
    if (!selectedHospital || !suspensionReason.trim()) return;
    try {
      await dispatch(suspendHospitalAction({
        hospitalId: selectedHospital.id,
        reason: suspensionReason.trim()
      })).unwrap();
      toast.success(`${selectedHospital.name} has been suspended`);
      setShowSuspendModal(false);
      setSuspensionReason('');
    } catch (err) {
      toast.error('Failed to suspend hospital');
    }
  };

  const handleReactivate = async () => {
    if (!selectedHospital) return;
    try {
      await dispatch(reactivateHospitalAction(selectedHospital.id)).unwrap();
      toast.success(`${selectedHospital.name} trading privileges reactivated`);
    } catch (err) {
      toast.error('Failed to reactivate hospital');
    }
  };

  if (isLoading && hospitals.length === 0) {
    return <LoadingSpinner text="Fetching hospital registry dossiers..." />;
  }

  return (
    <div className="space-y-6">
      
      {/* Top Breadcrumb / Return Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <button
          onClick={() => navigate('/admin/hospitals')}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-sm transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
          <span>Back to Hospitals Directory</span>
        </button>

        {/* Hospital Registry Selector & Switcher */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search hospital..."
              className="w-full sm:w-48 pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
            />
          </div>
          <select
            value={selectedHospId}
            onChange={(e) => setSelectedHospId(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {filteredHospitals.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name} ({h.city})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedHospital && (
        <div className="space-y-6">

          {/* 1. INSTITUTIONAL STATUS BANNER & PRIMARY GOVERNANCE CONTROLS */}
          <div className={`p-5 rounded-2xl border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
            selectedHospital.status === 'verified'
              ? 'bg-emerald-50/50 border-emerald-200'
              : selectedHospital.status === 'suspended'
              ? 'bg-rose-50/60 border-rose-200'
              : selectedHospital.status === 'rejected'
              ? 'bg-red-50/60 border-red-200'
              : 'bg-amber-50/60 border-amber-200'
          }`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedHospital.status} />
                <span className="text-xs font-mono text-slate-500 font-semibold">
                  Registration ID: <span className="text-slate-800 font-bold">{selectedHospital.registrationNo}</span>
                </span>
                <span className="text-xs text-slate-400">• Registered: {selectedHospital.registeredDate}</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>{selectedHospital.name}</span>
              </h2>
              
              {/* Dynamic Status Context & Reasons */}
              {selectedHospital.status === 'verified' && (
                <p className="text-xs text-emerald-800 font-medium">
                  Hospital has passed all statutory accreditation checks (CDSCO Form 20B/21B). Full trading privileges and centralized inventory active.
                </p>
              )}
              {['pending', 'under_review', 'documents_missing'].includes(selectedHospital.status) && (
                <p className="text-xs text-amber-800 font-medium">
                  Institutional registration is currently under audit review. Operational access is restricted until regulatory approval.
                </p>
              )}
              {selectedHospital.status === 'suspended' && (
                <div className="text-xs text-rose-800 font-medium space-y-0.5">
                  <p>Trading and requisition privileges are suspended across the MEDEX network.</p>
                  {selectedHospital.suspensionReason && (
                    <p className="font-semibold bg-white/70 px-2.5 py-1 rounded-lg border border-rose-200 inline-block mt-1">
                      Reason: {selectedHospital.suspensionReason}
                    </p>
                  )}
                </div>
              )}
              {selectedHospital.status === 'rejected' && (
                <div className="text-xs text-red-800 font-medium space-y-0.5">
                  <p>Application was rejected by the MEDEX supervisory administration.</p>
                  {selectedHospital.rejectionReason && (
                    <p className="font-semibold bg-white/70 px-2.5 py-1 rounded-lg border border-red-200 inline-block mt-1">
                      Reason: {selectedHospital.rejectionReason}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Governance Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {['pending', 'under_review', 'documents_missing'].includes(selectedHospital.status) && (
                <>
                  <button
                    onClick={handleApprove}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve Hospital</span>
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all"
                  >
                    <X className="w-4 h-4" />
                    <span>Reject Hospital</span>
                  </button>
                </>
              )}

              {selectedHospital.status === 'verified' && (
                <button
                  onClick={() => setShowSuspendModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all"
                >
                  <Ban className="w-4 h-4" />
                  <span>Suspend Operations</span>
                </button>
              )}

              {selectedHospital.status === 'suspended' && (
                <button
                  onClick={handleReactivate}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reactivate Facility</span>
                </button>
              )}

              {selectedHospital.status === 'rejected' && (
                <button
                  onClick={handleApprove}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-sm transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Re-evaluate & Approve</span>
                </button>
              )}
            </div>
          </div>

          {/* 2. NAVIGATION TABS FOR DEEP INSPECTION */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            {[
              { key: 'overview', label: 'Institutional Profile' },
              { key: 'documents', label: `Documents (${selectedHospital.documents?.length || 0})` },
              { key: 'orders', label: `Orders (${orderStats.total})` },
              { key: 'activity', label: `Recent Activity (${hospitalActivity.length})` },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.key
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: INSTITUTIONAL PROFILE */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left 2 Cols: Details Form */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Institutional Registration Information</h3>
                      <p className="text-[11px] text-slate-400">Official medical council and drug licensing filings</p>
                    </div>
                  </div>

                  <div>
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-primary-600" />
                        <span>Edit Profile</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                <form onSubmit={handleSave} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Hospital Registered Name</label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={editFormData.name}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 disabled:bg-slate-50 disabled:text-slate-700 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">State Health Authority Reg Number</label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={editFormData.registrationNo}
                        onChange={(e) => setEditFormData({ ...editFormData, registrationNo: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 disabled:bg-slate-50 font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Authorized Pharmacist / Signatory</label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={editFormData.authorizedPerson}
                        onChange={(e) => setEditFormData({ ...editFormData, authorizedPerson: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 disabled:bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Official Email</label>
                      <input
                        type="email"
                        disabled={!isEditing}
                        value={editFormData.email}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 disabled:bg-slate-50 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={editFormData.phone}
                        onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 disabled:bg-slate-50 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">City / Region</label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={editFormData.city}
                        onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 disabled:bg-slate-50 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Street Address</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={editFormData.address}
                      onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 disabled:bg-slate-50"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">State</label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={editFormData.state}
                        onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 disabled:bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Pincode</label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={editFormData.pincode}
                        onChange={(e) => setEditFormData({ ...editFormData, pincode: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 disabled:bg-slate-50 font-mono"
                      />
                    </div>
                  </div>

                  {isEditing && (
                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-md"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save Changes</span>
                      </button>
                    </div>
                  )}
                </form>
              </div>

              {/* Right Column: Quick Dossier Snapshot */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Institutional Dossier</h4>
                  
                  <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Registration Date:</span>
                      <span className="font-mono font-bold text-slate-800">{selectedHospital.registeredDate || '2024-01-15'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Audit Status:</span>
                      <span className="font-bold text-emerald-700 capitalize">{selectedHospital.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Filings:</span>
                      <span className="font-mono font-bold text-slate-800">{selectedHospital.documents?.length || 0} Files</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Orders Placed:</span>
                      <span className="font-mono font-bold text-primary-700">{orderStats.total}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-primary-50/50 rounded-xl border border-primary-100 text-xs text-primary-900 leading-relaxed">
                    <div className="font-bold mb-1 flex items-center gap-1 text-primary-800">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Statutory Compliance Architecture</span>
                    </div>
                    Hospitals are bound by CDSCO rules. Invalidation of wholesale Form 20B automatically restricts inter-hospital redistribution.
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: HOSPITAL DOCUMENT REVIEW (SUPPORTING COMPLIANCE DOSSIER) */}
          {activeTab === 'documents' && (() => {
            const docChecklist = getHospitalDocumentChecklist(selectedHospital?.documents || []);
            return (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <FileCheck2 className="w-4 h-4 text-primary-600" />
                      <span>Statutory Supporting Documents Dossier</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Supporting compliance documents submitted by the hospital for institutional accreditation review.
                    </p>
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl">
                    {docChecklist.submittedCount} of {docChecklist.totalRequired} Mandatory Documents Submitted
                  </div>
                </div>

                {/* Dossier Completeness Banner */}
                {!docChecklist.isComplete ? (
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-amber-800">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Incomplete Supporting Dossier ({docChecklist.submittedCount} of {docChecklist.totalRequired} Mandatory Documents)</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      This hospital application is missing mandatory statutory filings. Review the missing documents below before making an institutional accreditation decision.
                    </p>
                    <div className="text-[11px] font-semibold text-amber-900 pt-0.5">
                      Missing document(s): {docChecklist.missingItems.map((m) => m.label).join(', ')}
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Complete Supporting Dossier ({docChecklist.submittedCount} of {docChecklist.totalRequired} Mandatory Documents)</span>
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      All 4 compulsory statutory compliance documents have been submitted and are available for supervisory audit review.
                    </p>
                  </div>
                )}

                {/* Document Cards Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {docChecklist.items.map((doc) => (
                    <div
                      key={doc.id}
                      className={`p-4 rounded-2xl border transition-all space-y-3 ${
                        doc.isSubmitted
                          ? 'bg-white border-slate-200 hover:border-primary-300 shadow-sm'
                          : 'bg-rose-50/30 border-rose-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5 min-w-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                            {doc.documentType} {doc.required && <span className="text-rose-500 font-bold">*Compulsory</span>}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 leading-tight">
                            {doc.label}
                          </h4>
                          {doc.isSubmitted ? (
                            <span className="text-[10px] text-slate-500 font-mono block truncate">
                              {doc.documentName} • {doc.size} • Uploaded: {doc.uploadedAt || selectedHospital.registeredDate || '2024-01-15'}
                            </span>
                          ) : (
                            <span className="text-[10px] text-rose-600 font-medium block">
                              Mandatory statutory document not provided by applicant
                            </span>
                          )}
                        </div>

                        {/* Status Badge: Submitted vs Missing */}
                        <div className="shrink-0">
                          {doc.isSubmitted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3" />
                              Submitted
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              <AlertCircle className="w-3 h-3" />
                              Missing
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Document Actions (Preview / Download) */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          {doc.isSubmitted ? (
                            <>
                              <button
                                onClick={() => setViewerDoc(doc)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary-50 text-primary-700 font-bold hover:bg-primary-100 transition-colors text-[11px]"
                              >
                                <Eye className="w-3 h-3" />
                                <span>View Document</span>
                              </button>
                              <button
                                onClick={() => toast.success(`Downloading ${doc.documentName || doc.name}`)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors text-[11px]"
                              >
                                <Download className="w-3 h-3" />
                                <span>Download</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] text-rose-600 italic font-medium">
                              Mandatory submission pending
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] text-slate-400 font-mono">
                          {doc.isSubmitted ? 'Supporting Filing' : 'Action Required'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            );
          })()}

          {/* TAB 3: ORDER SUMMARY & RECENT REQUISITIONS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              
              {/* Order Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Orders</span>
                  <div className="text-xl font-black text-slate-900 font-mono mt-1">{orderStats.total}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Pending Orders</span>
                  <div className="text-xl font-black text-amber-700 font-mono mt-1">{orderStats.pending}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">In Transit / Processing</span>
                  <div className="text-xl font-black text-blue-700 font-mono mt-1">{orderStats.processing}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Delivered / Completed</span>
                  <div className="text-xl font-black text-emerald-700 font-mono mt-1">{orderStats.completed}</div>
                </div>
              </div>

              {/* Order List Table */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900">Recent Medicine Requisitions & Shipments</h4>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-4 py-3">Order ID</th>
                        <th className="px-4 py-3">Medicine Formulation</th>
                        <th className="px-4 py-3">Trading Partner</th>
                        <th className="px-4 py-3">Quantity</th>
                        <th className="px-4 py-3">Total Value</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {hospitalOrders.length > 0 ? (
                        hospitalOrders.map((ord) => (
                          <tr key={ord.id} className="hover:bg-slate-50/70">
                            <td className="px-4 py-3 font-mono font-bold text-primary-800">{ord.id}</td>
                            <td className="px-4 py-3 font-bold text-slate-900">{ord.medicineName}</td>
                            <td className="px-4 py-3 text-slate-600">
                              {ord.fromHospitalId === selectedHospital.id ? `To: ${ord.toHospitalName}` : `From: ${ord.fromHospitalName}`}
                            </td>
                            <td className="px-4 py-3 font-mono">{ord.quantity} units</td>
                            <td className="px-4 py-3 font-mono font-bold text-slate-900">₹{ord.totalAmount?.toLocaleString('en-IN') || 0}</td>
                            <td className="px-4 py-3">
                              <StatusBadge status={ord.status} />
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="px-6 py-10 text-center text-slate-400 font-medium">
                            No orders recorded for this facility yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: RECENT ACTIVITY TIMELINE */}
          {activeTab === 'activity' && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
              <h4 className="text-xs font-bold text-slate-900 pb-2 border-b border-slate-100">
                Facility Regulatory & Operational Audit Log
              </h4>

              <div className="space-y-3">
                {hospitalActivity.length > 0 ? (
                  hospitalActivity.map((log, idx) => (
                    <div key={log.id || idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-primary-700">{log.action || 'EVENT'}</span>
                          <span className="text-[10px] text-slate-400">by {log.adminUser || log.user || 'System'}</span>
                        </div>
                        <p className="text-slate-800">{log.summary || log.description}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Recent'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-slate-400 text-xs font-medium">
                    No activity logs recorded for this facility node yet.
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* REJECT APPLICATION MODAL */}
      {showRejectModal && (
        <Modal
          isOpen={showRejectModal}
          onClose={() => { setShowRejectModal(false); setRejectReason(''); }}
          title={`Reject Application: ${selectedHospital?.name}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleRejectConfirm} className="space-y-4 pt-1">
            <p className="text-xs text-slate-600 leading-relaxed">
              Specify the compliance reason for rejecting this hospital registration. The reason will be communicated to the facility.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reason for Rejection <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows="3"
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Form 20B wholesale license expired; medical director seal missing..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setShowRejectModal(false); setRejectReason(''); }}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!rejectReason.trim()}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* SUSPEND HOSPITAL MODAL */}
      {showSuspendModal && (
        <Modal
          isOpen={showSuspendModal}
          onClose={() => { setShowSuspendModal(false); setSuspensionReason(''); }}
          title={`Suspend Operations: ${selectedHospital?.name}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSuspendConfirm} className="space-y-4 pt-1">
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800 leading-relaxed">
              Suspension immediately locks the facility's inventory listings, halts pending requisitions, and pauses marketplace access.
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Statutory Reason for Operational Suspension <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows="3"
                required
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                placeholder="e.g. Cold-chain failure reported; regulatory compliance audit pending..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setShowSuspendModal(false); setSuspensionReason(''); }}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!suspensionReason.trim()}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl disabled:opacity-50"
              >
                Confirm Suspension
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* DOCUMENT VIEWER MODAL */}
      {viewerDoc && (
        <DocumentViewerModal
          isOpen={!!viewerDoc}
          onClose={() => setViewerDoc(null)}
          document={viewerDoc}
          hospitalName={selectedHospital?.name}
        />
      )}

    </div>
  );
};

export default AdminHospitalDetails;

