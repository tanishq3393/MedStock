import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import { ShieldAlert, FileCheck2, Activity, Radio, ShieldCheck } from 'lucide-react';

export const AdminLayout = () => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();

  const adminMobileItems = [
    { to: '/admin/dashboard', label: 'Supervisory' },
    { to: '/admin/medicine-data', label: 'Medicines' },
    { to: '/admin/hospital-details', label: 'Hospital Registry' },
    { to: '/admin/verification', label: 'Verification' },
    { to: '/admin/management', label: 'Logistics' },
    { to: '/admin/feedback', label: 'Feedbacks' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />

      {/* Admin Meta Bar */}
      <div className="bg-secondary-950 text-white px-4 sm:px-8 py-3 shadow-md border-b border-secondary-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary-800 border border-secondary-700 text-cyan-400 flex items-center justify-center font-bold shadow-sm">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                  {user?.name || 'Supervisory Administration Panel'}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary-500/20 text-cyan-300 border border-primary-500/30 uppercase tracking-wider">
                  STATUTORY AUTHORITY
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Oversight: <span className="text-slate-200 font-medium">{user?.department || 'Inter-Hospital Redistribution & Cold-Chain Monitoring'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-mono text-cyan-300">
              <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span>SUPERVISORY TELEMETRY: ONLINE</span>
            </div>

            <Link
              to="/admin/verification"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold shadow-md shadow-primary-600/20 transition-all"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Verification Queue</span>
            </Link>

            <Link
              to="/admin/management"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-secondary-700 hover:bg-secondary-800 text-slate-200 text-xs font-bold transition-all"
            >
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>Logistics Monitor</span>
            </Link>
          </div>

        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar role="admin" />
        </div>

        {/* Mobile Navigation Rail */}
        <div className="md:hidden bg-white border-b border-slate-200 overflow-x-auto p-2 flex gap-1.5 shadow-inner">
          {adminMobileItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-secondary-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 overflow-y-auto">
          <Outlet />
        </main>
      </div>

    </div>
  );
};

export default AdminLayout;
