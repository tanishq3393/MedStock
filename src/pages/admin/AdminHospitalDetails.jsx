import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
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
  RotateCcw
} from 'lucide-react';
import { fetchHospitals, updateHospitalDetailsAction, suspendHospitalAction, reactivateHospitalAction } from '../../store/slices/adminSlice';
import StatusBadge from '../../components/common/StatusBadge';
import DocumentViewerModal from '../../components/common/DocumentViewerModal';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export const AdminHospitalDetails = () => {
  const dispatch = useDispatch();
  const { hospitals, isLoading } = useSelector((state) => state.admin);
  const { user } = useSelector((state) => state.auth);
  const [searchParams] = useSearchParams();

  const [selectedHospId, setSelectedHospId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [viewerDoc, setViewerDoc] = useState(null);
  const [statusAction, setStatusAction] = useState(null);
  const [suspensionReason, setSuspensionReason] = useState('');

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

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updateHospitalDetailsAction({
        hospitalId: selectedHospital.id,
        data: editFormData
      }));
      setIsEditing(false);
      toast.success(`Updated institutional profile for ${editFormData.name}`);
    } catch (err) {
      toast.error('Failed to update hospital details');
    }
  };

  const handleStatusAction = async (event) => {
    event.preventDefault();
    if (!selectedHospital || !statusAction) return;
    try {
      if (statusAction === 'suspend') {
        if (!suspensionReason.trim()) return;
        await dispatch(suspendHospitalAction({
          hospitalId: selectedHospital.id,
          reason: suspensionReason,
        })).unwrap();
        toast.success(`${selectedHospital.name} has been suspended`);
      } else {
        await dispatch(reactivateHospitalAction(selectedHospital.id)).unwrap();
        toast.success(`${selectedHospital.name} has been reactivated`);
      }
      setStatusAction(null);
      setSuspensionReason('');
    } catch (err) {
      toast.error(err || 'Failed to update hospital status');
    }
  };

  if (isLoading && hospitals.length === 0) {
    return <LoadingSpinner text="Fetching hospital registry dossiers..." />;
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 tracking-tight">Hospital Institutional Dossier</h1>
          <p className="text-xs text-slate-500">
            Review legal verification documents, regulatory licenses, and profile information.
          </p>
        </div>

        {/* Hospital Registry Search and Selector */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search hospital name..."
              aria-label="Search hospitals by name"
              className="w-full sm:w-56 pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <span className="text-xs font-bold text-slate-500">Hospital:</span>
          <select
            value={selectedHospId}
            onChange={(e) => setSelectedHospId(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:outline-none"
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT 2 COLUMNS: Profile Details (Editable) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            
            {/* Top Bar with Edit Toggle */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{selectedHospital.name}</h3>
                    <StatusBadge status={selectedHospital.status} />
                  </div>
                  <p className="text-xs text-slate-500 font-mono">Reg No: {selectedHospital.registrationNo}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div className="text-xs text-slate-500">
                  {selectedHospital.status === 'suspended' && (
                    <span className="text-rose-700 font-semibold">Suspension reason: {selectedHospital.suspensionReason}</span>
                  )}
                </div>
                {selectedHospital.status === 'suspended' ? (
                  <button
                    type="button"
                    onClick={() => setStatusAction('reactivate')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reactivate Hospital
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStatusAction('suspend')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    Suspend Hospital
                  </button>
                )}
              </div>

              <div>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors"
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

            {/* Profile Form */}
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hospital Registered Name</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 disabled:bg-slate-50 disabled:text-slate-700 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">State Health Authority Reg Number</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={editFormData.registrationNo}
                    onChange={(e) => setEditFormData({ ...editFormData, registrationNo: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 disabled:bg-slate-50 font-mono font-bold"
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
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 disabled:bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Official Email</label>
                  <input
                    type="email"
                    disabled={!isEditing}
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 disabled:bg-slate-50"
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
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 disabled:bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={editFormData.city}
                    onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 disabled:bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={editFormData.state}
                    onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 disabled:bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={editFormData.pincode}
                    onChange={(e) => setEditFormData({ ...editFormData, pincode: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 disabled:bg-slate-50 font-mono"
                  />
                </div>
              </div>

              {isEditing && (
                <div className="pt-3 flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-md"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Institutional Changes</span>
                  </button>
                </div>
              )}
            </form>

          </div>

          {/* RIGHT COLUMN: Document Viewer & Audit Links */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <FileText className="w-5 h-5 text-primary-600" />
              <h3 className="text-sm font-bold text-slate-900">Legal Audit Documents</h3>
            </div>

            <p className="text-xs text-slate-500">
              CDSCO compliance and Pharmacy Practice Regulations required filings. Click any document to view or download.
            </p>

            <div className="space-y-3 pt-1">
              {(selectedHospital.documents || []).map((doc, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{doc.type || doc.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">{doc.name} ({doc.size})</p>
                    </div>
                    {doc.verified ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Verified
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Audit Pending
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                    <button
                      onClick={() => setViewerDoc(doc)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-600 hover:text-primary-800"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview Doc</span>
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      onClick={() => toast.success(`Downloading ${doc.name}`)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-800"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>
      )}

      {/* Document Viewer Modal */}
      {viewerDoc && (
        <DocumentViewerModal
          isOpen={!!viewerDoc}
          onClose={() => setViewerDoc(null)}
          document={viewerDoc}
          hospitalName={selectedHospital?.name}
        />
      )}

      {statusAction && selectedHospital && (
        <Modal
          isOpen={!!statusAction}
          onClose={() => { setStatusAction(null); setSuspensionReason(''); }}
          title={statusAction === 'suspend' ? 'Suspend Hospital' : 'Reactivate Hospital'}
          subtitle={statusAction === 'suspend'
            ? `Suspend operational access for ${selectedHospital.name}`
            : `Restore operational access for ${selectedHospital.name}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleStatusAction} className="space-y-4">
            {statusAction === 'suspend' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Reason for suspension <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows="4"
                  required
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  placeholder="Enter the required suspension reason..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            ) : (
              <p className="text-xs text-slate-600 leading-relaxed">
                This restores the hospital's previous active status and allows operational actions again.
              </p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setStatusAction(null); setSuspensionReason(''); }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={statusAction === 'suspend' && !suspensionReason.trim()}
                className={`px-4 py-2 text-xs font-bold text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed ${statusAction === 'suspend' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-teal-600 hover:bg-teal-700'}`}
              >
                {statusAction === 'suspend' ? 'Confirm Suspension' : 'Confirm Reactivation'}
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};

export default AdminHospitalDetails;
