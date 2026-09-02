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
  HelpCircle,
  CheckCircle2
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
  const location = useLocation();

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
      <div className="max-w-md w-full space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold shadow-md">
              <Pill className="w-5 h-5 rotate-45" />
            </div>
            <span className="text-2xl font-extrabold text-secondary-900 tracking-tight">
              Smart<span className="text-primary-500">MediShare</span>
            </span>
          </Link>
          <p className="text-xs text-slate-500">
            Sign in to access your hospital inventory & logistics hub
          </p>
        </div>

        {/* 1-Click Demo Quick Logins */}
        <div className="p-3 bg-gradient-to-r from-primary-50 to-teal-50 border border-primary-200/80 rounded-xl text-xs space-y-2">
          <div className="flex items-center justify-between font-bold text-primary-800">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary-600" />
              1-Click Demo Quick Fill
            </span>
            <span className="text-[10px] text-primary-600">Testing Mode</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickDemoFill('apollo')}
              className="px-2 py-1.5 bg-white hover:bg-primary-100/50 rounded-lg text-[11px] font-semibold text-slate-700 border border-slate-200 transition-colors truncate text-center"
            >
              🏥 Apollo Hosp
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoFill('fortis')}
              className="px-2 py-1.5 bg-white hover:bg-primary-100/50 rounded-lg text-[11px] font-semibold text-slate-700 border border-slate-200 transition-colors truncate text-center"
            >
              🏥 Fortis Hosp
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoFill('admin')}
              className="px-2 py-1.5 bg-secondary-800 hover:bg-secondary-900 text-white rounded-lg text-[11px] font-semibold transition-colors truncate text-center"
            >
              🛡️ Super Admin
            </button>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 overflow-hidden">
          
          {/* Tabs */}
          <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50/50 text-xs font-bold">
            <button
              type="button"
              onClick={() => handleTabChange('hospital')}
              className={`py-3.5 flex items-center justify-center gap-2 transition-all ${
                activeTab === 'hospital'
                  ? 'bg-white text-primary-700 border-b-2 border-primary-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Hospital Login</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('admin')}
              className={`py-3.5 flex items-center justify-center gap-2 transition-all ${
                activeTab === 'admin'
                  ? 'bg-white text-secondary-800 border-b-2 border-secondary-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Admin Login</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                {activeTab === 'hospital' ? 'Hospital Official Email' : 'Admin Work Email'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@hospital.org"
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(true)}
                  className="text-[11px] font-semibold text-primary-600 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <span>Remember me on this workstation</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-lg shadow-primary-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-75"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
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
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-600">
            Don't have a verified hospital account?{' '}
            <Link to="/hospital-signup" className="font-bold text-primary-600 hover:underline">
              Sign Up
            </Link>
          </div>

        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        title="Reset Account Password"
        subtitle="We will send a secure token to your verified pharmacy director email"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleForgotSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Registered Work Email</label>
            <input
              type="email"
              required
              placeholder="e.g. director@apollo.org"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setForgotModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm"
            >
              Send Reset Link
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default LoginPage;
