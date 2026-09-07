import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Building2, 
  RefreshCw, 
  Boxes, 
  TrendingUp, 
  ShieldCheck, 
  Activity, 
  ArrowUpRight, 
  AlertCircle,
  Award,
  ThermometerSnowflake,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchAdminDashboard } from '../../store/slices/adminSlice';
import TransfersBarChart from '../../components/charts/TransfersBarChart';
import PerformanceBarChart from '../../components/charts/PerformanceBarChart';
import HotMedicinesBarChart from '../../components/charts/HotMedicinesBarChart';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { dashboardData, isLoading } = useSelector((state) => state.admin);

  useEffect(() => {
    dispatch(fetchAdminDashboard());
  }, [dispatch]);

  const stats = dashboardData?.stats || {
    totalHospitals: 48,
    monthlyTransfers: 324,
    totalMedicinesTransferred: 18450,
    totalPlatformVolume: '₹ 2.14 Cr',
  };

  if (isLoading && !dashboardData) {
    return (
      <div className="py-20">
        <LoadingSpinner text="Compiling National Platform Analytics & CDSCO Audit Ledger..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-ocean-950 via-ocean-900 to-teal-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-[radial-gradient(ellipse_at_top_right,rgba(10,110,121,0.3),transparent_70%)] pointer-events-none" />
        
        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-bold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>National Drug Redistribution Command Center (Mumbai-Pune Regional Hub)</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">System Supervisory Dashboard</h1>
          <p className="text-xs text-slate-300 max-w-xl font-normal leading-relaxed">
            Real-time multi-state metrics on cold chain logistics telemetry, surplus medicine velocity, and statutory compliance audit under CDSCO Rule 65.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <Link
            to="/admin/verification"
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-lg shadow-teal-600/20 transition-all flex items-center gap-1.5"
          >
            <span>Review Audit Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 4 STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Hospitals */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Registered Hospitals</span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 font-mono">{stats.totalHospitals} Institutions</h3>
            <div className="flex items-center gap-1 text-[10px] text-teal-700 font-bold mt-1">
              <ArrowUpRight className="w-3 h-3" />
              <span>{stats.pendingVerifications ?? 0} awaiting statutory verification</span>
            </div>
          </div>
        </div>

        {/* Card 2: Monthly Transfers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Exchange Operations</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center">
              <RefreshCw className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 font-mono">{stats.monthlyTransfers} Requests</h3>
            <div className="flex items-center gap-1 text-[10px] text-blue-700 font-bold mt-1">
              <span>{stats.avgFulfillmentRate || '99.2%'} fulfillment rate</span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Medicines Transferred */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Medicine Units Saved</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 font-mono">{Number(stats.totalMedicinesTransferred || 0).toLocaleString('en-IN')} Units</h3>
            <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold mt-1">
              <ArrowUpRight className="w-3 h-3" />
              <span>{stats.totalPlatformVolume || '₹2.14 Cr'} platform volume</span>
            </div>
          </div>
        </div>

        {/* Card 4: Cold Chain Assurance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Cold Chain SLA</span>
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 text-sky-700 flex items-center justify-center">
              <ThermometerSnowflake className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 font-mono">100% In-Range</h3>
            <div className="flex items-center gap-1 text-[10px] text-sky-700 font-bold mt-1">
              <span>2°C - 8°C Zero temperature breach (Demo Simulator)</span>
            </div>
          </div>
        </div>

      </div>

      {/* 2. CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Transfer Trends (last 6 months) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-black text-slate-900">Inter-Hospital Transfer Trend</h3>
              <p className="text-xs text-slate-400">Consignment volume completed across urban healthcare clusters</p>
            </div>
            <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
              6-Month Ledger
            </span>
          </div>
          <TransfersBarChart data={dashboardData?.transferTrends} />
        </div>

        {/* Chart 2: System Performance Metrics */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-black text-slate-900">Platform SLA & Regulatory Performance</h3>
              <p className="text-xs text-slate-400">Comparing real-time dispatch vs. statutory compliance benchmarks</p>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              CDSCO Target: 98%
            </span>
          </div>
          <PerformanceBarChart data={dashboardData?.systemPerformance} />
        </div>

      </div>

      {/* 3. TOP 10 HOT SELLING MEDICINES CHART */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-black text-slate-900">Top 10 High-Velocity Critical Medicines</h3>
            <p className="text-xs text-slate-400">Highest redistribution turnaround across emergency trauma, oncology, and surgical intensive care units</p>
          </div>
          <span className="text-[10px] font-extrabold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
            Rule-Based Allocation Intelligence
          </span>
        </div>
        <HotMedicinesBarChart data={dashboardData?.topHotMedicines} />
      </div>

    </div>
  );
};

export default AdminDashboard;
