import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Search, 
  Filter, 
  ArrowUpDown, 
  FileCheck2, 
  Check, 
  X, 
  Eye, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  AlertTriangle, 
  RotateCcw, 
  Ban, 
  ExternalLink,
  Layers,
  ShoppingBag,
  Clock,
  LayoutGrid,
  List,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { 
  fetchHospitals, 
  verifyHospitalAction, 
  rejectHospitalAction, 
  suspendHospitalAction, 
  reactivateHospitalAction,
  setReviewStatusAction,
  updateHospitalDetailsAction
} from '../../store/slices/adminSlice';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import DocumentViewerModal from '../../components/common/DocumentViewerModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getStoredItem, KEYS } from '../../services/storage';
import toast from 'react-hot-toast';

export const AdminHospitals = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { hospitals, isLoading } = useSelector((state) => state.admin);
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters & Sorting State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'

  // Modals & Drawers
  const [selectedHospitalForDetails, setSelectedHospitalForDetails] = useState(null);
  const [reviewApplicationTarget, setReviewApplicationTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [reviewStageChoice, setReviewStageChoice] = useState('verified');
  const [reviewAuditorNote, setReviewAuditorNote] = useState('');
  const [suspendModalTarget, setSuspendModalTarget] = useState(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [inspectDoc, setInspectDoc] = useState(null);

  // Deep detail tabs
  const [detailsTab, setDetailsTab] = useState('info'); // 'info' | 'orders' | 'inventory' | 'activity'

  useEffect(() => {
    dispatch(fetchHospitals());
  }, [dispatch]);

  // Synchronize statusFilter if query param present
  useEffect(() => {
    const qStatus = searchParams.get('status');
    if (qStatus) {
      setStatusFilter(qStatus);
    }
  }, [searchParams]);

  // Calculate orders per hospital from storage
  const requests = getStoredItem(KEYS.REQUESTS, []);
  const medicines = getStoredItem(KEYS.MEDICINES, []);
  const auditLogs = getStoredItem(KEYS.AUDIT_TRAIL, []);

  const getHospitalOrderCount = (hospitalId) => {
    return requests.filter((r) => r.fromHospitalId === hospitalId || r.toHospitalId === hospitalId).length;
  };

  // Filter & Sort Logic
  const filteredHospitals = hospitals.filter((hosp) => {
    const matchesSearch = 
      hosp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hosp.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (hosp.registrationNo && hosp.registrationNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (hosp.email && hosp.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (hosp.phone && hosp.phone.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = 
      statusFilter === 'all' ? true : hosp.status?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
    if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
    if (sortBy === 'orders-desc') return getHospitalOrderCount(b.id) - getHospitalOrderCount(a.id);
    if (sortBy === 'date-desc') return new Date(b.registeredDate || '2024-01-01') - new Date(a.registeredDate || '2024-01-01');
    if (sortBy === 'date-asc') return new Date(a.registeredDate || '2024-01-01') - new Date(b.registeredDate || '2024-01-01');
    return 0;
  });

  // Action Handlers
  const handleApproveHospital = async (hospitalId) => {
    try {
      await dispatch(verifyHospitalAction(hospitalId)).unwrap();
      toast.success('Hospital verified and trading credentials activated');
      if (reviewApplicationTarget?.id === hospitalId) setReviewApplicationTarget(null);
      if (selectedHospitalForDetails?.id === hospitalId) {
        setSelectedHospitalForDetails((prev) => ({ ...prev, status: 'verified' }));
      }
    } catch (err) {
      toast.error('Failed to verify hospital');
    }
  };

  const handleRejectHospital = async (e) => {
    e.preventDefault();
    if (!reviewApplicationTarget) return;
    try {
      await dispatch(rejectHospitalAction({
        hospitalId: reviewApplicationTarget.id,
        reason: rejectReason || 'Documentation audit incomplete or non-compliant.',
      })).unwrap();
      toast.success(`Application rejected for ${reviewApplicationTarget.name}`);
      setReviewApplicationTarget(null);
      setRejectReason('');
    } catch (err) {
      toast.error('Failed to record rejection');
    }
  };

  const handleSuspendHospital = async (e) => {
    e.preventDefault();
    if (!suspendModalTarget || !suspensionReason.trim()) return;
    try {
      await dispatch(suspendHospitalAction({
        hospitalId: suspendModalTarget.id,
        reason: suspensionReason,
      })).unwrap();
      toast.success(`Suspended trading privileges for ${suspendModalTarget.name}`);
      setSuspendModalTarget(null);
      setSuspensionReason('');
      if (selectedHospitalForDetails?.id === suspendModalTarget.id) {
        setSelectedHospitalForDetails((prev) => ({ ...prev, status: 'suspended', suspensionReason }));
      }
    } catch (err) {
      toast.error('Failed to suspend hospital');
    }
  };

  const handleReactivateHospital = async (hospitalId) => {
    try {
      await dispatch(reactivateHospitalAction(hospitalId)).unwrap();
      toast.success('Hospital operational status reactivated');
      if (selectedHospitalForDetails?.id === hospitalId) {
        setSelectedHospitalForDetails((prev) => ({ ...prev, status: 'verified' }));
      }
    } catch (err) {
      toast.error('Failed to reactivate hospital');
    }
  };

  const counts = {
    all: hospitals.length,
    verified: hospitals.filter((h) => h.status === 'verified').length,
    pending: hospitals.filter((h) => ['pending', 'under_review', 'documents_missing'].includes(h.status)).length,
    rejected: hospitals.filter((h) => h.status === 'rejected').length,
    suspended: hospitals.filter((h) => h.status === 'suspended').length,
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
              CDSCO Form 20B/21B Statutory Registry
            </span>
            <span className="text-xs text-slate-400 font-mono">Institutional B2B Nodes</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Hospital & Facility Management</h1>
          <p className="text-xs text-slate-300 max-w-xl font-normal">
            Primary participants across the MEDEX network. Review accreditation files, grant redistribution rights, track activity, and enforce operational compliance.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md text-right">
            <div className="text-[10px] uppercase font-bold text-cyan-300 tracking-wider">Awaiting Audit</div>
            <div className="text-lg font-black text-white font-mono flex items-center justify-end gap-1.5">
              <span>{counts.pending} Institutions</span>
              {counts.pending > 0 && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
            </div>
          </div>
        </div>
      </div>

      {/* Filter, Search & View Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { key: 'all', label: `All (${counts.all})` },
              { key: 'verified', label: `Verified (${counts.verified})`, badgeColor: 'bg-emerald-500' },
              { key: 'pending', label: `Pending (${counts.pending})`, badgeColor: 'bg-amber-500' },
              { key: 'rejected', label: `Rejected (${counts.rejected})` },
              { key: 'suspended', label: `Suspended (${counts.suspended})` },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  statusFilter === tab.key
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search & Sorting bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by hospital, city, reg ID, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>Sort:</span>
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="date-desc">Newest Registered</option>
                <option value="date-asc">Oldest Registered</option>
                <option value="name-asc">Hospital Name (A-Z)</option>
                <option value="name-desc">Hospital Name (Z-A)</option>
                <option value="orders-desc">Most Orders</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'table' ? 'bg-white shadow text-primary-700' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'cards' ? 'bg-white shadow text-primary-700' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* MAIN VIEW: TABLE OR CARDS */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden w-full">
          <div className="w-full">
            <table className="w-full divide-y divide-slate-200/80 text-xs table-fixed">
              <colgroup>
                <col style={{ width: '25%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '6%' }} />
                <col style={{ width: '8%' }} />
              </colgroup>
              <thead className="bg-slate-50/90 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3 text-left">Hospital Facility</th>
                  <th className="py-3 px-2 text-left">Location</th>
                  <th className="py-3 px-2 text-left">Reg ID</th>
                  <th className="py-3 px-2 text-left">Contact / Email</th>
                  <th className="py-3 px-2 text-left">Registered</th>
                  <th className="py-3 px-2 text-center">Status</th>
                  <th className="py-3 px-1.5 text-center">Orders</th>
                  <th className="py-3 px-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredHospitals.length > 0 ? (
                  filteredHospitals.map((hosp) => {
                    const orderCount = getHospitalOrderCount(hosp.id);
                    const isPending = ['pending', 'under_review', 'documents_missing'].includes(hosp.status);

                    return (
                      <tr key={hosp.id} className="hover:bg-teal-50/20 transition-colors group">
                        
                        {/* Hospital Name */}
                        <td className="py-3 px-3 overflow-hidden">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-primary-50 border border-primary-100 text-primary-700 flex items-center justify-center font-bold shrink-0">
                              <Building2 className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors block truncate text-xs" title={hosp.name}>
                                {hosp.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-normal truncate block" title={hosp.authorizedPerson}>
                                Admin: {hosp.authorizedPerson || 'Medical Director'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="py-3 px-2 overflow-hidden">
                          <div className="flex items-center gap-1 font-semibold text-slate-800 text-[11px] truncate" title={`${hosp.city}, ${hosp.state || 'India'}`}>
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{hosp.city}, {hosp.state || 'India'}</span>
                          </div>
                        </td>

                        {/* Registration ID */}
                        <td className="py-3 px-2 overflow-hidden">
                          <span className="font-mono font-bold text-primary-800 text-[10px] bg-primary-50 px-1.5 py-0.5 rounded border border-primary-200/60 truncate inline-block max-w-full" title={hosp.registrationNo}>
                            {hosp.registrationNo || 'REG-PENDING'}
                          </span>
                        </td>

                        {/* Contact & Email */}
                        <td className="py-3 px-2 overflow-hidden">
                          <div className="text-[11px] font-mono text-slate-800 truncate" title={hosp.phone}>{hosp.phone || '+91 98200 12345'}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-full" title={hosp.email}>{hosp.email}</div>
                        </td>

                        {/* Reg Date */}
                        <td className="py-3 px-2 font-mono text-slate-500 text-[11px] truncate overflow-hidden">
                          {hosp.registeredDate || '2024-08-15'}
                        </td>

                        {/* Verification Status */}
                        <td className="py-3 px-2 text-center overflow-hidden">
                          <div className="flex justify-center">
                            <StatusBadge status={hosp.status} className="!text-[10px] !px-2 !py-0.5 whitespace-nowrap" />
                          </div>
                        </td>

                        {/* Number of Orders */}
                        <td className="py-3 px-1.5 text-center font-mono font-black text-slate-900 text-xs overflow-hidden">
                          {orderCount}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-2 text-center overflow-hidden">
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() => navigate(`/admin/hospital-details?hospitalId=${hosp.id}`)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-700 font-bold text-[10px] border border-primary-200 shadow-sm transition-all"
                            >
                              <Eye className="w-3 h-3" />
                              <span>{isPending ? 'Review' : 'View'}</span>
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-14 text-center text-slate-400">
                      <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="font-bold text-slate-700">No hospitals match your search or filter</p>
                      <p className="text-xs text-slate-400 mt-1">Try selecting a different status tab or clearing your search term.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARD GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredHospitals.map((hosp) => {
            const orderCount = getHospitalOrderCount(hosp.id);
            const isPending = ['pending', 'under_review', 'documents_missing'].includes(hosp.status);

            return (
              <div
                key={hosp.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4 hover:shadow-card-hover transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 text-primary-700 flex items-center justify-center font-bold">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 leading-tight">{hosp.name}</h3>
                        <p className="text-[11px] text-slate-400">{hosp.city}, {hosp.state || 'India'}</p>
                      </div>
                    </div>
                    <StatusBadge status={hosp.status} />
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Reg ID:</span>
                      <span className="font-mono font-bold text-slate-800">{hosp.registrationNo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Administrator:</span>
                      <span className="font-semibold text-slate-700 truncate max-w-[140px]">{hosp.authorizedPerson}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Orders Count:</span>
                      <span className="font-mono font-bold text-primary-700">{orderCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Contact:</span>
                      <span className="font-mono text-slate-600">{hosp.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400 font-mono">Reg: {hosp.registeredDate}</span>
                  <button
                    onClick={() => navigate(`/admin/hospital-details?hospitalId=${hosp.id}`)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-sm transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isPending ? 'Review Application' : 'View Details'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* REVIEW PENDING APPLICATION MODAL */}
      {reviewApplicationTarget && (
        <Modal
          isOpen={!!reviewApplicationTarget}
          onClose={() => setReviewApplicationTarget(null)}
          title="Review Institutional Application"
          subtitle={`Compliance audit for ${reviewApplicationTarget.name}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 pt-1">
            
            {/* Hospital Overview Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-bold text-sm text-slate-900">{reviewApplicationTarget.name}</div>
                <StatusBadge status={reviewApplicationTarget.status} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>Reg No: <span className="font-mono font-bold text-slate-900">{reviewApplicationTarget.registrationNo}</span></div>
                <div>Signatory: <span className="font-bold text-slate-900">{reviewApplicationTarget.authorizedPerson}</span></div>
                <div>Location: <span className="text-slate-900">{reviewApplicationTarget.address}, {reviewApplicationTarget.city}</span></div>
                <div>Official Email: <span className="font-mono text-slate-900">{reviewApplicationTarget.email}</span></div>
              </div>
            </div>

            {/* Legal Documents Attached */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-primary-600" />
                <span>Statutory Accreditation Filings (Form 20B/21B, Pharmacy Establishment)</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(reviewApplicationTarget.documents || []).map((doc, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-slate-800">{doc.type || doc.name}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{doc.size}</span>
                    </div>
                    <button
                      onClick={() => setInspectDoc(doc)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-600 hover:text-primary-800 bg-primary-50 px-2 py-1 rounded-lg"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Preview</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Decision Area */}
            <div className="p-4 bg-teal-50/60 rounded-2xl border border-teal-100 space-y-3">
              <h4 className="text-xs font-bold text-slate-900">Administrative Decision & Review Action</h4>
              
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleApproveHospital(reviewApplicationTarget.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve & Grant Trading Privileges</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReviewStageChoice('reject_prompt')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all"
                >
                  <X className="w-4 h-4" />
                  <span>Reject Application</span>
                </button>
              </div>

              {reviewStageChoice === 'reject_prompt' && (
                <form onSubmit={handleRejectHospital} className="space-y-3 pt-2 border-t border-rose-200">
                  <label className="block text-xs font-bold text-rose-800">
                    Specify Reason for Application Rejection <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    rows="3"
                    required
                    placeholder="e.g. Form 20B wholesale license expired; Medical Director authorization signature missing..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-rose-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setReviewStageChoice('verified')}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        </Modal>
      )}

      {/* HOSPITAL DEEP DETAILS DRAWER / MODAL */}
      {selectedHospitalForDetails && (
        <Modal
          isOpen={!!selectedHospitalForDetails}
          onClose={() => setSelectedHospitalForDetails(null)}
          title={selectedHospitalForDetails.name}
          subtitle={`Institutional Profile & Operations Ledger (Reg: ${selectedHospitalForDetails.registrationNo})`}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-4 pt-1">
            
            {/* Header Tabs */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                {[
                  { key: 'info', label: 'Hospital Information' },
                  { key: 'orders', label: 'Orders & Requisitions' },
                  { key: 'inventory', label: 'Inventory Listed' },
                  { key: 'activity', label: 'Recent Activity' },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setDetailsTab(t.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      detailsTab === t.key
                        ? 'bg-primary-50 text-primary-800 border border-primary-200 shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <StatusBadge status={selectedHospitalForDetails.status} />
            </div>

            {/* TAB 1: Hospital Information */}
            {detailsTab === 'info' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                    <span className="text-slate-400 font-medium block">Institutional Name</span>
                    <p className="font-bold text-slate-900 text-sm">{selectedHospitalForDetails.name}</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                    <span className="text-slate-400 font-medium block">Health Authority Registration ID</span>
                    <p className="font-mono font-bold text-primary-800 text-sm">{selectedHospitalForDetails.registrationNo}</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                    <span className="text-slate-400 font-medium block">Street Address & Location</span>
                    <p className="font-semibold text-slate-800">{selectedHospitalForDetails.address}, {selectedHospitalForDetails.city}, {selectedHospitalForDetails.state} - {selectedHospitalForDetails.pincode}</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                    <span className="text-slate-400 font-medium block">Hospital Administrator / Lead Pharmacist</span>
                    <p className="font-bold text-slate-800">{selectedHospitalForDetails.authorizedPerson}</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                    <span className="text-slate-400 font-medium block">Official Contact</span>
                    <p className="font-mono font-bold text-slate-800">{selectedHospitalForDetails.phone}</p>
                    <p className="text-slate-500">{selectedHospitalForDetails.email}</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                    <span className="text-slate-400 font-medium block">Registration & Verification Timeline</span>
                    <p className="text-slate-700">Filing Date: <span className="font-mono font-bold">{selectedHospitalForDetails.registeredDate}</span></p>
                    <p className="text-slate-700">Audit Status: <span className="font-bold text-emerald-700 capitalize">{selectedHospitalForDetails.status}</span></p>
                  </div>
                </div>

                {/* Statutory Documents */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800">Compliance Documents on Record</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(selectedHospitalForDetails.documents || []).map((doc, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-800">{doc.type || doc.name}</p>
                          <span className="text-[10px] text-slate-400 font-mono">{doc.size}</span>
                        </div>
                        <button
                          onClick={() => setInspectDoc(doc)}
                          className="px-2.5 py-1 text-[11px] font-bold text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100"
                        >
                          View Document
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Orders & Requisitions */}
            {detailsTab === 'orders' && (
              <div className="space-y-3">
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {requests.filter((r) => r.fromHospitalId === selectedHospitalForDetails.id || r.toHospitalId === selectedHospitalForDetails.id).length > 0 ? (
                    requests.filter((r) => r.fromHospitalId === selectedHospitalForDetails.id || r.toHospitalId === selectedHospitalForDetails.id).map((req) => (
                      <div key={req.id} className="py-3 flex items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-slate-900">{req.medicineName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {req.fromHospitalId === selectedHospitalForDetails.id ? `Ordered from ${req.toHospitalName}` : `Requested by ${req.fromHospitalName}`}
                          </div>
                          <span className="text-[10px] text-slate-400">Qty: {req.quantity} • ₹{req.totalAmount}</span>
                        </div>
                        <StatusBadge status={req.status} />
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center text-slate-400 font-medium">
                      No order requisitions recorded for this facility yet.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: Inventory Listed */}
            {detailsTab === 'inventory' && (
              <div className="space-y-3">
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {medicines.filter((m) => m.hospitalId === selectedHospitalForDetails.id).length > 0 ? (
                    medicines.filter((m) => m.hospitalId === selectedHospitalForDetails.id).map((med) => (
                      <div key={med.id} className="py-2.5 flex items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-slate-900">{med.brandName} <span className="text-slate-500 text-[11px]">({med.power})</span></div>
                          <div className="text-[10px] text-slate-400 font-mono">Batch: {med.batchNo} • Exp: {med.expiryDate}</div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-900 font-mono">{med.quantity} Units</span>
                          <span className="text-[10px] text-slate-400 block">₹{med.unitOriginalPrice}/unit</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center text-slate-400 font-medium">
                      No medicines currently listed under this hospital facility.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: Recent Activity */}
            {detailsTab === 'activity' && (
              <div className="space-y-3">
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {auditLogs.filter((a) => a.entityId === selectedHospitalForDetails.id || a.hospitalId === selectedHospitalForDetails.id || a.description?.includes(selectedHospitalForDetails.name)).length > 0 ? (
                    auditLogs.filter((a) => a.entityId === selectedHospitalForDetails.id || a.hospitalId === selectedHospitalForDetails.id || a.description?.includes(selectedHospitalForDetails.name)).map((log) => (
                      <div key={log.id} className="py-2.5 space-y-1">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="font-mono font-bold text-primary-700">{log.action}</span>
                          <span className="text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-800 leading-snug">{log.description || log.summary}</p>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center text-slate-400 font-medium">
                      No specific historical events logged for this node.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* BOTTOM ADMIN ACTIONS BAR */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-500 font-medium">
                Administrative Enforcement Controls
              </div>

              <div className="flex items-center gap-2">
                {selectedHospitalForDetails.status === 'suspended' ? (
                  <button
                    onClick={() => handleReactivateHospital(selectedHospitalForDetails.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reactivate Hospital</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setSuspendModalTarget(selectedHospitalForDetails)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Suspend Operations</span>
                  </button>
                )}

                {selectedHospitalForDetails.status !== 'verified' && (
                  <button
                    onClick={() => handleApproveHospital(selectedHospitalForDetails.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-sm transition-all"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Authorize Verification</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </Modal>
      )}

      {/* SUSPENSION REASON MODAL */}
      {suspendModalTarget && (
        <Modal
          isOpen={!!suspendModalTarget}
          onClose={() => { setSuspendModalTarget(null); setSuspensionReason(''); }}
          title={`Suspend Operational Access: ${suspendModalTarget.name}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSuspendHospital} className="space-y-4 pt-1">
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800 leading-relaxed">
              Suspension immediately halts inter-hospital trading, pauses pending requisitions, and quarantines active marketplace listings.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Statutory Reason for Operational Suspension <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows="3"
                required
                placeholder="e.g. Drug control officer reported cold-chain storage non-compliance..."
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setSuspendModalTarget(null); setSuspensionReason(''); }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!suspensionReason.trim()}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm disabled:opacity-50"
              >
                Confirm Suspension
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* DOCUMENT VIEWER MODAL */}
      {inspectDoc && (
        <DocumentViewerModal
          isOpen={!!inspectDoc}
          onClose={() => setInspectDoc(null)}
          document={inspectDoc}
          hospitalName="Applicant Hospital"
        />
      )}

    </div>
  );
};

export default AdminHospitals;
