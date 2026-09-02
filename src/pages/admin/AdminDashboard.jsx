import React, { useEffect } from 'react';
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
  Award
} from 'lucide-react';
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

  if (isLoading && !dashboardData) {
    return <LoadingSpinner text="Compiling National Platform Analytics..." />;
  }

  const stats = dashboardData?.stats || {
    totalHospitals: 48,
    monthlyTransfers: 324,
    totalMedicinesTransferred: 18450,
    totalPlatformVolume: '₹ 2.14 Cr',
  };

  return (
    <div className="space-y-6">
      
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-secondary-950 via-secondary-900 to-[#0A3D44] rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-primary-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>National Drug Redistribution Command Center</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">System Supervisory Dashboard</h1>
          <p className="text-xs text-slate-300 max-w-xl">
            Real-time multi-state metrics on cold chain transport, surplus medicine redistribution velocity, and statutory compliance.
          </p>
        </div>
      </div>

      {/* 1. 3 STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Total Hospitals */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500">Total Registered Hospitals</span>
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-slate-900">{stats.totalHospitals}</h3>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>4 new hospitals pending verification</span>
            </div>
          </div>
        </div>

        {/* Card 2: Monthly Transfers */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500">Monthly Inter-Hospital Transfers</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <RefreshCw className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-slate-900">{stats.monthlyTransfers}</h3>
            <div className="flex items-center gap-1 text-[11px] text-blue-600 font-semibold mt-1">
              <span>98.8% on-time fulfillment rate</span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Medicines Transferred */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500">Total Medicines Transferred (Units)</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-slate-900">{stats.totalMedicinesTransferred.toLocaleString()}</h3>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>₹2.14 Cr waste eliminated</span>
            </div>
          </div>
        </div>

      </div>

      {/* 2. CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Transfer Trends (last 6 months) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Medicine Transfer Trend</h3>
              <p className="text-xs text-slate-400">Inter-hospital consignments over last 6 months</p>
            </div>
            <span className="text-xs font-bold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-lg">
              6-Month Velocity
            </span>
          </div>
          <TransfersBarChart data={dashboardData?.transferTrends} />
        </div>

        {/* Chart 2: System Performance Metrics */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900">System Performance & SLA Metrics</h3>
              <p className="text-xs text-slate-400">Comparing operational fulfillment against target benchmark</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
              SLA Audit
            </span>
          </div>
          <PerformanceBarChart data={dashboardData?.systemPerformance} />
        </div>

      </div>

      {/* 3. TOP 10 HOT SELLING MEDICINES CHART */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Top 10 Hot Selling Medicines (Rule-Based Analytics)</h3>
            <p className="text-xs text-slate-400">High-velocity emergency and oncology pharmaceuticals with highest redistribution turnover</p>
          </div>
          <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
            High Demand Formulations
          </span>
        </div>
        <HotMedicinesBarChart data={dashboardData?.topHotMedicines} />
      </div>

    </div>
  );
};

export default AdminDashboard;
