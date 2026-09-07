import React, { useState, useEffect } from 'react';
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
  ShieldCheck,
  Calendar,
  Filter,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Layers,
  Activity
} from 'lucide-react';
import { fetchHospitalDashboard } from '../../store/slices/hospitalSlice';
import PurchasesBarChart from '../../components/charts/PurchasesBarChart';
import SalesBarChart from '../../components/charts/SalesBarChart';
import ProfitabilityComboChart from '../../components/charts/ProfitabilityComboChart';
import FloatingNetworkHero from '../../components/spatial/FloatingNetworkHero';
import SpatialInventoryOverview from '../../components/spatial/SpatialInventoryOverview';
import LiveSupplyNetworkMap from '../../components/spatial/LiveSupplyNetworkMap';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const HospitalDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { dashboardData, isLoading } = useSelector((state) => state.hospital);

  const [timeRange, setTimeRange] = useState('6M'); // 7D | 30D | 3M | 6M | 1Y

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchHospitalDashboard(user.id));
    }
  }, [dispatch, user?.id]);

  if (isLoading && !dashboardData) {
    return <LoadingSpinner text="Compiling Pharmacy Supply Chain Telemetry..." />;
  }

  const stats = dashboardData?.stats || {
    totalMedicines: 0,
    activeSkus: 0,
    monthlyPurchases: 0,
    monthlySales: 0,
    profitabilityPercent: 0,
    pendingRequestsCount: 0,
    activeShipmentsCount: 0,
  };

  return (
    <div className="space-y-7 pb-10">
      
      {/* 1. SOPHISTICATED SPATIAL HERO */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#091522] via-[#0E2433] to-[#0A1B28] p-6 sm:p-8 text-white border border-primary-500/25 shadow-2xl overflow-hidden">
        {/* Glow backdrop illumination */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-grid-dark opacity-25 pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Hero Narrative */}
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/20 border border-primary-400/30 text-cyan-300 text-xs font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>HOSPITAL SUPPLY INTELLIGENCE • MUMBAI CLUSTER</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Your Hospital Supply, <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-emerald-300">
                Connected.
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed max-w-xl">
              Monitor inventory in real-time, discover verified medicine exchanges, recover near-expiry stock with automated discount concessions, and coordinate cold-chain logistics across peer hospitals.
            </p>

            {/* Two Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/hospital/marketplace"
                className="px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-400 text-secondary-950 font-extrabold text-xs shadow-lg shadow-primary-500/30 transition-all flex items-center gap-2 hover:scale-[1.02]"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Browse Marketplace</span>
              </Link>

              <Link
                to="/hospital/inventory"
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/20 transition-all flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4 text-cyan-300" />
                <span>Manage Inventory</span>
              </Link>
            </div>

            {/* Quick Metrics Bar */}
            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center gap-6 text-xs text-slate-400 font-mono">
              <div>
                <span className="text-[10px] uppercase text-slate-500 block">Verified Peer Nodes</span>
                <span className="text-slate-200 font-bold">48 Hospitals Active</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-500 block">Cold Chain SLA</span>
                <span className="text-emerald-400 font-bold">99.8% Compliant</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-500 block">Wastage Eradication</span>
                <span className="text-cyan-300 font-bold">₹2.14 Cr Saved</span>
              </div>
            </div>
          </div>

          {/* Right Hero 3D Digital Logistics Network */}
          <div className="lg:col-span-6 w-full">
            <FloatingNetworkHero />
          </div>

        </div>
      </div>

      {/* 2. DYNAMIC KPI SYSTEM (Not 4 identical cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: PRIMARY - TOTAL MEDICINES (With miniature 3D inventory stack) */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-primary-900 to-secondary-900 text-white border border-primary-500/30 shadow-elevated flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-cyan-400/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase font-bold text-cyan-300 tracking-wider">
                Total Stocked Units
              </span>
              <div className="w-8 h-8 rounded-lg bg-white/10 text-cyan-300 flex items-center justify-center">
                <Boxes className="w-4 h-4" />
              </div>
            </div>

            <div className="pt-2">
              <div className="text-3xl font-extrabold font-mono tracking-tight text-white">
                {stats?.totalMedicines?.toLocaleString() || 0} <span className="text-sm font-normal text-slate-300">units</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold mt-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>{stats?.activeSkus ?? 0} active listed SKUs</span>
              </div>
            </div>
          </div>

          {/* Miniature 3D Warehouse Stack Visualizer */}
          <div className="pt-4 mt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-300">
            <div className="flex gap-1 items-end h-5">
              <span className="w-1.5 h-3 bg-cyan-400 rounded-t" />
              <span className="w-1.5 h-4 bg-teal-400 rounded-t" />
              <span className="w-1.5 h-5 bg-emerald-400 rounded-t" />
              <span className="w-1.5 h-3 bg-amber-400 rounded-t" />
              <span className="w-1.5 h-4 bg-primary-400 rounded-t" />
            </div>
            <span className="text-slate-400">Shipments: {stats?.activeShipmentsCount ?? 0} Active</span>
          </div>
        </div>

        {/* KPI 2: MONTHLY PROCUREMENT */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-mono uppercase font-bold text-slate-500 tracking-wider">
                Monthly Procurement
              </span>
              <div className="text-2xl font-extrabold font-mono tracking-tight text-slate-900 mt-1">
                ₹{stats?.monthlyPurchases?.toLocaleString() || 0}
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 font-semibold space-y-0.5">
            <div className="flex items-center gap-1 font-bold text-blue-700">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Concession Savings</span>
            </div>
            <p className="text-[11px] text-blue-800">
              Automated shelf-life discounts applied
            </p>
          </div>
        </div>

        {/* KPI 3: REDISTRIBUTION REVENUE */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-mono uppercase font-bold text-slate-500 tracking-wider">
                Redistribution Revenue
              </span>
              <div className="text-2xl font-extrabold font-mono tracking-tight text-slate-900 mt-1">
                ₹{stats?.monthlySales?.toLocaleString() || 0}
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-900 font-semibold space-y-0.5">
            <div className="flex items-center gap-1 font-bold text-emerald-700">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
              <span>Capital Recovered</span>
            </div>
            <p className="text-[11px] text-emerald-800">
              {stats?.pendingRequestsCount ?? 0} incoming peer requests pending
            </p>
          </div>
        </div>

        {/* KPI 4: PROFITABILITY % */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-mono uppercase font-bold text-slate-500 tracking-wider">
                Operating Margin
              </span>
              <div className="text-2xl font-extrabold font-mono tracking-tight text-slate-900 mt-1">
                {stats?.profitabilityPercent ?? 0}%
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100 text-xs text-amber-900 font-semibold space-y-0.5">
            <div className="flex items-center gap-1 font-bold text-amber-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Target Efficiency</span>
            </div>
            <p className="text-[11px] text-amber-800">
              Zero-waste exchange redistribution
            </p>
          </div>
        </div>

      </div>

      {/* 3. SPATIAL INVENTORY WAREHOUSE VISUALIZATION */}
      <SpatialInventoryOverview />

      {/* 4. DATA VISUALIZATION SECTION WITH TIMEFRAME TOGGLE */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Procurement & Sales Velocity Analytics
              </h3>
              <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Demo Projection
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Dual-view financial trends benchmarked against historical concession concessions.
            </p>
          </div>

          {/* Timeframe selector: 7D, 30D, 3M, 6M, 1Y */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-mono font-bold">
            {['7D', '30D', '3M', '6M', '1Y'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  timeRange === range
                    ? 'bg-white text-primary-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Chart 1: Purchases Monthly */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-xs font-bold text-slate-800">Monthly Procurement Spend</h4>
                <p className="text-[11px] text-slate-400">Total drug acquisition expenditure</p>
              </div>
              <span className="text-[10px] font-mono font-bold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-lg border border-primary-200">
                Spend Velocity
              </span>
            </div>
            <PurchasesBarChart data={dashboardData?.purchasesMonthly} />
          </div>

          {/* Chart 2: Sales Monthly */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-xs font-bold text-slate-800">Monthly Surplus Sales</h4>
                <p className="text-[11px] text-slate-400">Near-expiry revenue recovered from peers</p>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Surplus Recovery
              </span>
            </div>
            <SalesBarChart data={dashboardData?.salesMonthly} />
          </div>

        </div>

        {/* Chart 3: Combo Chart - Profitability & Margin Trend */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-bold text-slate-800">5-Month Margin & Capital Turnover Analysis</h4>
              <p className="text-[11px] text-slate-400">
                Comparative correlation of sales recovery volume against procurement cost and net gross yield.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Optimal Target: &gt; 25%
            </span>
          </div>
          <ProfitabilityComboChart data={dashboardData?.profitabilityTrend} />
        </div>
      </div>

      {/* 5. LIVE SUPPLY NETWORK COMPONENT */}
      <LiveSupplyNetworkMap />

    </div>
  );
};

export default HospitalDashboard;
