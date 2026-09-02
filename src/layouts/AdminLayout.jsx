import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import { ShieldAlert, FileCheck2, Activity, Users } from 'lucide-react';

export const AdminLayout = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />

      {/* Admin Meta Bar */}
      <div className="bg-secondary-900 text-white px-4 sm:px-8 py-3.5 shadow-md border-b border-secondary-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary-700 border border-secondary-600 text-primary-400 flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  {user?.name || 'Super Administrator'}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary-500/20 text-primary-300 border border-primary-500/30 uppercase tracking-wider">
                  Platform Admin
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Department: <span className="text-white font-medium">{user?.department || 'National Healthcare Logistics Oversight'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Link
              to="/admin/verification"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              Verification Queue
            </Link>
            <Link
              to="/admin/management"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-secondary-700 hover:bg-secondary-800 text-slate-200 text-xs font-semibold transition-all"
            >
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              Logistics Monitor
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

        {/* Mobile Nav */}
        <div className="md:hidden bg-white border-b border-slate-200 overflow-x-auto p-2 flex gap-1">
          <Link to="/admin/dashboard" className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 whitespace-nowrap">Overview</Link>
          <Link to="/admin/medicine-data" className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 whitespace-nowrap">Medicines</Link>
          <Link to="/admin/hospital-details" className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 whitespace-nowrap">Hospitals</Link>
          <Link to="/admin/verification" className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 whitespace-nowrap">Verifications</Link>
          <Link to="/admin/management" className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 whitespace-nowrap">Logistics</Link>
          <Link to="/admin/feedback" className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 whitespace-nowrap">Feedbacks</Link>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
