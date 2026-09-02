import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useDropzone } from 'react-dropzone';
import {
  Building2,
  FileText,
  Lock,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  UploadCloud,
  FileCheck,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Pill
} from 'lucide-react';
import { signupHospitalUser } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

export const HospitalSignupPage = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1
    name: 'Max Healthcare Institute Ltd',
    registrationNo: 'MH-MUM-2023-9081',
    authorizedPerson: 'Dr. Sunil Kashyap (Chief Pharmacist)',
    email: 'max.pharmacy@smartmedishare.org',
    phone: '+91 98200 44556',
    // Step 2
    address: 'Sector 19, Palm Beach Galleria Road',
    city: 'Navi Mumbai',
    state: 'Maharashtra',
    pincode: '400703',
    // Step 3 (Documents)
    documents: [
      { name: 'Hospital_Establishment_Reg.pdf', size: '3.4 MB', type: 'Registration Certificate', verified: false },
      { name: 'Pharmacy_Drug_License_Form20.pdf', size: '2.8 MB', type: 'Drug License', verified: false },
      { name: 'GSTIN_Registration_Doc.pdf', size: '1.5 MB', type: 'GST Certificate', verified: false },
      { name: 'Board_Authorization_Letter.pdf', size: '1.1 MB', type: 'Authorization Letter', verified: false },
    ],
    // Step 4
    password: '',
    confirmPassword: '',
  });

  const { isLoading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Dropzone hook for uploading additional PDFs
  const onDrop = (acceptedFiles) => {
    const newDocs = acceptedFiles.map((file) => ({
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      type: file.name.toLowerCase().includes('gst') ? 'GST Certificate' : 'Compliance Document',
      verified: false,
    }));
    setFormData((prev) => ({
      ...prev,
      documents: [...prev.documents, ...newDocs],
    }));
    toast.success(`Uploaded ${acceptedFiles.length} file(s) for verification review`);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 20 * 1024 * 1024, // 20MB
  });

  const handleNext = (e) => {
    e.preventDefault();
    if (step === 1) {
      if (!formData.name || !formData.registrationNo || !formData.email || !formData.phone) {
        toast.error('Please complete all Hospital identity fields');
        return;
      }
    } else if (step === 2) {
      if (!formData.address || !formData.city || !formData.state || !formData.pincode) {
        toast.error('Please complete all physical location details');
        return;
      }
    } else if (step === 3) {
      if (formData.documents.length === 0) {
        toast.error('Please upload at least 1 compliance document');
        return;
      }
    }
    setStep(step + 1);
  };

  const handlePrevious = () => {
    setStep(Math.max(1, step - 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      const resultAction = await dispatch(signupHospitalUser(formData));
      if (signupHospitalUser.fulfilled.match(resultAction)) {
        toast.success('Hospital Registration submitted! Awaiting Admin compliance verification.');
        navigate('/hospital/dashboard', { replace: true });
      } else {
        toast.error(resultAction.payload || 'Signup failed');
      }
    } catch (err) {
      toast.error(err.message || 'Unexpected error occurred');
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] py-8 px-4 sm:px-6 lg:px-8 flex justify-center">
      <div className="max-w-2xl w-full space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-1">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-600 text-white flex items-center justify-center font-bold">
              <Pill className="w-4 h-4 rotate-45" />
            </div>
            <span className="text-xl font-extrabold text-secondary-900">
              Smart<span className="text-primary-500">MediShare</span>
            </span>
          </Link>
          <h2 className="text-xl font-bold text-slate-900">Hospital Institutional Onboarding</h2>
          <p className="text-xs text-slate-500">4-step compliance registration for inter-hospital medicine exchange</p>
        </div>

        {/* 4-Step Progress Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span className={step >= 1 ? 'text-primary-700' : 'text-slate-400'}>1. Identity</span>
            <span className={step >= 2 ? 'text-primary-700' : 'text-slate-400'}>2. Location</span>
            <span className={step >= 3 ? 'text-primary-700' : 'text-slate-400'}>3. Documents</span>
            <span className={step >= 4 ? 'text-primary-700' : 'text-slate-400'}>4. Security</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Card Form */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200 p-6 sm:p-8">
          
          {/* STEP 1: Hospital Identity */}
          {step === 1 && (
            <form onSubmit={handleNext} className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Building2 className="w-5 h-5 text-primary-600" />
                <h3 className="text-sm font-bold text-slate-800">Step 1: Hospital & Authority Details</h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Hospital Name (Registered Institution) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apollo Hospital, Max Healthcare"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    State Health Authority Reg No. <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MH-MUM-2023-8812"
                    value={formData.registrationNo}
                    onChange={(e) => setFormData({ ...formData, registrationNo: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Authorized Signatory / Pharmacist <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Dr. Full Name & Designation"
                    value={formData.authorizedPerson}
                    onChange={(e) => setFormData({ ...formData, authorizedPerson: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Official Work Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="pharmacy@hospital.org"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone (Indian format +91) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98200 12345"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-md shadow-primary-500/25 transition-all"
                >
                  <span>Next: Physical Location</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Address & Location */}
          {step === 2 && (
            <form onSubmit={handleNext} className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <MapPin className="w-5 h-5 text-primary-600" />
                <h3 className="text-sm font-bold text-slate-800">Step 2: Hospital Physical Address</h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Street Address / Campus <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows="2"
                  required
                  placeholder="Plot number, Sector, Road, Landmark"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">State <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pincode <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    maxLength="6"
                    required
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-md shadow-primary-500/25 transition-all"
                >
                  <span>Next: Upload Documents</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Document Uploads */}
          {step === 3 && (
            <form onSubmit={handleNext} className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <FileText className="w-5 h-5 text-primary-600" />
                <h3 className="text-sm font-bold text-slate-800">Step 3: Upload Compliance Documents (PDF only, max 20MB)</h3>
              </div>

              <p className="text-xs text-slate-500">
                Required for statutory audit: Registration Certificate, Drug License (Form 20B/21B), GSTIN Certificate, and Authority Resolution Letter.
              </p>

              {/* Drag & Drop Zone */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-primary-500 bg-primary-50/60' : 'border-slate-300 hover:border-primary-400 bg-slate-50/50'
                }`}
              >
                <input {...getInputProps()} />
                <UploadCloud className="w-8 h-8 text-primary-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-800">
                  Drag & drop PDFs here, or <span className="text-primary-600 underline">browse files</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-1">Accepts PDF files up to 20MB per document</p>
              </div>

              {/* Document List Preview */}
              <div className="space-y-2 pt-2">
                <p className="text-xs font-bold text-slate-700">Attached Documents ({formData.documents.length}):</p>
                <div className="space-y-1.5">
                  {formData.documents.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <div className="flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-emerald-600" />
                        <div>
                          <span className="font-semibold text-slate-800">{doc.name}</span>
                          <span className="text-slate-400 ml-2">({doc.type} • {doc.size})</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Queued for Audit
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-md shadow-primary-500/25 transition-all"
                >
                  <span>Next: Account Password</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: Password & Confirmation */}
          {step === 4 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Lock className="w-5 h-5 text-primary-600" />
                <h3 className="text-sm font-bold text-slate-800">Step 4: Create Master Password</h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Master Portal Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirm Master Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-800">Compliance Confirmation:</p>
                <p className="text-[11px] text-slate-500">
                  By registering, the hospital affirms all pharmaceutical listings comply with CDSCO storage guidelines and schedule H/H1 safety protocols.
                </p>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-lg shadow-primary-500/25 transition-all disabled:opacity-75"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Registration...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Submit Hospital Application</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

        </div>

        <div className="text-center text-xs text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-primary-600 hover:underline">
            Sign In to Portal
          </Link>
        </div>

      </div>
    </div>
  );
};

export default HospitalSignupPage;
