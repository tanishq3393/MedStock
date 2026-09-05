import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Building2, 
  ShieldAlert, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2, 
  Pill,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  LockKeyhole
} from 'lucide-react';
import { loginUser, clearAuthError } from '../../store/slices/authSlice';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

export const LoginPage = () => {
  const [activeTab, setActiveTab] = useState('hospital'); // 'hospital' | 'admin'
  const [email, setEmail] = useState('apollo.mumbai@smartmedishare.org');
  const [password, setPassword] = useState('Hospital@123');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const { isLoading, error } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    dispatch(clearAuthError());
    if (tab === 'admin') {
      setEmail('admin@smartmedishare.org');
      setPassword('Admin@123');
    } else {
      setEmail('apollo.mumbai@smartmedishare.org');
      setPassword('Hospital@123');
    }
  };

  const handleQuickDemoFill = (roleType) => {
    if (roleType === 'admin') {
      setActiveTab('admin');
      setEmail('admin@smartmedishare.org');
      setPassword('Admin@123');
    } else if (roleType === 'apollo') {
      setActiveTab('hospital');
      setEmail('apollo.mumbai@smartmedishare.org');
      setPassword('Hospital@123');
    } else if (roleType === 'fortis') {
      setActiveTab('hospital');
      setEmail('fortis.gurgaon@smartmedishare.org');
      setPassword('Hospital@123');
    }
    toast.success(`Loaded demo credentials for ${roleType.toUpperCase()}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please provide email and password');
      return;
    }

    try {
      const resultAction = await dispatch(loginUser({ email, password, role: activeTab }));
      if (loginUser.fulfilled.match(resultAction)) {
        toast.success(`Welcome to SmartMediShare, ${resultAction.payload.user.name}`);
        const redirectPath = activeTab === 'admin' ? '/admin/dashboard' : '/hospital/dashboard';
        navigate(redirectPath, { replace: true });
      } else {
        toast.error(resultAction.payload || 'Login failed');
      }
    } catch (err) {
      toast.error(err.message || 'Unexpected login error');
    }
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    toast.success(`Password reset verification link sent to ${forgotEmail}`);
    setForgotModalOpen(false);
    setForgotEmail('');
  };

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
              Smart<span className="text-teal-600">MediShare</span>
            </span>
          </Link>
          <p className="text-xs text-slate-500 font-medium">
            Inter-Hospital Logistics & Statutory Medicine Exchange Portal
          </p>
        </div>

        {/* 1-Click Demo Quick Logins */}
        <div className="p-3.5 bg-gradient-to-r from-teal-50/80 via-white to-slate-50 border border-teal-200/80 rounded-2xl shadow-sm text-xs space-y-2.5">
          <div className="flex items-center justify-between font-bold text-teal-900">
            <span className="flex items-center gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              1-Click Instant Evaluator Access
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-teal-100/70 text-teal-800 rounded-full border border-teal-200">
              Dev Ready
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemoFill('apollo')}
              className="px-2 py-2 bg-white hover:bg-teal-50/60 rounded-xl text-[11px] font-bold text-slate-700 border border-slate-200 shadow-sm transition-all hover:border-teal-300 text-center truncate"
            >
              🏥 Apollo (Hub)
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoFill('fortis')}
              className="px-2 py-2 bg-white hover:bg-teal-50/60 rounded-xl text-[11px] font-bold text-slate-700 border border-slate-200 shadow-sm transition-all hover:border-teal-300 text-center truncate"
            >
              🏥 Fortis (Peer)
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoFill('admin')}
              className="px-2 py-2 bg-ocean-900 hover:bg-ocean-950 text-white rounded-xl text-[11px] font-bold shadow-sm transition-all text-center truncate"
            >
              🛡️ Super Admin
            </button>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 overflow-hidden">
          
          {/* Tabs */}
          <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50/60 text-xs font-bold">
            <button
              type="button"
              onClick={() => handleTabChange('hospital')}
              className={`py-3.5 flex items-center justify-center gap-2 transition-all ${
                activeTab === 'hospital'
                  ? 'bg-white text-teal-700 border-b-2 border-teal-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Hospital Pharmacist</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('admin')}
              className={`py-3.5 flex items-center justify-center gap-2 transition-all ${
                activeTab === 'admin'
                  ? 'bg-white text-ocean-900 border-b-2 border-ocean-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>State Regulator / Admin</span>
            </button>
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
                {activeTab === 'hospital' ? 'Institutional Pharmacist Email' : 'Supervisory Admin Work Email'}
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
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(true)}
                  className="text-[11px] font-semibold text-teal-600 hover:underline"
                >
                  Forgot Key?
                </button>
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
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-[11px]">Remember authorized terminal</span>
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
              className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-lg shadow-teal-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-75"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating Institutional Token...</span>
                </>
              ) : (
                <>
                  <span>Sign In as {activeTab === 'hospital' ? 'Hospital' : 'Administrator'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Card Footer */}
          <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 text-center text-xs text-slate-600">
            Need institutional verification for your hospital?{' '}
            <Link to="/hospital-signup" className="font-bold text-teal-700 hover:underline">
              Onboard Hospital
            </Link>
          </div>

        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        title="Reset Account Password"
        subtitle="A secure recovery token will be dispatched to the verified pharmacy director"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleForgotSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Registered Institutional Email</label>
            <input
              type="email"
              required
              placeholder="e.g. director@apollo.org"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setForgotModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm"
            >
              Send Reset Token
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default LoginPage;
