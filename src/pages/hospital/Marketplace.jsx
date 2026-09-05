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
  Eye
} from 'lucide-react';
import { fetchMarketplace } from '../../store/slices/hospitalSlice';
import { createNewRequest } from '../../store/slices/requestSlice';
import MedicineDetailDrawer from '../../components/forms/MedicineDetailDrawer';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export const Marketplace = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { marketplace, isLoading } = useSelector((state) => state.hospital);

  const [search, setSearch] = useState('');
  const [powerFilter, setPowerFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [selectedStorage, setSelectedStorage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [maxDistance, setMaxDistance] = useState('all');
  const [onlyNearExpiry, setOnlyNearExpiry] = useState(false);

  // Selected Medicine for Drawer Inspection
  const [activeDrawerMedicine, setActiveDrawerMedicine] = useState(null);

  useEffect(() => {
    dispatch(fetchMarketplace({
      hospitalId: user?.id || 'hosp-1',
      filters: {
        search,
        power: powerFilter,
        location: locationFilter,
        storageType: selectedStorage
      }
    }));
  }, [dispatch, user, search, powerFilter, locationFilter, selectedStorage]);

  const handleOpenDetail = (med) => {
    setActiveDrawerMedicine(med);
  };

  const handleRequisitionSubmit = async ({ medicine, quantity, notes, finalUnitPrice, totalAmount }) => {
    const payload = {
      medicineId: medicine.id,
      medicineName: `${medicine.brandName} (${medicine.power})`,
      power: medicine.power,
      quantity,
      unitOriginalPrice: medicine.unitOriginalPrice,
      concessionPercent: medicine.concessionPercent || 0,
      unitFinalPrice: finalUnitPrice,
      totalAmount,
      fromHospitalId: user?.id || 'hosp-1',
      fromHospitalName: user?.name || 'Apollo Hospital',
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
            <span className="text-[10px] uppercase text-slate-400 block">CDSCO Statutory Rule 65</span>
            <span className="font-bold text-white">Escrow-Protected Trading</span>
          </div>
        </div>
      </div>

      {/* Intelligent Search & Multi-Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
        
        {/* Row 1: Search, Power, Location, Storage */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Brand or Generic name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium"
            />
          </div>

          <div>
            <input
              type="text"
              placeholder="Dosage / Power (e.g. 1g, 40mg)"
              value={powerFilter}
              onChange={(e) => setPowerFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium"
            />
          </div>

          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Location (e.g. Mumbai, Gurgaon)"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium"
            />
          </div>

          <div>
            <select
              value={selectedStorage}
              onChange={(e) => setSelectedStorage(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-semibold text-slate-700 focus:outline-none"
            >
              <option value="">All Storage Conditions</option>
              <option value="Cold Storage">Cold Storage (2°C - 8°C)</option>
              <option value="Room Temperature">Room Temperature (&lt;25°C)</option>
              <option value="Protect from Light">Protect from Light</option>
              <option value="Deep Freeze">Deep Freeze (-20°C)</option>
            </select>
          </div>

        </div>

        {/* Row 2: Secondary Filters */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-500 text-[11px] uppercase font-mono">Filter Category:</span>
            {['all', 'antibiotic', 'cardiology', 'emergency', 'diabetes'].map((cat) => (
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

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyNearExpiry}
                onChange={(e) => setOnlyNearExpiry(e.target.checked)}
                className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-[11px] text-amber-800 font-bold">Near-Expiry Discounts (25%+ OFF)</span>
            </label>

            <span className="font-mono text-slate-400 text-xs">
              Showing: <strong className="text-slate-900">{filteredMarketplace.length}</strong> Lots
            </span>
          </div>
        </div>

      </div>

      {/* Medicine Cards Grid */}
      {isLoading && marketplace.length === 0 ? (
        <LoadingSpinner text="Querying active marketplace lots..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMarketplace.length > 0 ? (
            filteredMarketplace.map((med) => {
              const discountedPrice = Math.round(
                med.unitOriginalPrice * (1 - (med.concessionPercent || 0) / 100) * 100
              ) / 100;

              const isCold = med.storageType?.toLowerCase().includes('cold');

              return (
                <div
                  key={med.id}
                  onClick={() => handleOpenDetail(med)}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-card hover:shadow-card-hover hover:border-primary-400 transition-all p-5 flex flex-col justify-between group cursor-pointer"
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
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-medium">Available Units</span>
                        <span className="font-mono font-extrabold text-slate-900 text-sm">{med.quantity} Units</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-medium">Expiry Date</span>
                        <span className="font-mono font-bold text-amber-700">{med.expiryDate}</span>
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
            })
          ) : (
            <div className="col-span-full bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
              <Boxes className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="font-bold text-sm text-slate-700">No medicines found matching these criteria</p>
              <p className="text-xs text-slate-400 mt-1">Try resetting your dosage or location filters</p>
            </div>
          )}
        </div>
      )}

      {/* Detailed Medicine Inspection Drawer with 3D Preview */}
      <MedicineDetailDrawer
        isOpen={!!activeDrawerMedicine}
        onClose={() => setActiveDrawerMedicine(null)}
        medicine={activeDrawerMedicine}
        onRequestSubmit={handleRequisitionSubmit}
      />

    </div>
  );
};

export default Marketplace;
