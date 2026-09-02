import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
  Filter
} from 'lucide-react';
import { 
  fetchHospitals, 
  verifyHospitalAction, 
  rejectHospitalAction 
} from '../../store/slices/adminSlice';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import DocumentViewerModal from '../../components/common/DocumentViewerModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export const AdminVerification = () => {
  const dispatch = useDispatch();
  const { hospitals, isLoading } = useSelector((state) => state.admin);

  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'verified' | 'rejected'
  const [searchTerm, setSearchTerm] = useState('');

  const [verifyTarget, setVerifyTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [inspectDoc, setInspectDoc] = useState(null);

  useEffect(() => {
    dispatch(fetchHospitals());
  }, [dispatch]);

  const handleConfirmVerify = async () => {
    if (!verifyTarget) return;
    try {
      await dispatch(verifyHospitalAction(verifyTarget.id));
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
      }));
      toast.success(`Application rejected for ${rejectTarget.name}`);
      setRejectTarget(null);
      setRejectReason('');
    } catch (err) {
      toast.error('Failed to record rejection');
    }
  };

  const tabHospitals = hospitals.filter((h) => {
    if (activeTab === 'all') return true;
    return h.status === activeTab;
  });

  const filteredHospitals = tabHospitals.filter((h) =>
    h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.registrationNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingCount = hospitals.filter((h) => h.status === 'pending').length;
  const verifiedCount = hospitals.filter((h) => h.status === 'verified').length;
  const rejectedCount = hospitals.filter((h) => h.status === 'rejected').length;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 tracking-tight">Hospital Compliance & Verification</h1>
          <p className="text-xs text-slate-500">
            Mandatory statutory compliance review for institutional onboarding under Drugs and Cosmetics Act.
          </p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'pending'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Audit ({pendingCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('verified')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'verified'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Verified ({verifiedCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('rejected')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'rejected'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <X className="w-3.5 h-3.5" />
            <span>Rejected ({rejectedCount})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search hospital name, city, reg..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading && hospitals.length === 0 ? (
          <LoadingSpinner text="Querying compliance verification queue..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5 text-left">Hospital Identity</th>
                  <th className="px-4 py-3.5 text-left">Registration Date</th>
                  <th className="px-4 py-3.5 text-left">Authorized Signatory</th>
                  <th className="px-4 py-3.5 text-left">Compliance Docs</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-center">Audit Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredHospitals.length > 0 ? (
                  filteredHospitals.map((hosp) => (
                    <tr key={hosp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">{hosp.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">Reg: {hosp.registrationNo}</div>
                        <span className="text-[10px] text-slate-400">{hosp.city}, {hosp.state}</span>
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {hosp.registeredDate || '2024-08-28'}
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-semibold text-slate-800">{hosp.authorizedPerson}</span>
                        <span className="text-[10px] text-slate-400 block">{hosp.email}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {(hosp.documents || []).map((doc, idx) => (
                            <button
                              key={idx}
                              onClick={() => setInspectDoc(doc)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                            >
                              <FileText className="w-3 h-3 text-primary-600" />
                              <span className="truncate max-w-[90px]">{doc.type || doc.name}</span>
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <StatusBadge status={hosp.status} />
                      </td>
                      <td className="px-5 py-4 text-center">
                        {hosp.status === 'pending' ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setVerifyTarget(hosp)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Verify</span>
                            </button>
                            <button
                              onClick={() => setRejectTarget(hosp)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold text-xs transition-all"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : hosp.status === 'verified' ? (
                          <span className="text-[11px] text-emerald-700 font-semibold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Verified on {hosp.verifiedDate || '2024-08-29'}
                          </span>
                        ) : (
                          <div className="text-left max-w-xs">
                            <span className="text-[10px] text-rose-700 font-semibold block">Reason:</span>
                            <p className="text-[11px] text-rose-600 truncate">{hosp.rejectionReason}</p>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                      <FileCheck2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="font-semibold">No hospitals in the {activeTab} queue</p>
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
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Statutory Compliance Signoff</span>
              </div>
              <p className="text-emerald-900 leading-relaxed">
                You are approving <strong>{verifyTarget.name}</strong> (Reg No: {verifyTarget.registrationNo}). Their medicine inventory will be certified for peer exchange across the platform.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setVerifyTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmVerify}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Authorize Hospital Verification</span>
              </button>
            </div>
          </div>
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
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
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
