import React, { useState, useEffect, useMemo } from 'react';
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
  Activity,
  Trash2,
  FileCheck2,
  Building2
} from 'lucide-react';
import { fetchHospitalDashboard, fetchInventory } from '../../store/slices/hospitalSlice';
import PurchasesBarChart from '../../components/charts/PurchasesBarChart';
import SalesBarChart from '../../components/charts/SalesBarChart';
import ProfitabilityComboChart from '../../components/charts/ProfitabilityComboChart';
import FloatingNetworkHero from '../../components/spatial/FloatingNetworkHero';
import SpatialInventoryOverview from '../../components/spatial/SpatialInventoryOverview';
import LiveSupplyNetworkMap from '../../components/spatial/LiveSupplyNetworkMap';
import LoadingSpinner from '../../components/common/LoadingSpinner';
<<<<<<< HEAD
import { calculateMedicineExpiry } from '../../utils/expiryUtils';
=======
import RecentActivitySection from '../../components/common/RecentActivitySection';
>>>>>>> 6ddff35 (Added Cancel)

export const HospitalDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
<<<<<<< HEAD
  const { dashboardData, inventory = [], disposals = [], isLoading } = useSelector((state) => state.hospital);
=======
  const { dashboardData, isLoading, error } = useSelector((state) => state.hospital);
>>>>>>> 6ddff35 (Added Cancel)

  const [timeRange, setTimeRange] = useState('6M'); // 7D | 30D | 3M | 6M | 1Y

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchHospitalDashboard(user.id));
      dispatch(fetchInventory(user.id));
    }
  }, [dispatch, user?.id]);

  // Derived real-time inventory statistics from single source of truth
  const inventoryMetrics = useMemo(() => {
    const totalBatches = inventory.length;
    const totalUnits = inventory.reduce((sum, m) => sum + (Number(m.quantity) || 0), 0);

    let expiredBatches = 0;
    let expiredUnits = 0;
    let requiringDisposalBatches = 0;
    let requiringDisposalUnits = 0;
    let availableUnits = 0;

    inventory.forEach((m) => {
      const isDisposed = m.status === 'disposed';
      const qty = Number(m.quantity) || 0;
      const exp = calculateMedicineExpiry(m.expiryDate, qty);

      if (exp.isExpired) {
        expiredBatches++;
        expiredUnits += qty;
        if (!isDisposed) {
          requiringDisposalBatches++;
          requiringDisposalUnits += qty;
        }
      } else if (!isDisposed) {
        availableUnits += qty;
      }
    });

    return {
      totalBatches,
      totalUnits,
      expiredBatches,
      expiredUnits,
      requiringDisposalBatches,
      requiringDisposalUnits,
      availableUnits,
    };
  }, [inventory]);

  if (isLoading && !dashboardData && inventory.length === 0) {
    return <LoadingSpinner text="Compiling Pharmacy Supply Chain Telemetry..." />;
  }

  if (error && !dashboardData) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4 rounded-2xl bg-white border border-rose-200 shadow-sm my-12">
        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900">Telemetry Synchronization Offline</h2>
          <p className="text-xs text-slate-500">
            {typeof error === 'string' ? error : 'Unable to retrieve real-time inventory telemetry.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => user?.id && dispatch(fetchHospitalDashboard(user.id))}
          className="px-4 py-2 rounded-xl bg-primary-600 text-white font-bold text-xs hover:bg-primary-700 transition-all shadow-md shadow-primary-600/20"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const stats = dashboardData?.stats || {
    totalMedicines: inventoryMetrics.totalUnits,
    activeSkus: inventoryMetrics.totalBatches,
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
              Manage complete hospital inventory, discover peer exchanges with automated shelf-life discounts, safely destroy expired medicines via certified bio-waste disposal, and coordinate cold-chain logistics.
            </p>

            {/* Hero Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/hospital/inventory"
                className="px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-400 text-secondary-950 font-extrabold text-xs shadow-lg shadow-primary-500/30 transition-all flex items-center gap-2 hover:scale-[1.02]"
              >
                <Boxes className="w-4 h-4" />
                <span>My Inventory</span>
              </Link>

              <Link
                to="/hospital/waste-management"
                className="px-5 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs border border-rose-500/40 transition-all flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Bio-Waste Disposal</span>
                {inventoryMetrics.requiringDisposalBatches > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-mono font-bold">
                    {inventoryMetrics.requiringDisposalBatches}
                  </span>
                )}
              </Link>

              <Link
                to="/hospital/marketplace"
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/20 transition-all flex items-center gap-2"
              >
                <ShoppingBag className="w-4 h-4 text-cyan-300" />
                <span>Marketplace</span>
              </Link>
            </div>

            {/* Quick Metrics Bar */}
            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center gap-6 text-xs text-slate-400 font-mono">
              <div>
                <span className="text-[10px] uppercase text-slate-500 block">Verified Peer Nodes</span>
                <span className="text-slate-200 font-bold">48 Hospitals Active</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-500 block">Bio-Centre Partner</span>
                <span className="text-emerald-400 font-bold">GreenBio Medical Waste Centre</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-500 block">Cold Chain SLA</span>
                <span className="text-cyan-300 font-bold">99.8% Compliant</span>
              </div>
            </div>
          </div>

          {/* Right Hero 3D Digital Logistics Network */}
          <div className="lg:col-span-6 w-full">
            <FloatingNetworkHero />
          </div>

        </div>
      </div>

      {/* 2. DYNAMIC KPI SYSTEM (Total Inventory, Expired Medicines, Disposal Required, Operating Margins) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: TOTAL INVENTORY */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-primary-900 to-secondary-900 text-white border border-primary-500/30 shadow-elevated flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-cyan-400/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase font-bold text-cyan-300 tracking-wider">
                Total Inventory
              </span>
              <div className="w-8 h-8 rounded-lg bg-white/10 text-cyan-300 flex items-center justify-center">
                <Boxes className="w-4 h-4" />
              </div>
            </div>

            <div className="pt-2">
              <div className="text-3xl font-extrabold font-mono tracking-tight text-white">
                {inventoryMetrics.totalUnits.toLocaleString()} <span className="text-sm font-normal text-slate-300">units</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold mt-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>{inventoryMetrics.totalBatches} total stored batches</span>
              </div>
            </div>
          </div>

          {/* Miniature Stock Pill */}
          <div className="pt-4 mt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-300">
            <span>Available: {inventoryMetrics.availableUnits.toLocaleString()} units</span>
            <Link to="/hospital/inventory" className="text-cyan-300 hover:underline font-bold">
              View Inventory →
            </Link>
          </div>
        </div>

        {/* KPI 2: MEDICINES REQUIRING DISPOSAL (Prominent Callout) */}
        <div className="p-5 rounded-2xl bg-white border border-rose-200 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-mono uppercase font-bold text-rose-700 tracking-wider">
                Medicines Requiring Disposal
              </span>
              <div className="text-2xl font-extrabold font-mono tracking-tight text-rose-800 mt-1">
                {inventoryMetrics.requiringDisposalBatches} <span className="text-sm font-normal text-rose-600">batches</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-4 h-4" />
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-rose-50/80 border border-rose-200 text-xs text-rose-900 font-semibold space-y-0.5">
            <div className="flex items-center justify-between font-bold text-rose-800">
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>{inventoryMetrics.requiringDisposalUnits} units expired</span>
              </span>
              <Link to="/hospital/waste-management" className="text-rose-700 hover:underline text-[11px] font-extrabold">
                Dispose →
              </Link>
            </div>
            <p className="text-[10px] text-rose-700 font-normal">
              Awaiting safe GreenBio incineration
            </p>
          </div>
        </div>

        {/* KPI 3: REDISTRIBUTION & PROCUREMENT SAVINGS */}
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
              <span>Surplus Recovered</span>
            </div>
            <p className="text-[11px] text-emerald-800">
              {stats?.pendingRequestsCount ?? 0} incoming peer requests pending
            </p>
          </div>
        </div>

        {/* KPI 4: OPERATING MARGIN % */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-mono uppercase font-bold text-slate-500 tracking-wider">
                Operating Margin
              </span>
              <div className="text-2xl font-extrabold font-mono tracking-tight text-slate-900 mt-1">
                {stats?.profitabilityPercent ?? 18.5}%
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

<<<<<<< HEAD
      {/* 3. QUICK ACTION TILES (Hospital Workflow Shortcuts) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Action 1: My Inventory */}
        <Link
          to="/hospital/inventory"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-primary-400 hover:shadow-md transition-all flex items-start gap-4 group"
        >
          <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 group-hover:bg-primary-600 group-hover:text-white transition-all flex items-center justify-center font-bold flex-shrink-0">
            <Boxes className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 font-bold text-sm text-slate-900 group-hover:text-primary-700">
              <span>My Inventory</span>
              <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Add and manage all medicines, stock levels, batches, and shelf life parameters.
            </p>
          </div>
        </Link>

        {/* Action 2: Bio-Waste Disposal */}
        <Link
          to="/hospital/waste-management"
          className="p-5 rounded-2xl bg-white border border-rose-200 hover:border-rose-400 hover:shadow-md transition-all flex items-start gap-4 group"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 group-hover:bg-rose-600 group-hover:text-white transition-all flex items-center justify-center font-bold flex-shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 font-bold text-sm text-slate-900 group-hover:text-rose-700">
                <span>Bio-Waste Disposal</span>
                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
              {inventoryMetrics.requiringDisposalBatches > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-rose-100 text-rose-800">
                  {inventoryMetrics.requiringDisposalBatches} Action
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Review expired medicines and send them for safe disposal at GreenBio Medical Waste Centre.
            </p>
          </div>
        </Link>

        {/* Action 3: Marketplace */}
        <Link
          to="/hospital/marketplace"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all flex items-start gap-4 group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-all flex items-center justify-center font-bold flex-shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 font-bold text-sm text-slate-900 group-hover:text-emerald-700">
              <span>Peer Marketplace</span>
              <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Discover verified medicine exchanges and near-expiry stock discounts across peer hospitals.
            </p>
          </div>
        </Link>

      </div>

      {/* 4. SPATIAL INVENTORY WAREHOUSE VISUALIZATION */}
=======
      {/* OPERATIONAL QUEUES & SYSTEM STATUS WITH PROPER EMPTY STATES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Queue 1: Inventory Status */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Boxes className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Hospital Pharmacy Stock</h4>
                <p className="text-[10px] text-slate-500 font-mono">Central Formulary</p>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              stats.totalMedicines > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}>
              {stats.totalMedicines > 0 ? `${stats.totalMedicines} Units` : 'Needs Stock'}
            </span>
          </div>

          <div className="text-xs text-slate-600">
            {stats.totalMedicines > 0 ? (
              <p className="line-clamp-2 text-[11px] leading-relaxed">
                Hospital inventory is active across {stats.activeSkus} therapeutic categories with automated stock monitoring.
              </p>
            ) : (
              <div className="space-y-1">
                <p className="font-semibold text-slate-800 text-[11px]">No medicines in inventory yet</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">Add your hospital's available stock to begin managing inventory.</p>
              </div>
            )}
          </div>

          <Link
            to="/hospital/inventory"
            className="text-[11px] font-bold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 pt-1"
          >
            <span>{stats.totalMedicines > 0 ? 'Manage Pharmacy Stock' : 'Add Hospital Stock'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Queue 2: Incoming Peer Requests */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Incoming Peer Requests</h4>
                <p className="text-[10px] text-slate-500 font-mono">Hospital Exchange Queue</p>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              stats.pendingRequestsCount > 0 ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {stats.pendingRequestsCount > 0 ? `${stats.pendingRequestsCount} Pending` : 'Clear'}
            </span>
          </div>

          <div className="text-xs text-slate-600">
            {stats.pendingRequestsCount > 0 ? (
              <p className="line-clamp-2 text-[11px] leading-relaxed">
                {stats.pendingRequestsCount} incoming requisition{stats.pendingRequestsCount > 1 ? 's' : ''} awaiting clinical review and stock allocation.
              </p>
            ) : (
              <div className="space-y-1">
                <p className="font-semibold text-slate-800 text-[11px]">No incoming requests</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">Requests from other hospitals will appear here.</p>
              </div>
            )}
          </div>

          <Link
            to="/hospital/incoming-requests"
            className="text-[11px] font-bold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 pt-1"
          >
            <span>Review Requisitions</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Queue 3: Active Transfers */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Active Supply Transfers</h4>
                <p className="text-[10px] text-slate-500 font-mono">Cold-Chain Telemetry</p>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              stats.activeShipmentsCount > 0 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {stats.activeShipmentsCount > 0 ? `${stats.activeShipmentsCount} In Transit` : 'Idle'}
            </span>
          </div>

          <div className="text-xs text-slate-600">
            {stats.activeShipmentsCount > 0 ? (
              <p className="line-clamp-2 text-[11px] leading-relaxed">
                {stats.activeShipmentsCount} active medicine consignment{stats.activeShipmentsCount > 1 ? 's' : ''} currently in transit.
              </p>
            ) : (
              <div className="space-y-1">
                <p className="font-semibold text-slate-800 text-[11px]">No active transfers</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">Approved medicine transfers will appear here.</p>
              </div>
            )}
          </div>

          <Link
            to="/hospital/track"
            className="text-[11px] font-bold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 pt-1"
          >
            <span>Track Live Deliveries</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 3. SPATIAL INVENTORY WAREHOUSE VISUALIZATION */}
>>>>>>> 6ddff35 (Added Cancel)
      <SpatialInventoryOverview />

      {/* 5. DATA VISUALIZATION SECTION WITH TIMEFRAME TOGGLE */}
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

<<<<<<< HEAD
=======
      {/* 5. RECENT ACTIVITY AUDIT TIMELINE */}
      <RecentActivitySection />

>>>>>>> 6ddff35 (Added Cancel)
      {/* 6. LIVE SUPPLY NETWORK COMPONENT */}
      <LiveSupplyNetworkMap />

    </div>
  );
};

export default HospitalDashboard;
