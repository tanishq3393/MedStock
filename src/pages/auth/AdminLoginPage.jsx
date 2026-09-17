import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
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
  Building2
} from 'lucide-react';
import { loginUser, clearAuthError } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

export const AdminLoginPage = () => {
  const [email, setEmail] = useState('admin@medex.org');
  const [password, setPassword] = useState('Admin@123');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const { isLoading, error } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'MedEx | State Regulator / Administrator Login';
    dispatch(clearAuthError());
  }, [dispatch]);

  const handleDemoLogin = async () => {
    const demoEmail = 'admin@medex.org';
    const demoPassword = 'Admin@123';
    setEmail(demoEmail);
    setPassword(demoPassword);

    try {
      const resultAction = await dispatch(loginUser({ email: demoEmail, password: demoPassword, role: 'admin' }));
      if (loginUser.fulfilled.match(resultAction)) {
        toast.success(`Welcome to MedEx Command Center, ${resultAction.payload.user.name}`);
        navigate('/admin/dashboard', { replace: true });
      } else {
        const payload = resultAction.payload;
        const errorMsg = typeof payload === 'string' ? payload : (payload?.message || 'Administrator authentication failed');
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
      toast.error('Please provide regulatory work email and password');
      return;
    }

    try {
      const resultAction = await dispatch(loginUser({ email, password, role: 'admin' }));
      if (loginUser.fulfilled.match(resultAction)) {
        toast.success(`Welcome to MedEx Command Center, ${resultAction.payload.user.name}`);
        navigate('/admin/dashboard', { replace: true });
      } else {
        const payload = resultAction.payload;
        const errorMsg = typeof payload === 'string' ? payload : (payload?.message || 'Administrator authentication failed');
        toast.error(errorMsg);
      }
    } catch (err) {
      toast.error(err.message || 'Unexpected login error occurred');
    }
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
              Med<span className="text-teal-600">Ex</span>
            </span>
          </Link>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            State Regulator / Administrator Login
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Centralized platform oversight, institutional verification & state regulatory logistics command
          </p>
        </div>

        {/* 1-Click Demo Quick Login (Super Admin only) */}
        <div className="p-3.5 bg-gradient-to-r from-teal-50/80 via-white to-slate-50 border border-teal-200/80 rounded-2xl shadow-sm text-xs space-y-2.5">
          <div className="flex items-center justify-between font-bold text-teal-900">
            <span className="flex items-center gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              1-Click Demo Admin Access
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-teal-100/70 text-teal-800 rounded-full border border-teal-200">
              Evaluator Ready
            </span>
          </div>
          <button
            type="button"
            disabled={isLoading}
            onClick={handleDemoLogin}
            className="w-full px-3 py-2 bg-white hover:bg-teal-50/70 rounded-xl text-[11px] font-bold text-slate-700 border border-slate-200 shadow-sm transition-all hover:border-teal-400 text-center truncate cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-teal-600" />
            <span>🛡️ Super Admin Demo Account (admin@medex.org)</span>
          </button>
        </div>

        {/* Auth Card - Same MedEx visual styling */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 overflow-hidden">
          
          {/* Card Title Banner */}
          <div className="px-6 py-3.5 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <ShieldAlert className="w-4 h-4 text-teal-600" />
              <span>Regulatory Command Center</span>
            </div>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
              Administrator
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Email or User ID Field */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Government Work Email or User ID
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer.rajesh or regulator@fda.gov.in"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all font-medium"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700">Access Key / Password</label>
                <Link
                  to="/forgot-password?role=admin"
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
                  <span>Authenticating Supervisory Token...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Command Center</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Card Footer with link to Admin Registration and Hospital Login */}
          <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
            <span>
              Need supervisory credentials?{' '}
              <Link to="/admin-register" className="font-bold text-teal-700 hover:underline">
                Register as Administrator
              </Link>
            </span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <Link to="/hospital-login" className="text-slate-500 hover:text-teal-800 font-semibold inline-flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Hospital Login</span>
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
};

export default AdminLoginPage;
