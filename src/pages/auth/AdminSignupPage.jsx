import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  User,
  Mail,
  Phone,
  Building,
  Briefcase,
  IdCard,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowRight,
  ArrowLeft,
  Upload,
  Loader2,
  Trash2,
  Info,
  BadgeCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import adminRegistrationService from '../../services/adminRegistrationService';

const STEPS = [
  { id: 1, label: 'Administrator Info' },
  { id: 2, label: 'Regulatory Authority' },
  { id: 3, label: 'Verification & Credentials' },
  { id: 4, label: 'Review & Submit' },
];

export const AdminSignupPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Current Wizard Step (1..4)
  const [currentStep, setCurrentStep] = useState(1);

  // Configuration / Feature Flags
  const [emailVerificationRequired, setEmailVerificationRequired] = useState(false);
  const [isConfigLoading, setIsConfigLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Administrator Info
    fullName: '',
    email: '',
    phone: '',

    // Step 2: Regulatory Authority
    regulatoryAuthority: 'State Drug Control Administration',
    department: 'Verification & Compliance Authority',
    designation: 'Drug Controller / Regulatory Inspector',
    employeeId: '',

    // Step 3: Credentials & Verification
    username: '',
    password: '',
    confirmPassword: '',
    verificationToken: '',
  });

  // OTP State
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  // Authorization Letter State
  const [uploadedDocument, setUploadedDocument] = useState(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  // User ID Availability State
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [usernameMessage, setUsernameMessage] = useState('');

  // Password Visibility State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [declarationAgreed, setDeclarationAgreed] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [registeredAdmin, setRegisteredAdmin] = useState(null);

  // Fetch Config on mount
  useEffect(() => {
    document.title = 'MedEx | Administrator Registration';
    let isMounted = true;
    (async () => {
      try {
        const cfg = await adminRegistrationService.getConfig();
        if (isMounted && cfg && typeof cfg.emailVerificationRequired === 'boolean') {
          setEmailVerificationRequired(cfg.emailVerificationRequired);
        }
      } catch (err) {
        console.warn('Failed to load admin registration config:', err.message);
      } finally {
        if (isMounted) setIsConfigLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // OTP Timer countdown
  useEffect(() => {
    if (otpTimer <= 0) return;
    const interval = setInterval(() => {
      setOtpTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Username validation check with debounce
  useEffect(() => {
    const raw = formData.username.trim();
    if (!raw || raw.length < 3) {
      setUsernameAvailable(null);
      setUsernameMessage('');
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingUsername(true);
      try {
        const result = await adminRegistrationService.checkUsername(raw);
        setUsernameAvailable(result.available);
        setUsernameMessage(result.message);
      } catch (err) {
        setUsernameAvailable(false);
        setUsernameMessage(err.message);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [formData.username]);

  // Handle OTP Send
  const handleSendOtp = async () => {
    const email = formData.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      toast.error('Please provide a valid official work email address first.');
      return;
    }

    setIsSendingOtp(true);
    try {
      await adminRegistrationService.sendOtp(email);
      setOtpSent(true);
      setOtpTimer(60);
      toast.success('Verification code dispatched to official work email.');
    } catch (err) {
      toast.error(err.message || 'Failed to dispatch verification code.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle OTP Verify
  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      toast.error('Please enter the 6-digit verification code.');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const result = await adminRegistrationService.verifyOtp(formData.email.trim(), otpCode.trim());
      setEmailVerified(true);
      setFormData((prev) => ({ ...prev, verificationToken: result.verificationToken || 'verified_token' }));
      toast.success('Work email verified successfully!');
    } catch (err) {
      toast.error(err.message || 'Verification failed. Please check the code.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Handle Document Upload
  const handleDocumentFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Only statutory PDF documents are accepted.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Document size must not exceed 5 MB.');
      return;
    }

    setIsUploadingDoc(true);
    try {
      const docRecord = await adminRegistrationService.uploadAuthorizationLetter(file);
      setUploadedDocument(docRecord);
      toast.success('Authorization Letter uploaded and verified.');
    } catch (err) {
      toast.error(err.message || 'Failed to upload authorization letter.');
    } finally {
      setIsUploadingDoc(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveDocument = () => {
    setUploadedDocument(null);
    toast.info('Authorization letter removed.');
  };

  // Password rules validation
  const isPasswordValid = (pwd) => {
    return pwd.length >= 8 && /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[0-9]/.test(pwd);
  };

  // Step Navigations
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!formData.fullName.trim()) {
        toast.error('Please provide Supervisory Officer Legal Name.');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
        toast.error('Please provide a valid Government / Regulatory Work Email.');
        return;
      }
      if (!formData.phone.trim() || formData.phone.trim().length < 8) {
        toast.error('Please provide a valid contact phone number.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!formData.regulatoryAuthority.trim()) {
        toast.error('Please specify Regulatory Authority.');
        return;
      }
      if (!formData.department.trim()) {
        toast.error('Please specify Department.');
        return;
      }
      if (!formData.designation.trim()) {
        toast.error('Please specify Designation / Role.');
        return;
      }
      if (!formData.employeeId.trim()) {
        toast.error('Please provide Government / Regulatory Employee ID.');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      // Step 3 Validation
      if (emailVerificationRequired && !emailVerified) {
        toast.error('Official work email OTP verification is required.');
        return;
      }
      if (!uploadedDocument) {
        toast.error('Please upload Government / Regulatory Authorization Letter.');
        return;
      }
      if (!formData.username.trim() || formData.username.trim().length < 3) {
        toast.error('Please specify a valid User ID (minimum 3 characters).');
        return;
      }
      if (usernameAvailable === false) {
        toast.error('Selected User ID is already taken. Please choose another.');
        return;
      }
      if (!isPasswordValid(formData.password)) {
        toast.error('Password must be at least 8 characters long and contain uppercase, lowercase, and a number.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match.');
        return;
      }
      setCurrentStep(4);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Final Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!declarationAgreed) {
      toast.error('Please affirm the regulatory accuracy declaration before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        regulatoryAuthority: formData.regulatoryAuthority.trim(),
        department: formData.department.trim(),
        designation: formData.designation.trim(),
        employeeId: formData.employeeId.trim(),
        username: formData.username.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        verificationToken: formData.verificationToken,
        authorizationDocument: uploadedDocument,
      };

      const result = await adminRegistrationService.submitRegistration(payload);
      setRegisteredAdmin(result.admin);
      setRegistrationComplete(true);
      toast.success('Supervisory Administrator Registered Successfully!');
    } catch (err) {
      toast.error(err.message || 'Administrator registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Success Screen
  if (registrationComplete && registeredAdmin) {
    return (
      <div className="min-h-[calc(100vh-8rem)] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-teal-50 text-teal-600 border border-teal-200 mx-auto flex items-center justify-center shadow-inner">
            <BadgeCheck className="w-9 h-9 text-teal-600" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Administrator Authorized & Activated
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Your official credentials have been registered in the MedEx platform directory.
            </p>
          </div>

          {/* Account Snapshot Card */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 text-left space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Assigned User ID:</span>
              <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                {registeredAdmin.username}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Supervisory Officer:</span>
              <span className="font-bold text-slate-800">{registeredAdmin.legalName}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Official Work Email:</span>
              <span className="font-mono text-slate-700">{registeredAdmin.email}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Regulatory Authority:</span>
              <span className="font-semibold text-slate-800">{registeredAdmin.regulatoryAuthority}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 font-medium">Designation:</span>
              <span className="font-semibold text-slate-800">{registeredAdmin.designation}</span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              to="/admin-login"
              className="w-full py-3.5 rounded-2xl bg-ocean-900 hover:bg-ocean-950 text-white text-xs font-bold shadow-lg shadow-ocean-900/20 transition-all flex items-center justify-center gap-2"
            >
              <span>Sign In to Regulatory Command Center</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] py-8 px-4 sm:px-6 lg:px-8 flex justify-center items-center">
      <div className="max-w-2xl w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-ocean-900 text-white flex items-center justify-center font-bold shadow-md">
              <ShieldAlert className="w-5 h-5 text-teal-400" />
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              Med<span className="text-teal-600">Ex</span>
            </span>
          </Link>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Regulatory Administrator Registration
          </h1>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Authorized portal onboarding for state drug regulatory authorities, health commissioners, and logistics compliance officers.
          </p>
        </div>

        {/* Wizard Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 overflow-hidden">
          {/* Stepper Header */}
          <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200">
            <div className="grid grid-cols-4 gap-2">
              {STEPS.map((s) => {
                const isActive = s.id === currentStep;
                const isPassed = s.id < currentStep;
                return (
                  <div key={s.id} className="flex flex-col items-center text-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30 ring-4 ring-teal-100'
                          : isPassed
                          ? 'bg-teal-100 text-teal-800 border border-teal-300'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="w-4 h-4 text-teal-700" /> : s.id}
                    </div>
                    <span
                      className={`text-[10px] mt-1.5 font-bold truncate max-w-full ${
                        isActive ? 'text-slate-900' : 'text-slate-400'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Wizard Body */}
          <div className="p-6 sm:p-8">
            {/* STEP 1: ADMINISTRATOR INFORMATION */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-teal-600" />
                    <span>Supervisory Officer Identity</span>
                  </h2>
                  <p className="text-xs text-slate-500">Provide official identity and regulatory contact details</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Supervisory Officer Legal Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Officer Rajesh Verma"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Government / Regulatory Work Email <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="regulator@fda.gov.in"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Official regulatory work email domain required.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      placeholder="+91 98110 00000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: REGULATORY AUTHORITY */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Building className="w-4 h-4 text-teal-600" />
                    <span>Regulatory Body & Department Information</span>
                  </h2>
                  <p className="text-xs text-slate-500">Official statutory affiliation and supervisory role</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Regulatory Authority / Commission <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. State Drug Control Administration (Food & Drug Control)"
                      value={formData.regulatoryAuthority}
                      onChange={(e) => setFormData({ ...formData, regulatoryAuthority: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Official Department / Directorate <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Logistics Oversight & Statutory Compliance Division"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Official Role / Designation <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Drug Inspector / Officer"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Government / Officer ID <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <IdCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. GOV-REG-44021"
                        value={formData.employeeId}
                        onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                        className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: VERIFICATION & CREDENTIALS */}
            {currentStep === 3 && (
              <div className="space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-teal-600" />
                    <span>Verification & Access Credentials</span>
                  </h2>
                  <p className="text-xs text-slate-500">Security challenge, statutory letter upload, and Command Center access keys</p>
                </div>

                {/* 1. Email OTP Verification Section */}
                <div className="p-4 rounded-2xl bg-slate-50/60 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      Official Work Email Verification
                    </span>
                    {emailVerificationRequired && emailVerified && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-teal-100 text-teal-800 border border-teal-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                        Email Verified ✓
                      </span>
                    )}
                    {!emailVerificationRequired && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <AlertCircle className="w-3 h-3 text-amber-600" />
                        OTP Verification Paused
                      </span>
                    )}
                  </div>

                  {!emailVerificationRequired && (
                    <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
                      <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Email OTP Verification is temporarily disabled:</span> You may proceed directly with your official work email address. Institutional credentials and statutory documents will still be audited prior to activation.
                      </div>
                    </div>
                  )}

                  {emailVerificationRequired && !emailVerified && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="6-digit OTP"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          className="w-32 px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={isVerifyingOtp || otpCode.length !== 6}
                          className="px-3.5 py-2 text-xs font-bold rounded-xl bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
                        >
                          {isVerifyingOtp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Verify Code'}
                        </button>
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={isSendingOtp || otpTimer > 0}
                          className="px-3 py-2 text-xs font-semibold text-teal-700 hover:underline disabled:text-slate-400"
                        >
                          {otpTimer > 0 ? `Resend in ${otpTimer}s` : otpSent ? 'Resend Code' : 'Send Code'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Statutory Authorization Letter Upload */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Government / Regulatory Authorization Letter <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Upload official appointment gazette notification or supervisory delegation letter (PDF format, maximum 5 MB).
                  </p>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleDocumentFileChange}
                    accept="application/pdf"
                    className="hidden"
                  />

                  {uploadedDocument ? (
                    <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800">{uploadedDocument.documentName}</div>
                          <div className="text-[10px] text-slate-500">
                            {uploadedDocument.fileSize} • Uploaded & Verified
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveDocument}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Remove Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-2xl p-6 text-center cursor-pointer transition-all bg-slate-50/50 hover:bg-teal-50/20"
                    >
                      {isUploadingDoc ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
                          <span className="text-xs font-semibold text-slate-600">Verifying and uploading document...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5">
                          <Upload className="w-6 h-6 text-teal-600" />
                          <span className="text-xs font-bold text-slate-800">
                            Click to select Government / Regulatory Authorization Letter
                          </span>
                          <span className="text-[10px] text-slate-400">PDF only (Max 5 MB) • Private encrypted storage</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. USER ID (CRITICAL: STRICTLY ABOVE CREATE PASSWORD) */}
                <div className="pt-2 border-t border-slate-100 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">
                      Assigned Administrator User ID <span className="text-rose-500">*</span>
                    </label>
                    {isCheckingUsername && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Checking availability...
                      </span>
                    )}
                    {!isCheckingUsername && usernameAvailable === true && (
                      <span className="text-[10px] font-bold text-teal-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-teal-600" /> User ID Available ✓
                      </span>
                    )}
                    {!isCheckingUsername && usernameAvailable === false && (
                      <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-rose-600" /> {usernameMessage}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. officer.rajesh or regulator.sharma"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className={`w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border font-mono transition ${
                        usernameAvailable === true
                          ? 'border-teal-300 bg-teal-50/20'
                          : usernameAvailable === false
                          ? 'border-rose-300 bg-rose-50/20'
                          : 'border-slate-200 bg-slate-50/50'
                      } focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600`}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    This unique User ID will be used alongside your password to sign in to the Command Center.
                  </p>
                </div>

                {/* 4. Create Password & Confirm Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Create Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full pl-9 pr-9 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Confirm Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="w-full pl-9 pr-9 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-500 space-y-1">
                  <span className="font-bold text-slate-700">Password Security Requirements:</span>
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    <span className={formData.password.length >= 8 ? 'text-teal-700 font-bold' : ''}>
                      • At least 8 characters
                    </span>
                    <span className={/[A-Z]/.test(formData.password) ? 'text-teal-700 font-bold' : ''}>
                      • At least 1 uppercase letter
                    </span>
                    <span className={/[a-z]/.test(formData.password) ? 'text-teal-700 font-bold' : ''}>
                      • At least 1 lowercase letter
                    </span>
                    <span className={/[0-9]/.test(formData.password) ? 'text-teal-700 font-bold' : ''}>
                      • At least 1 numeric digit
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: REVIEW & SUBMIT */}
            {currentStep === 4 && (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <BadgeCheck className="w-4 h-4 text-teal-600" />
                    <span>Review & Finalize Regulatory Registration</span>
                  </h2>
                  <p className="text-xs text-slate-500">Please review your information carefully before submitting.</p>
                </div>

                {/* Section 1 Review */}
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs space-y-2">
                  <div className="font-bold text-slate-800 border-b border-slate-200 pb-1 flex justify-between items-center">
                    <span>1. Administrator Information</span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="text-[11px] text-teal-700 hover:underline font-semibold"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500 font-medium">Legal Name:</span>
                      <div className="font-bold text-slate-900">{formData.fullName}</div>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Work Email:</span>
                      <div className="font-mono text-slate-800">{formData.email}</div>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Contact Phone:</span>
                      <div className="font-mono text-slate-800">{formData.phone}</div>
                    </div>
                  </div>
                </div>

                {/* Section 2 Review */}
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs space-y-2">
                  <div className="font-bold text-slate-800 border-b border-slate-200 pb-1 flex justify-between items-center">
                    <span>2. Regulatory Authority</span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="text-[11px] text-teal-700 hover:underline font-semibold"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500 font-medium">Authority:</span>
                      <div className="font-semibold text-slate-900">{formData.regulatoryAuthority}</div>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Department:</span>
                      <div className="font-semibold text-slate-900">{formData.department}</div>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Designation:</span>
                      <div className="font-semibold text-slate-900">{formData.designation}</div>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Employee / Officer ID:</span>
                      <div className="font-mono text-slate-900">{formData.employeeId}</div>
                    </div>
                  </div>
                </div>

                {/* Section 3 Review */}
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs space-y-2">
                  <div className="font-bold text-slate-800 border-b border-slate-200 pb-1 flex justify-between items-center">
                    <span>3. Verification & Credentials</span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="text-[11px] text-teal-700 hover:underline font-semibold"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500 font-medium">Assigned User ID:</span>
                      <div className="font-mono font-bold text-teal-800">{formData.username}</div>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Email Verification:</span>
                      <div>
                        {emailVerified ? (
                          <span className="text-teal-700 font-bold">Verified ✓</span>
                        ) : (
                          <span className="text-amber-800 font-semibold">Verification Paused (Temporary)</span>
                        )}
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-500 font-medium">Authorization Document:</span>
                      <div className="flex items-center gap-1.5 text-slate-800 font-medium mt-0.5">
                        <FileText className="w-3.5 h-3.5 text-teal-600" />
                        <span>{uploadedDocument?.documentName || 'Authorization_Letter.pdf'}</span>
                        <span className="text-[10px] text-slate-400">({uploadedDocument?.fileSize || '5 MB'})</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Password:</span>
                      <div className="font-mono text-slate-400">•••••••• (Protected)</div>
                    </div>
                  </div>
                </div>

                {/* Affirmation Checkbox */}
                <div className="p-3.5 rounded-2xl bg-teal-50/40 border border-teal-200/60 text-xs">
                  <label className="flex items-start gap-2.5 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={declarationAgreed}
                      onChange={(e) => setDeclarationAgreed(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-[11px] leading-relaxed">
                      I solemnly affirm that I am an authorized government / regulatory officer empowered to supervise healthcare logistics. All details and uploaded credentials are true and statutory.
                    </span>
                  </label>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={isSubmitting || !declarationAgreed}
                  className="w-full py-3.5 rounded-2xl bg-ocean-900 hover:bg-ocean-950 text-white text-xs font-bold shadow-lg shadow-ocean-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Administrator Registration...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-teal-400" />
                      <span>Submit Administrator Registration</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Stepper Footer Buttons */}
            {currentStep < 4 && (
              <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                ) : (
                  <div />
                )}

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 flex items-center gap-1.5 transition"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Card Footer Link */}
          <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 text-center text-xs text-slate-500">
            Already registered administrator?{' '}
            <Link to="/admin-login" className="font-bold text-teal-700 hover:underline">
              Sign In to Command Center
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSignupPage;
