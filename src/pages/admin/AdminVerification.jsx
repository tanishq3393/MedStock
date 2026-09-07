import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  FileCheck2, 
  Check, 
  X, 
  Building2, 
  Calendar, 
  FileText, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Eye,
  Search,
  Filter,
  Clock,
  ExternalLink,
  Award
} from 'lucide-react';
import { 
  fetchHospitals, 
  verifyHospitalAction, 
  rejectHospitalAction,
  setReviewStatusAction 
} from '../../store/slices/adminSlice';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import DocumentViewerModal from '../../components/common/DocumentViewerModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export const AdminVerification = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { hospitals, isLoading } = useSelector((state) => state.admin);

  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'under_review' | 'documents_missing' | 'verified' | 'rejected' | 'suspended' | 'all'
  const [searchTerm, setSearchTerm] = useState('');

  const [verifyTarget, setVerifyTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewStatusChoice, setReviewStatusChoice] = useState('under_review');
  const [reviewNote, setReviewNote] = useState('');
  const [inspectDoc, setInspectDoc] = useState(null);

  useEffect(() => {
    dispatch(fetchHospitals());
  }, [dispatch]);

  const handleConfirmVerify = async () => {
    if (!verifyTarget) return;
    try {
      await dispatch(verifyHospitalAction(verifyTarget.id)).unwrap();
      toast.success(`${verifyTarget.name} has been verified and granted trade privileges.`);
      setVerifyTarget(null);
    } catch (err) {
      toast.error('Failed to verify hospital');
    }
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectTarget) return;
    try {
      await dispatch(rejectHospitalAction({
        hospitalId: rejectTarget.id,
        reason: rejectReason || 'Documentation audit incomplete or statutory compliance missing.'
      })).unwrap();
      toast.success(`Application rejected for ${rejectTarget.name}`);
      setRejectTarget(null);
      setRejectReason('');
    } catch (err) {
      toast.error('Failed to record rejection');
    }
  };

  const handleConfirmReview = async (e) => {
    e.preventDefault();
    if (!reviewTarget) return;
    try {
      if (reviewStatusChoice === 'verified') {
        await dispatch(verifyHospitalAction(reviewTarget.id)).unwrap();
        toast.success(`${reviewTarget.name} has been verified.`);
      } else if (reviewStatusChoice === 'rejected') {
        await dispatch(rejectHospitalAction({
          hospitalId: reviewTarget.id,
          reason: reviewNote || 'Documentation audit incomplete or statutory compliance missing.'
        })).unwrap();
        toast.success(`Application rejected for ${reviewTarget.name}`);
      } else {
        await dispatch(setReviewStatusAction({
          hospitalId: reviewTarget.id,
          status: reviewStatusChoice,
          note: reviewNote,
        })).unwrap();
        toast.success(`Updated status to ${reviewStatusChoice.replace('_', ' ')} for ${reviewTarget.name}`);
      }
      setReviewTarget(null);
      setReviewNote('');
    } catch (err) {
      toast.error('Failed to update verification status');
    }
  };

  const tabHospitals = hospitals.filter((h) => {
    if (activeTab === 'all') return true;
    return h.status === activeTab;
  });

  const filteredHospitals = tabHospitals.filter((h) =>
    h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (h.registrationNo && h.registrationNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
    h.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingCount = hospitals.filter((h) => h.status === 'pending').length;
  const underReviewCount = hospitals.filter((h) => h.status === 'under_review').length;
  const docsMissingCount = hospitals.filter((h) => h.status === 'documents_missing').length;
  const verifiedCount = hospitals.filter((h) => h.status === 'verified').length;
  const rejectedCount = hospitals.filter((h) => h.status === 'rejected').length;
  const suspendedCount = hospitals.filter((h) => h.status === 'suspended').length;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-ocean-950 via-ocean-900 to-teal-950 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-[radial-gradient(ellipse_at_top_right,rgba(10,110,121,0.25),transparent_70%)] pointer-events-none" />
        
        <div className="relative z-10 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <Award className="w-3 h-3 text-teal-400" />
              Drugs & Cosmetics Act 1940
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <ShieldCheck className="w-3 h-3 text-cyan-400" />
              ABDM HFR Registry Simulator • Ready
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Hospital Compliance & Verification</h1>
          <p className="text-xs text-slate-300 max-w-xl font-normal">
            Mandatory compliance audit verifying Form 20B/21B drug permits, Medical Director authorizations, and cold-chain compliance before granting inter-hospital trading rights.
          </p>
        </div>

        <div className="relative z-10">
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md text-right">
            <div className="text-[10px] uppercase font-bold text-teal-400 tracking-wider">Awaiting Audit</div>
            <div className="text-lg font-black text-white font-mono flex items-center justify-end gap-1.5">
              <span>{pendingCount + underReviewCount} In Queue</span>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'pending'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending ({pendingCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('under_review')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'under_review'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <span>Under Review ({underReviewCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('documents_missing')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'documents_missing'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <span>Docs Missing ({docsMissingCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('verified')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'verified'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Verified ({verifiedCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('rejected')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'rejected'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <X className="w-3.5 h-3.5" />
            <span>Rejected ({rejectedCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('suspended')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'suspended'
                ? 'bg-slate-800 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Suspended ({suspendedCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-primary-700 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <span>All ({hospitals.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search hospital, city, reg no..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading && hospitals.length === 0 ? (
          <div className="py-16">
            <LoadingSpinner text="Querying statutory compliance verification queue..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200/80 text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5 text-left">Hospital Institution</th>
                  <th className="px-4 py-3.5 text-left">Filing Date</th>
                  <th className="px-4 py-3.5 text-left">Authorized Signatory</th>
                  <th className="px-4 py-3.5 text-left">Statutory Audit Dossier</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-center">Audit Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredHospitals.length > 0 ? (
                  filteredHospitals.map((hosp) => (
                    <tr
                      key={hosp.id}
                      onClick={() => navigate(`/admin/hospital-details?hospitalId=${encodeURIComponent(hosp.id)}`)}
                      className="hover:bg-teal-50/20 transition-colors group cursor-pointer"
                    >
                                            {/* Hospital Identity */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors">{hosp.name}</div>
                        <div className="text-[11px] text-teal-800 font-mono font-bold mt-0.5">Reg: {hosp.registrationNo}</div>
                        <div className="inline-flex items-center gap-1.5 text-[10px] text-teal-800 bg-teal-50 px-2 py-0.5 rounded font-mono mt-1 border border-teal-200">
                          <ShieldCheck className="w-3 h-3 text-teal-600" />
                          <span>ABDM: <strong>IN-{(hosp.city || 'MH').substring(0, 2).toUpperCase()}-{(hosp.id || '01').replace('hosp-', 'FAC-')}</strong></span>
                          <span className="text-[9px] text-emerald-600 font-bold ml-0.5">● HFR Simulator</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{hosp.city}, {hosp.state}</span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-4 text-slate-600 font-mono text-[11px]">
                        {hosp.registeredDate || '2024-08-28'}
                      </td>

                      {/* Signatory */}
                      <td className="px-4 py-4">
                        <div className="font-bold text-slate-800">{hosp.authorizedPerson}</div>
                        <span className="text-[10px] text-slate-400 font-mono block">{hosp.email}</span>
                      </td>

                      {/* Documents */}
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {(hosp.documents || []).map((doc, idx) => (
                            <button
                              key={idx}
                              onClick={(event) => { event.stopPropagation(); setInspectDoc(doc); }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 border border-slate-200 transition-colors"
                              title="Click to view full statutory certificate"
                            >
                              <FileText className="w-3 h-3 text-teal-600" />
                              <span className="truncate max-w-[90px]">{doc.type || doc.name}</span>
                            </button>
                          ))}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 text-center">
                        <StatusBadge status={hosp.status} />
                        {hosp.reviewNote && (
                          <p className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 mt-1 max-w-[170px] mx-auto text-left truncate" title={hosp.reviewNote}>
                            Note: {hosp.reviewNote}
                          </p>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-center">
                        {['pending', 'under_review', 'documents_missing'].includes(hosp.status) ? (
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <button
                              onClick={(event) => { event.stopPropagation(); setVerifyTarget(hosp); }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition-all"
                              title="Authorize trade access"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Authorize</span>
                            </button>
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                setReviewTarget(hosp);
                                setReviewStatusChoice(hosp.status === 'under_review' ? 'documents_missing' : 'under_review');
                                setReviewNote(hosp.reviewNote || '');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition-all"
                              title="Update review lifecycle stage"
                            >
                              <span>Update Stage</span>
                            </button>
                            <button
                              onClick={(event) => { event.stopPropagation(); setRejectTarget(hosp); }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold text-xs transition-all"
                              title="Reject application"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : hosp.status === 'verified' ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold font-mono">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Approved {hosp.verifiedDate || '2024-08-29'}</span>
                          </div>
                        ) : (
                          <div className="text-left max-w-xs">
                            <span className="text-[10px] text-rose-700 font-bold block">Audit Reason:</span>
                            <p className="text-[11px] text-rose-600 truncate">{hosp.rejectionReason}</p>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-14 text-center text-slate-400">
                      <FileCheck2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="font-bold text-slate-700">No applications in the {activeTab} queue</p>
                      <p className="text-xs text-slate-400 mt-1">Switch tabs to view other audit categories.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Verify Confirmation Modal */}
      {verifyTarget && (
        <Modal
          isOpen={!!verifyTarget}
          onClose={() => setVerifyTarget(null)}
          title="Approve Hospital Compliance Verification"
          subtitle={`Grant trading and redistribution access to ${verifyTarget.name}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 pt-1">
            <div className="p-4 bg-teal-50 rounded-2xl border border-teal-200 text-xs space-y-2">
              <div className="flex items-center gap-2 text-teal-900 font-bold">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Statutory Compliance Signoff</span>
              </div>
              <p className="text-teal-950 leading-relaxed text-[11px]">
                You are approving <strong>{verifyTarget.name}</strong> (Reg No: {verifyTarget.registrationNo}). Their medicine inventory will be certified for peer exchange across the platform.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setVerifyTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmVerify}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Authorize Hospital Verification</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Review Stage Modal */}
      {reviewTarget && (
        <Modal
          isOpen={!!reviewTarget}
          onClose={() => { setReviewTarget(null); setReviewNote(''); }}
          title="Update Verification Stage"
          subtitle={`Manage statutory review progress for ${reviewTarget.name}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleConfirmReview} className="space-y-4 pt-1">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div className="font-bold text-slate-800">{reviewTarget.name}</div>
              <div className="text-[11px] text-slate-500 font-mono">Reg No: {reviewTarget.registrationNo}</div>
              <div className="text-[10px] text-teal-700 font-mono mt-1">
                ABDM Sandbox: IN-{(reviewTarget.city || 'MH').substring(0, 2).toUpperCase()}-{(reviewTarget.id || '01').replace('hosp-', 'FAC-')}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select Lifecycle State <span className="text-rose-500">*</span>
              </label>
              <select
                value={reviewStatusChoice}
                onChange={(e) => setReviewStatusChoice(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-teal-500"
              >
                <option value="under_review">Under Review (Statutory team auditing Form 20B/21B)</option>
                <option value="documents_missing">Documents Missing (Awaiting updated license/dossier)</option>
                <option value="verified">Verified (Authorize full trade access)</option>
                <option value="rejected">Rejected (Non-compliant)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reviewer Auditor Notes / Missing Requirements
              </label>
              <textarea
                rows="3"
                placeholder="e.g. Form 20B cold chain storage license page 2 missing signature..."
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setReviewTarget(null); setReviewNote(''); }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm"
              >
                Save Review Stage
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reject Modal with Reason Input */}
      {rejectTarget && (
        <Modal
          isOpen={!!rejectTarget}
          onClose={() => setRejectTarget(null)}
          title="Reject Hospital Application"
          subtitle={`Specify non-compliance reasons for ${rejectTarget.name}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleConfirmReject} className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Audit Non-Compliance Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows="3"
                required
                placeholder="e.g. Drug license renewal pending with state authority / Mismatch in authorized signatory..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm"
              >
                Confirm Rejection
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Document Inspector Modal */}
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

export default AdminVerification;
