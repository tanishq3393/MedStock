import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import StatusBadge from '../components/common/StatusBadge';
import { Building2, PlusCircle, Search, ShieldCheck, AlertCircle } from 'lucide-react';

export const HospitalLayout = () => {
  const { user } = useSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />

      {/* Top Hospital Meta Header */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 border border-primary-200 text-primary-700 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-secondary-600">
                  {user?.name || 'Apollo Hospital'}
                </h2>
                <StatusBadge status={user?.status || 'verified'} />
              </div>
              <p className="text-xs text-slate-500">
                Reg: <span className="font-mono text-slate-700">{user?.registrationNo || 'MH-MUM-2018-8821'}</span> • {user?.city || 'Mumbai'}, {user?.state || 'Maharashtra'}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Link
              to="/hospital/marketplace"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-300 hover:border-primary-400 bg-white text-xs font-semibold text-slate-700 hover:text-primary-600 transition-all shadow-sm"
            >
              <Search className="w-3.5 h-3.5 text-primary-500" />
              Browse Market
            </Link>
            <Link
              to="/hospital/inventory"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Manage Stock
            </Link>
          </div>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar role="hospital" />
        </div>

        {/* Mobile Horizontal Navigation */}
        <div className="md:hidden bg-white border-b border-slate-200 overflow-x-auto p-2 flex gap-1">
          <Link to="/hospital/dashboard" className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 whitespace-nowrap">Dashboard</Link>
          <Link to="/hospital/inventory" className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 whitespace-nowrap">Inventory</Link>
          <Link to="/hospital/marketplace" className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 whitespace-nowrap">Market</Link>
          <Link to="/hospital/my-requests" className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 whitespace-nowrap">My Requests</Link>
          <Link to="/hospital/incoming-requests" className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 whitespace-nowrap">Incoming</Link>
          <Link to="/hospital/track" className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 whitespace-nowrap">Track</Link>
          <Link to="/hospital/history" className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 whitespace-nowrap">History</Link>
          <Link to="/hospital/payment-history" className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 whitespace-nowrap">Payments</Link>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default HospitalLayout;
