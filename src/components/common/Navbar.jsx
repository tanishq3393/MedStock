import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Pill, 
  ShieldCheck, 
  LogIn, 
  UserPlus, 
  LayoutDashboard, 
  LogOut, 
  Building2, 
  ShieldAlert, 
  Menu, 
  X, 
  ChevronDown,
  Truck,
  Layers,
  Sparkles
} from 'lucide-react';
import { logoutUser } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

export const Navbar = () => {
  const { isAuthenticated, user, role } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success('Logged out successfully');
    navigate('/');
    setUserDropdownOpen(false);
  };

  const dashboardPath = role === 'admin' ? '/admin/dashboard' : '/hospital/dashboard';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center text-white shadow-md shadow-primary-500/20 group-hover:scale-105 transition-transform">
              <Pill className="w-5 h-5 rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-secondary-600">
                  Smart<span className="text-primary-500">MediShare</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary-50 text-primary-700 border border-primary-200">
                  Verified B2B
                </span>
              </div>
              <p className="text-[10px] text-slate-500 -mt-0.5 tracking-wide hidden sm:block">
                Inter-Hospital Logistics & Medicine Exchange
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link to="/" className="hover:text-primary-600 transition-colors">
              Home
            </Link>
            <Link to="/hospital/marketplace" className="hover:text-primary-600 transition-colors flex items-center gap-1">
              <Layers className="w-4 h-4 text-primary-500" />
              Marketplace
            </Link>
            <Link to="/hospital/track" className="hover:text-primary-600 transition-colors flex items-center gap-1">
              <Truck className="w-4 h-4 text-amber-500" />
              Live Track
            </Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-primary-300 bg-slate-50 hover:bg-white text-slate-700 transition-all text-sm shadow-sm"
                >
                  <div className="w-7 h-7 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs">
                    {role === 'admin' ? <ShieldAlert className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold leading-none text-slate-800 truncate max-w-[140px]">
                      {user?.name || 'Account'}
                    </p>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary-600">
                      {role}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {/* User Dropdown */}
                {userDropdownOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-xl border border-slate-100 py-2 z-50 animate-scaleUp"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs text-slate-400">Signed in as</p>
                      <p className="text-xs font-bold text-slate-800 truncate">{user?.email}</p>
                    </div>

                    <Link
                      to={dashboardPath}
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-primary-600 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-primary-500" />
                      Go to {role === 'admin' ? 'Admin Dashboard' : 'Hospital Portal'}
                    </Link>

                    {role === 'hospital' && (
                      <Link
                        to="/hospital/inventory"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-primary-600 transition-colors"
                      >
                        <Pill className="w-4 h-4 text-emerald-500" />
                        My Inventory
                      </Link>
                    )}

                    <div className="my-1 border-t border-slate-100" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-700 hover:text-primary-600 hover:bg-primary-50/60 rounded-lg transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Link>

                <div className="relative group">
                  <Link
                    to="/hospital-signup"
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 shadow-md shadow-primary-500/20 rounded-lg transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                    Join Platform
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-3">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-slate-700 hover:text-primary-600"
          >
            Home
          </Link>
          <Link
            to="/hospital/marketplace"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-slate-700 hover:text-primary-600"
          >
            Marketplace
          </Link>
          <Link
            to="/hospital/track"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-slate-700 hover:text-primary-600"
          >
            Track Shipment
          </Link>

          <div className="pt-4 border-t border-slate-100 space-y-2">
            {isAuthenticated ? (
              <>
                <Link
                  to={dashboardPath}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-primary-600 text-white font-semibold text-sm"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Open Dashboard
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-rose-600 bg-rose-50 font-semibold text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold text-sm"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Link>
                <Link
                  to="/hospital-signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-primary-600 text-white font-semibold text-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  Hospital Sign Up
                </Link>
                <Link
                  to="/admin-signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-secondary-700 text-white font-semibold text-sm"
                >
                  <ShieldAlert className="w-4 h-4" />
                  Admin Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
