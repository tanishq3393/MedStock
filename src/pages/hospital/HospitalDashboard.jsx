import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  Boxes, 
  ShoppingBag, 
  TrendingUp, 
  Percent, 
  ArrowUpRight, 
  ArrowDownRight, 
  AlertTriangle,
  Send,
  PlusCircle,
  Truck,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { fetchHospitalDashboard } from '../../store/slices/hospitalSlice';
import PurchasesBarChart from '../../components/charts/PurchasesBarChart';
import SalesBarChart from '../../components/charts/SalesBarChart';
import ProfitabilityComboChart from '../../components/charts/ProfitabilityComboChart';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const HospitalDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { dashboardData, isLoading } = useSelector((state) => state.hospital);

  useEffect(() => {
    dispatch(fetchHospitalDashboard(user?.id || 'hosp-1'));
  }, [dispatch, user]);

  if (isLoading && !dashboardData) {
    return <LoadingSpinner text="Aggregating Pharmacy Analytics..." />;
  }

  const stats = dashboardData?.stats || {
    totalMedicines: 184,
    monthlyPurchases: 462500,
    monthlySales: 689000,
    profitabilityPercent: 28.4,
    pendingRequestsCount: 2,
    activeShipmentsCount: 2,
  };

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-secondary-900 via-secondary-800 to-primary-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-primary-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Active Hospital Node: Mumbai Metro Cluster</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome, {user?.name || 'Apollo Hospital Pharmacy'}
          </h1>
          <p className="text-xs text-slate-300 max-w-xl">
            Track real-time inventory velocity, near-expiry surplus monetization, and cold-chain inter-hospital logistics.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/hospital/marketplace"
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all flex items-center gap-1.5"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Search Market</span>
          </Link>
          <Link
            to="/hospital/inventory"
            className="px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-400 text-secondary-900 text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Medicine</span>
          </Link>
        </div>
      </div>

      {/* 1. 4 STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Medicines */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500">Total Medicines Stocked</span>
            <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-slate-900">{stats.totalMedicines}</h3>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+12.4% this month</span>
            </div>
          </div>
        </div>

        {/* Card 2: Monthly Purchases */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500">Monthly Purchases</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-slate-900">₹{stats.monthlyPurchases.toLocaleString()}</h3>
            <div className="flex items-center gap-1 text-[11px] text-blue-600 font-semibold mt-1">
              <span>Saved ₹84,200 via Concessions</span>
            </div>
          </div>
        </div>

        {/* Card 3: Monthly Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500">Monthly Sales (Redistributed)</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-slate-900">₹{stats.monthlySales.toLocaleString()}</h3>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+18.5% recovery rate</span>
            </div>
          </div>
        </div>

        {/* Card 4: Profitability % */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500">Profitability %</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-slate-900">{stats.profitabilityPercent}%</h3>
            <div className="flex items-center gap-1 text-[11px] text-amber-600 font-semibold mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+3.2% vs previous quarter</span>
            </div>
          </div>
        </div>

      </div>

      {/* 2. CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Purchases Monthly */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Monthly Purchases Trend</h3>
              <p className="text-xs text-slate-400">Total procurement spend over last 6 months</p>
            </div>
            <span className="text-xs font-bold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-lg">
              Procurement
            </span>
          </div>
          <PurchasesBarChart data={dashboardData?.purchasesMonthly} />
        </div>

        {/* Chart 2: Sales Monthly */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Monthly Sales Trend</h3>
              <p className="text-xs text-slate-400">Near-expiry surplus monetization over last 6 months</p>
            </div>
            <span className="text-xs font-bold text-secondary-700 bg-secondary-50 px-2.5 py-1 rounded-lg">
              Sales Revenue
            </span>
          </div>
          <SalesBarChart data={dashboardData?.salesMonthly} />
        </div>

      </div>

      {/* 3. COMBO CHART: 5-Month Profitability Trend */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-slate-800">5-Month Profitability & Margin Trend</h3>
            <p className="text-xs text-slate-400">Comparative dual-axis visualization of gross revenue, costs, and percentage margin</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              Optimal Operating Range: &gt; 25%
            </span>
          </div>
        </div>
        <ProfitabilityComboChart data={dashboardData?.profitabilityTrend} />
      </div>

    </div>
  );
};

export default HospitalDashboard;
