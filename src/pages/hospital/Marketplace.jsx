import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  Boxes, 
  Pill, 
  Send, 
  Building2, 
  Navigation, 
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Thermometer,
  Layers,
  ArrowRight,
  Eye,
  List,
  LayoutGrid,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { fetchMarketplace } from '../../store/slices/hospitalSlice';
import { createNewRequest } from '../../store/slices/requestSlice';
import MedicineDetailDrawer from '../../components/forms/MedicineDetailDrawer';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { isHospitalSuspended } from '../../services/storage';

export const Marketplace = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { marketplace, isLoading } = useSelector((state) => state.hospital);
  const isSuspended = isHospitalSuspended(user?.id);

  const [search, setSearch] = useState('');
  const [powerFilter, setPowerFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [selectedStorage, setSelectedStorage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [maxDistance, setMaxDistance] = useState('all');
  const [onlyNearExpiry, setOnlyNearExpiry] = useState(false);
  const [viewMode, setViewMode] = useState('horizontal'); // 'horizontal' | 'scroll' | 'grid'

  // Selected Medicine for Drawer Inspection
  const [activeDrawerMedicine, setActiveDrawerMedicine] = useState(null);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchMarketplace({
        hospitalId: user.id,
        filters: {
          search,
          power: powerFilter,
          location: locationFilter,
          storageType: selectedStorage
        }
      }));
    }
  }, [dispatch, user?.id, search, powerFilter, locationFilter, selectedStorage]);

  const handleOpenDetail = (med) => {
    setActiveDrawerMedicine(med);
  };

  const handleRequisitionSubmit = async ({ medicine, quantity, notes, finalUnitPrice, totalAmount }) => {
    if (isSuspended) {
      toast.error('Your hospital account is currently suspended. You cannot perform transactions or operational activities.');
      return;
    }
    const payload = {
      medicineId: medicine.id,
      medicineName: `${medicine.brandName} (${medicine.power})`,
      power: medicine.power,
      quantity,
      unitOriginalPrice: medicine.unitOriginalPrice,
      concessionPercent: medicine.concessionPercent || 0,
      unitFinalPrice: finalUnitPrice,
      totalAmount,
      fromHospitalId: user?.id,
      fromHospitalName: user?.name || 'Authorized Buyer Hospital',
      toHospitalId: medicine.hospitalId,
      toHospitalName: medicine.hospitalName,
      notes,
    };

    try {
      await dispatch(createNewRequest(payload));
      setActiveDrawerMedicine(null);
      toast.success(`Exchange request for ${medicine.brandName} sent to ${medicine.hospitalName}!`);
    } catch (err) {
      toast.error('Failed to submit request');
    }
  };

  // Filter with additional criteria
  const filteredMarketplace = marketplace.filter((med) => {
    // Strictly filter out any expired inventory batches from trade floor
    if (med.expiryDate && new Date(med.expiryDate) < new Date()) {
      return false;
    }
    if (selectedCategory !== 'all' && !med.category?.toLowerCase().includes(selectedCategory.toLowerCase())) {
      return false;
    }
    if (maxDistance !== 'all' && (med.distanceKm || 12) > Number(maxDistance)) {
      return false;
    }
    if (onlyNearExpiry && (med.concessionPercent || 0) < 25) {
      return false;
    }
    return true;
  });

  const scrollShelf = (direction) => {
    const el = document.getElementById('horizontal-shelf-container');
    if (el) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const renderGridCard = (med) => {
    const discountedPrice = Math.round(
      med.unitOriginalPrice * (1 - (med.concessionPercent || 0) / 100) * 100
    ) / 100;
    const isCold = med.storageType?.toLowerCase().includes('cold');

    return (
      <div
        key={med.id}
        onClick={() => handleOpenDetail(med)}
        className="bg-white rounded-2xl border border-slate-200/90 shadow-card hover:shadow-card-hover hover:border-primary-400 transition-all p-5 flex flex-col justify-between group cursor-pointer h-full"
      >
        <div className="space-y-3.5">
          {/* Card Top Tag Row */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full truncate max-w-[150px]">
              {med.category || 'Pharmaceutical'}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-extrabold bg-amber-50 text-amber-800 border border-amber-200 shadow-sm">
              {med.concessionPercent || 0}% OFF
            </span>
          </div>

          {/* Image / Icon Badge */}
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary-50 to-primary-100 border border-primary-200 text-primary-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-sm">
              <Pill className="w-6 h-6 rotate-45" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 group-hover:text-primary-700 transition-colors leading-tight">
                {med.brandName}
              </h3>
              <p className="text-xs font-semibold text-primary-700 mt-0.5 font-mono">{med.power}</p>
              <p className="text-[11px] text-slate-500 truncate max-w-[190px]">{med.genericName}</p>
            </div>
          </div>

          {/* Hospital & Location Meta */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-800 font-bold truncate max-w-[170px]">
                <Building2 className="w-3.5 h-3.5 text-primary-600 flex-shrink-0" />
                <span className="truncate">{med.hospitalName}</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 flex-shrink-0">
                <Navigation className="w-3 h-3 text-emerald-500" />
                {med.distanceKm || 12} km away
              </span>
            </div>
            
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                {med.location}
              </span>

              <span className={`inline-flex items-center gap-1 font-mono font-semibold ${
                isCold ? 'text-primary-700' : 'text-slate-600'
              }`}>
                <Thermometer className="w-3 h-3 text-cyan-600" />
                {isCold ? 'Cold 2°C - 8°C' : 'Room Temp'}
              </span>
            </div>
          </div>

          {/* Specs Grid */}
          <div className="grid grid-cols-3 gap-2 text-xs pt-1">
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 block font-medium">Available Units</span>
              <span className="font-mono font-extrabold text-slate-900 text-sm">{med.quantity}</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 block font-medium">Mfg Date</span>
              <span className="font-mono font-semibold text-slate-700 text-xs">{med.mfgDate || '2023-11-15'}</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 block font-medium">Expiry Date</span>
              <span className="font-mono font-bold text-amber-700 text-xs">{med.expiryDate}</span>
            </div>
          </div>
        </div>

        {/* Pricing and Request Button */}
        <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-400 line-through">MRP ₹{med.unitOriginalPrice}</span>
            <div className="text-base font-extrabold font-mono text-primary-800">
              ₹{discountedPrice} <span className="text-[10px] text-slate-500 font-normal">/ unit</span>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDetail(med);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-md shadow-primary-600/20 transition-all group-hover:scale-105"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Inspect Lot</span>
          </button>
        </div>
      </div>
    );
  };

  const renderHorizontalCard = (med) => {
    const discountedPrice = Math.round(
      med.unitOriginalPrice * (1 - (med.concessionPercent || 0) / 100) * 100
    ) / 100;
    const isCold = med.storageType?.toLowerCase().includes('cold');

    return (
      <div
        key={med.id}
        onClick={() => handleOpenDetail(med)}
        className="bg-white rounded-2xl border border-slate-200/90 shadow-card hover:shadow-card-hover hover:border-primary-400 transition-all p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 group cursor-pointer"
      >
        {/* Medicine & Formulation Info */}
        <div className="flex items-start sm:items-center gap-3.5 min-w-[280px] lg:w-[32%]">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary-50 to-primary-100 border border-primary-200 text-primary-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-sm">
            <Pill className="w-6 h-6 rotate-45" />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-extrabold text-slate-900 group-hover:text-primary-700 transition-colors leading-tight">
                {med.brandName}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-amber-50 text-amber-800 border border-amber-200 shadow-sm flex-shrink-0">
                {med.concessionPercent || 0}% OFF
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-bold text-primary-700 font-mono">{med.power}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 truncate text-[11px]">{med.genericName}</span>
            </div>
            <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                {med.category || 'Pharmaceutical'}
              </span>
              <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md border ${
                isCold ? 'bg-cyan-50 text-cyan-800 border-cyan-200' : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                <Thermometer className="w-3 h-3 text-cyan-600" />
                {isCold ? 'Cold 2°C - 8°C' : 'Room Temp'}
              </span>
            </div>
          </div>
        </div>

        {/* Hospital Provider & Location */}
        <div className="flex flex-col justify-center space-y-1.5 sm:w-56 lg:border-l lg:border-r border-slate-100 lg:px-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-800 font-bold truncate">
            <Building2 className="w-3.5 h-3.5 text-primary-600 flex-shrink-0" />
            <span className="truncate">{med.hospitalName}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <span className="truncate">{med.location}</span>
          </div>
          <div>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <Navigation className="w-3 h-3 text-emerald-600" />
              <span>{med.distanceKm || 12} km away</span>
            </span>
          </div>
        </div>

        {/* Batch Specifications: Units, Mfg, Expiry */}
        <div className="grid grid-cols-3 gap-2 flex-1 max-w-md text-xs">
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
            <span className="text-[10px] text-slate-400 block font-medium">Available</span>
            <span className="font-mono font-extrabold text-slate-900 text-sm block leading-tight">
              {med.quantity}
            </span>
            <span className="text-[9px] text-slate-400 uppercase font-mono">Units</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
            <span className="text-[10px] text-slate-400 block font-medium">Mfg Date</span>
            <span className="font-mono font-semibold text-slate-700 text-xs block leading-tight">
              {med.mfgDate || '2023-11-15'}
            </span>
            <span className="text-[9px] text-slate-400 uppercase font-mono">Batch</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
            <span className="text-[10px] text-slate-400 block font-medium">Expiry Date</span>
            <span className="font-mono font-bold text-amber-700 text-xs block leading-tight">
              {med.expiryDate}
            </span>
            <span className="text-[9px] text-amber-700/80 uppercase font-mono">Window</span>
          </div>
        </div>

        {/* Pricing & CTA */}
        <div className="flex items-center justify-between lg:flex-col lg:items-end lg:justify-center gap-2.5 min-w-[150px] border-t lg:border-t-0 border-slate-100 pt-3 lg:pt-0">
          <div className="text-left lg:text-right">
            <span className="text-[10px] font-mono text-slate-400 line-through block">MRP ₹{med.unitOriginalPrice}</span>
            <div className="text-lg font-extrabold font-mono text-primary-800 leading-tight">
              ₹{discountedPrice} <span className="text-[10px] text-slate-500 font-normal">/ unit</span>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDetail(med);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-md shadow-primary-600/20 transition-all group-hover:scale-105 flex-shrink-0"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Inspect Lot</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-secondary-950 via-secondary-900 to-[#0A3D44] rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-secondary-800">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-cyan-300 text-xs font-mono font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>VERIFIED INTER-HOSPITAL MEDICINE EXCHANGE</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            B2B Medicine Exchange Marketplace
          </h1>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Acquire critical pharmaceutical lots from verified partner hospital pharmacies with guaranteed cold-chain transport SLA and automated concession discounts.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-slate-300 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <div>
            <div className="font-bold text-white">CDSCO Rule 65 Compliant</div>
            <div className="text-[10px] text-slate-400">All lot transfers digitally signed</div>
          </div>
        </div>
      </div>

      {/* Primary Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          
          {/* Main Keyword Search */}
          <div className="relative lg:col-span-4">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Brand Name, Salt Formulation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium"
            />
          </div>

          {/* Dosage / Power Filter */}
          <div className="lg:col-span-3">
            <input
              type="text"
              placeholder="Dosage (e.g. 1g, 40mg, 100ml)"
              value={powerFilter}
              onChange={(e) => setPowerFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          {/* Location Search */}
          <div className="relative lg:col-span-3">
            <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="City / Region (e.g. Mumbai, Delhi)"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          {/* Distance Radius */}
          <div className="lg:col-span-2">
            <select
              value={maxDistance}
              onChange={(e) => setMaxDistance(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-700 focus:outline-none"
            >
              <option value="all">Any Distance</option>
              <option value="15">Within 15 km</option>
              <option value="30">Within 30 km</option>
              <option value="50">Within 50 km</option>
            </select>
          </div>

        </div>

        {/* Secondary Category Pills and View Switcher */}
        <div className="pt-2 border-t border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 font-medium text-[11px] mr-1">Therapeutic Class:</span>
            {['all', 'critical', 'cardiology', 'emergency', 'antibiotic', 'diabetes'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                  selectedCategory === cat
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3.5 w-full md:w-auto">
            <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyNearExpiry}
                onChange={(e) => setOnlyNearExpiry(e.target.checked)}
                className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-[11px] text-amber-800 font-bold">Near-Expiry Discounts (25%+ OFF)</span>
            </label>

            <div className="flex items-center gap-3">
              <span className="font-mono text-slate-400 text-xs">
                Showing: <strong className="text-slate-900">{filteredMarketplace.length}</strong> Lots
              </span>

              {/* View Switcher: Horizontal List (default), Horizontal Shelf, Grid */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewMode('horizontal')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'horizontal'
                      ? 'bg-white text-primary-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Horizontal Medicine List (Rows)"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Horizontal List</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('scroll')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'scroll'
                      ? 'bg-white text-primary-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Horizontal Scroll Shelf"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Horizontal Shelf</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white text-primary-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Grid</span>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Medicine Cards Section */}
      {isLoading && marketplace.length === 0 ? (
        <LoadingSpinner text="Querying active marketplace lots..." />
      ) : filteredMarketplace.length > 0 ? (
        viewMode === 'scroll' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                <ArrowLeftRight className="w-3.5 h-3.5 text-primary-600" />
                <span>Scroll horizontally to browse active medicine lots</span>
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => scrollShelf('left')}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors shadow-sm"
                  title="Scroll Left"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollShelf('right')}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors shadow-sm"
                  title="Scroll Right"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div
              id="horizontal-shelf-container"
              className="flex gap-4 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory scrollbar-thin scrollbar-thumb-slate-300"
            >
              {filteredMarketplace.map((med) => (
                <div key={med.id} className="w-[350px] flex-shrink-0 snap-start">
                  {renderGridCard(med)}
                </div>
              ))}
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMarketplace.map((med) => renderGridCard(med))}
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredMarketplace.map((med) => renderHorizontalCard(med))}
          </div>
        )
      ) : (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
          <Boxes className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="font-bold text-sm text-slate-700">No medicines found matching these criteria</p>
          <p className="text-xs text-slate-400 mt-1">Try resetting your dosage or location filters</p>
        </div>
      )}

      {/* Detailed Medicine Inspection Drawer with 3D Preview */}
      <MedicineDetailDrawer
        isOpen={!!activeDrawerMedicine}
        onClose={() => setActiveDrawerMedicine(null)}
        medicine={activeDrawerMedicine}
        onRequestSubmit={handleRequisitionSubmit}
        isRequestDisabled={isSuspended}
      />

    </div>
  );
};

export default Marketplace;
