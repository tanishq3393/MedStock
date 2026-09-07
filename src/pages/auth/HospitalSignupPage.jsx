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
  Pill,
  Sparkles
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
      { name: 'Pharmacy_Drug_License_Form20.pdf', size: '2.8 MB', type: 'Drug License Form 20B/21B', verified: false },
      { name: 'GSTIN_Registration_Doc.pdf', size: '1.5 MB', type: 'GSTIN Certificate', verified: false },
      { name: 'Board_Authorization_Letter.pdf', size: '1.1 MB', type: 'Board Resolution Letter', verified: false },
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
      type: file.name.toLowerCase().includes('gst') ? 'GSTIN Certificate' : 'Statutory Drug License',
      verified: false,
    }));
    setFormData((prev) => ({
      ...prev,
      documents: [...prev.documents, ...newDocs],
    }));
    toast.success(`Attached ${acceptedFiles.length} file(s) for compliance review`);
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
        toast.error('Please complete all hospital identity fields');
        return;
      }
    } else if (step === 2) {
      if (!formData.address || !formData.city || !formData.state || !formData.pincode) {
        toast.error('Please complete all physical campus location details');
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
        toast.success('Account created! Please verify your official contact email.');
        navigate(`/verify-email?email=${encodeURIComponent(formData.email)}&role=hospital`, { replace: true });
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
        <div className="text-center space-y-1.5">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-md shadow-teal-600/20">
              <Pill className="w-5 h-5 rotate-45" />
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              Smart<span className="text-teal-600">MediShare</span>
            </span>
          </Link>
          <h2 className="text-xl font-black text-slate-900">Hospital Institutional Onboarding</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            4-step statutory compliance registration for inter-hospital medicine exchange & cold-chain access.
          </p>
        </div>

        {/* 4-Step Progress Indicator */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="grid grid-cols-4 text-center text-xs font-bold gap-2">
            <div className={`flex items-center justify-center gap-1.5 pb-2 border-b-2 transition-all ${
              step >= 1 ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-400'
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step >= 1 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>1</span>
              <span className="hidden sm:inline">Identity</span>
            </div>

            <div className={`flex items-center justify-center gap-1.5 pb-2 border-b-2 transition-all ${
              step >= 2 ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-400'
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step >= 2 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>2</span>
              <span className="hidden sm:inline">Campus</span>
            </div>

            <div className={`flex items-center justify-center gap-1.5 pb-2 border-b-2 transition-all ${
              step >= 3 ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-400'
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step >= 3 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>3</span>
              <span className="hidden sm:inline">Statutory Audit</span>
            </div>

            <div className={`flex items-center justify-center gap-1.5 pb-2 border-b-2 transition-all ${
              step >= 4 ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-400'
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step >= 4 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>4</span>
              <span className="hidden sm:inline">Security</span>
            </div>
          </div>
        </div>

        {/* Card Form */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-6 sm:p-8">
          
          {/* STEP 1: Hospital Identity */}
          {step === 1 && (
            <form onSubmit={handleNext} className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Step 1: Hospital & Authority Registration</h3>
                    <p className="text-[10px] text-slate-400">Institutional entity verification</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-slate-400">1 of 4</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Registered Hospital / Healthcare Institution <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apollo Hospital, Max Super Speciality"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all font-semibold"
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
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chief Pharmacist / Medical Director <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Dr. Full Name & Designation"
                    value={formData.authorizedPerson}
                    onChange={(e) => setFormData({ ...formData, authorizedPerson: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
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
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Phone (+91) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98200 12345"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/25 transition-all"
                >
                  <span>Next: Campus Location</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Address & Location */}
          {step === 2 && (
            <form onSubmit={handleNext} className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Step 2: Hospital Physical Campus & Intake Gate</h3>
                    <p className="text-[10px] text-slate-400">Used for courier cold-box dispatched pickups</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-slate-400">2 of 4</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pharmacy Gate / Campus Street Address <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows="2"
                  required
                  placeholder="Plot number, Sector, Central Pharmacy Intake Gate"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
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
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">State <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none"
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
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/25 transition-all"
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
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Step 3: Statutory CDSCO & Drug Controller Audit</h3>
                    <p className="text-[10px] text-slate-400">PDF documents required for hospital accreditation</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-slate-400">3 of 4</span>
              </div>

              {/* Drag & Drop Zone */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  isDragActive ? 'border-teal-500 bg-teal-50/60' : 'border-slate-300 hover:border-teal-400 bg-slate-50/50'
                }`}
              >
                <input {...getInputProps()} />
                <UploadCloud className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-800">
                  Drag & drop compliance PDFs, or <span className="text-teal-700 underline">browse workstation</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-1">Accepts PDF files up to 20MB per statutory document</p>
              </div>

              {/* Document List Preview */}
              <div className="space-y-2 pt-2">
                <p className="text-xs font-bold text-slate-700">Attached Documents ({formData.documents.length}):</p>
                <div className="space-y-1.5">
                  {formData.documents.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                      <div className="flex items-center gap-2.5">
                        <FileCheck className="w-4 h-4 text-teal-600 shrink-0" />
                        <div>
                          <div className="font-bold text-slate-800">{doc.name}</div>
                          <div className="text-[10px] text-slate-400">{doc.type} • {doc.size}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                        Audit Pending
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/25 transition-all"
                >
                  <span>Next: Security Credentials</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: Password & Confirmation */}
          {step === 4 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Step 4: Create Master Terminal Password</h3>
                    <p className="text-[10px] text-slate-400">Institutional authentication key</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-slate-400">4 of 4</span>
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
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all font-mono"
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
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all font-mono"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span>Statutory Compliance Declaration</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  By registering, the hospital affirms all pharmaceutical listings adhere to CDSCO storage guidelines (Drugs & Cosmetics Act 1940) and Schedule H/H1 safety protocols.
                </p>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-lg shadow-teal-600/25 transition-all disabled:opacity-75"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Registration Dossier...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Submit Hospital Dossier</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

        </div>

        <div className="text-center text-xs text-slate-500">
          Already registered institution?{' '}
          <Link to="/login" className="font-bold text-teal-700 hover:underline">
            Sign In to Portal
          </Link>
        </div>

      </div>
    </div>
  );
};

export default HospitalSignupPage;
