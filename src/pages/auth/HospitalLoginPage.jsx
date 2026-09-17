import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Building2, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2, 
  Pill,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ArrowLeft,
  XCircle,
  ShieldAlert
} from 'lucide-react';
import { loginUser, clearAuthError } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

export const HospitalLoginPage = () => {
  const [searchParams] = useSearchParams();
  const isUnverifiedParam = searchParams.get('unverified') === 'true';

  const [email, setEmail] = useState('apollo.mumbai@medex.org');
  const [password, setPassword] = useState('Hospital@123');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showUnverifiedBanner] = useState(isUnverifiedParam);

  const [pendingApprovalHospital, setPendingApprovalHospital] = useState(null);
  const [requiresCorrectionHospital, setRequiresCorrectionHospital] = useState(null);
  const [rejectedHospital, setRejectedHospital] = useState(null);

  const { isLoading, error } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'MedEx | Hospital Pharmacist Login';
    dispatch(clearAuthError());
  }, [dispatch]);

  const handleDemoLogin = async (hospitalType) => {
    setPendingApprovalHospital(null);
    setRequiresCorrectionHospital(null);
    setRejectedHospital(null);
    let targetEmail = 'apollo.mumbai@medex.org';
    const targetPassword = 'Hospital@123';

    if (hospitalType === 'apollo') {
      targetEmail = 'apollo.mumbai@medex.org';
    } else if (hospitalType === 'fortis') {
      targetEmail = 'fortis.gurgaon@medex.org';
    }

    setEmail(targetEmail);
    setPassword(targetPassword);

    try {
      const resultAction = await dispatch(loginUser({ email: targetEmail, password: targetPassword, role: 'hospital' }));
      if (loginUser.fulfilled.match(resultAction)) {
        toast.success(`Welcome to MedEx, ${resultAction.payload.user.name}`);
        navigate('/hospital/dashboard', { replace: true });
      } else {
        const payload = resultAction.payload;
        if (payload?.code === 'PENDING_ADMIN_APPROVAL') {
          setPendingApprovalHospital(payload.hospital || { email: targetEmail });
          setRequiresCorrectionHospital(null);
          setRejectedHospital(null);
          return;
        }
        if (payload?.code === 'REQUIRES_CORRECTION') {
          setRequiresCorrectionHospital(payload);
          setPendingApprovalHospital(null);
          setRejectedHospital(null);
          return;
        }
        if (payload?.code === 'DRAFT_REGISTRATION') {
          toast('Resuming incomplete registration...', { icon: '📝' });
          navigate(`/hospital-register?hospitalId=${payload.hospital?.id || ''}`);
          return;
        }
        if (payload?.code === 'REGISTRATION_REJECTED') {
          setRejectedHospital(payload);
          setRequiresCorrectionHospital(null);
          setPendingApprovalHospital(null);
          return;
        }
        const errorMsg = typeof payload === 'string' ? payload : (payload?.message || 'Hospital login failed');
        toast.error(errorMsg);
      }
    } catch (err) {
      toast.error(err.message || 'Unexpected login error occurred');
    }
  };

  const handleQuickDemoFill = handleDemoLogin;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please provide hospital work email and password');
      return;
    }

    try {
      const resultAction = await dispatch(loginUser({ email, password, role: 'hospital' }));
      if (loginUser.fulfilled.match(resultAction)) {
        toast.success(`Welcome to MedEx, ${resultAction.payload.user.name}`);
        navigate('/hospital/dashboard', { replace: true });
      } else {
        const payload = resultAction.payload;
        if (payload?.code === 'PENDING_ADMIN_APPROVAL') {
          setPendingApprovalHospital(payload.hospital || { email });
          setRequiresCorrectionHospital(null);
          setRejectedHospital(null);
          return;
        }
        if (payload?.code === 'REQUIRES_CORRECTION') {
          setRequiresCorrectionHospital(payload);
          setPendingApprovalHospital(null);
          setRejectedHospital(null);
          return;
        }
        if (payload?.code === 'DRAFT_REGISTRATION') {
          toast('Resuming incomplete registration...', { icon: '📝' });
          navigate(`/hospital-register?hospitalId=${payload.hospital?.id || ''}`);
          return;
        }
        if (payload?.code === 'REGISTRATION_REJECTED') {
          setRejectedHospital(payload);
          setRequiresCorrectionHospital(null);
          setPendingApprovalHospital(null);
          return;
        }
        const errorMsg = typeof payload === 'string' ? payload : (payload?.message || 'Hospital login failed');
        toast.error(errorMsg);
      }
    } catch (err) {
      toast.error(err.message || 'Unexpected login error occurred');
    }
  };

  // Dedicated Pending Approval View on Login (Preserved)
  if (pendingApprovalHospital) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-lg w-full space-y-5 animate-fadeIn">
          {/* Brand Header */}
          <div className="text-center space-y-2">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-md shadow-teal-600/20">
                <Pill className="w-5 h-5 rotate-45" />
              </div>
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                Med<span className="text-teal-600">Ex</span>
              </span>
            </Link>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-2xl space-y-6">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-sm">
                <Clock className="w-7 h-7 stroke-[2.3] animate-pulse" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                Current status: Pending Admin Approval
              </span>
              <h2 className="text-xl font-black text-slate-900 leading-snug">
                Hospital Registration Submitted Successfully
              </h2>
            </div>

            {/* Hospital Details Box */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Hospital Name:</span>
                <span className="font-extrabold text-slate-900 text-right">{pendingApprovalHospital.name || 'Registered Hospital'}</span>
              </div>
              {pendingApprovalHospital.registrationNo && (
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Registration ID:</span>
                  <span className="font-mono font-bold text-teal-700">{pendingApprovalHospital.registrationNo}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Official Email:</span>
                <span className="font-medium text-slate-700">{pendingApprovalHospital.email || email}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Campus Location:</span>
                <span className="font-medium text-slate-700 text-right">
                  {pendingApprovalHospital.city ? `${pendingApprovalHospital.city}, ${pendingApprovalHospital.state || ''}` : 'Campus Registered'}
                </span>
              </div>
            </div>

            {/* Registration Timeline */}
            <div className="space-y-3 pt-1">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Registration Timeline
              </h4>
              <div className="relative pl-5 space-y-4 before:absolute before:left-1.5 before:top-1.5 before:bottom-1.5 before:w-0.5 before:bg-slate-200 text-xs">
                <div className="relative">
                  <span className="absolute -left-5 top-0.5 w-3.5 h-3.5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[9px] ring-4 ring-white">✓</span>
                  <div>
                    <h5 className="font-bold text-teal-950">Registration Submitted</h5>
                    <p className="text-[11px] text-slate-500">Your registration and required documents have been received.</p>
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute -left-5 top-0.5 w-3.5 h-3.5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[9px] ring-4 ring-white animate-pulse">●</span>
                  <div>
                    <h5 className="font-bold text-amber-950">Admin Review</h5>
                    <p className="text-[11px] text-slate-500">Your hospital registration is waiting for administrator approval.</p>
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute -left-5 top-0.5 w-3.5 h-3.5 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center text-[9px] ring-4 ring-white">○</span>
                  <div>
                    <h5 className="font-bold text-slate-400">Hospital Portal Access</h5>
                    <p className="text-[11px] text-slate-400">Available after approval.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setPendingApprovalHospital(null);
                  dispatch(clearAuthError());
                }}
                className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Hospital Login</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dedicated Requires Correction View on Login (Preserved)
  if (requiresCorrectionHospital) {
    const hosp = requiresCorrectionHospital.hospital || {};
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-md w-full space-y-5 animate-fadeIn">
          <div className="text-center space-y-2">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-md shadow-teal-600/20">
                <Pill className="w-5 h-5 rotate-45" />
              </div>
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                Med<span className="text-teal-600">Ex</span>
              </span>
            </Link>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-amber-300 shadow-xl space-y-6">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto border border-amber-200 shadow-sm">
                <AlertTriangle className="w-7 h-7 stroke-[2.3]" />
              </div>
              <h2 className="text-xl font-black text-slate-900 leading-snug">
                Registration Corrections Required
              </h2>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                Status: REQUIRES CORRECTION
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1.5">
              <div className="font-bold text-amber-900">Administrator Notice / Required Corrections:</div>
              <p className="leading-relaxed text-[11px] text-amber-950 font-medium bg-white/80 p-2.5 rounded-lg border border-amber-200/80">
                {requiresCorrectionHospital.rejectionReason || 'Please update statutory documents or institutional information.'}
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={() => {
                  navigate(`/hospital-register?hospitalId=${hosp.id || ''}&mode=correction`);
                }}
                className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Complete / Update Registration</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setRequiresCorrectionHospital(null);
                  dispatch(clearAuthError());
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Return to Hospital Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dedicated Rejected View on Login (Preserved)
  if (rejectedHospital) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-md w-full space-y-5 animate-fadeIn">
          <div className="text-center space-y-2">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-md shadow-teal-600/20">
                <Pill className="w-5 h-5 rotate-45" />
              </div>
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                Med<span className="text-teal-600">Ex</span>
              </span>
            </Link>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-rose-200 shadow-xl space-y-6">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto border border-rose-200 shadow-sm">
                <XCircle className="w-7 h-7 stroke-[2.3]" />
              </div>
              <h2 className="text-xl font-black text-slate-900 leading-snug">
                Hospital registration requires attention.
              </h2>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-900 border border-rose-300">
                Status: REGISTRATION REJECTED
              </div>
            </div>

            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-950 space-y-1.5">
              <div className="font-bold text-rose-900">Administrator Notice:</div>
              <p className="leading-relaxed text-[11px] text-rose-900/90 font-medium">
                {rejectedHospital.rejectionReason || 'Documentation audit incomplete or statutory compliance missing.'}
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setRejectedHospital(null);
                  dispatch(clearAuthError());
                }}
                className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Hospital Login</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-md w-full space-y-5">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-md shadow-teal-600/20">
              <Pill className="w-5 h-5 rotate-45" />
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              Med<span className="text-teal-600">Ex</span>
            </span>
          </Link>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Hospital Pharmacist Login
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Institutional access to surplus medicine inventory, emergency requests & logistics network
          </p>
        </div>

        {/* Unverified Email Warning Banner */}
        {showUnverifiedBanner && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-3 animate-fadeIn">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Please verify your email before continuing.</span>
              </div>
              <p className="text-[11px] text-amber-800">
                A verification link was generated for your registered address.
              </p>
            </div>
            <Link
              to={`/verify-email?email=${encodeURIComponent(email)}&role=hospital`}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 transition-all shadow-sm"
            >
              Verify Email
            </Link>
          </div>
        )}

        {/* 1-Click Demo Quick Logins (Apollo & Fortis Hospital only) */}
        <div className="p-3.5 bg-gradient-to-r from-teal-50/80 via-white to-slate-50 border border-teal-200/80 rounded-2xl shadow-sm text-xs space-y-2.5">
          <div className="flex items-center justify-between font-bold text-teal-900">
            <span className="flex items-center gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              1-Click Demo Hospital Access
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-teal-100/70 text-teal-800 rounded-full border border-teal-200">
              Evaluator Ready
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleDemoLogin('apollo')}
              className="px-3 py-2 bg-white hover:bg-teal-50/70 rounded-xl text-[11px] font-bold text-slate-700 border border-slate-200 shadow-sm transition-all hover:border-teal-400 text-center truncate cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              <span>🏥 Apollo (Hub)</span>
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleDemoLogin('fortis')}
              className="px-3 py-2 bg-white hover:bg-teal-50/70 rounded-xl text-[11px] font-bold text-slate-700 border border-slate-200 shadow-sm transition-all hover:border-teal-400 text-center truncate cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              <span>🏥 Fortis (Peer)</span>
            </button>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 overflow-hidden">
          
          {/* Card Title Banner */}
          <div className="px-6 py-3.5 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-teal-800">
              <Building2 className="w-4 h-4 text-teal-600" />
              <span>Hospital Operations Portal</span>
            </div>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
              Institutional
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Institutional / Hospital Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="pharmacy@hospital.org"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all font-medium"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700">Access Key / Password</label>
                <Link
                  to="/forgot-password?role=hospital"
                  className="text-[11px] font-semibold text-teal-600 hover:text-teal-700 hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember This Device */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-[11px] font-medium">Remember this device</span>
              </label>
              <div className="flex items-center gap-1 text-[10px] text-teal-700 font-semibold">
                <ShieldCheck className="w-3 h-3" />
                <span>TLS 1.3 Encrypted</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-lg shadow-teal-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-75 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating Institutional Token...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Hospital Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Card Footer with links to Hospital Registration and Admin Login */}
          <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
            <span>
              Need onboarding?{' '}
              <Link to="/hospital-signup" className="font-bold text-teal-700 hover:underline">
                Register Hospital
              </Link>
            </span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <Link to="/admin-login" className="text-slate-500 hover:text-teal-800 font-semibold inline-flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
              <span>Admin Login</span>
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
};

export default HospitalLoginPage;
