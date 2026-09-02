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
  Clock
} from 'lucide-react';
import { fetchMarketplace } from '../../store/slices/hospitalSlice';
import { createNewRequest } from '../../store/slices/requestSlice';
import Modal from '../../components/common/Modal';
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

  // Request modal state
  const [selectedMedForRequest, setSelectedMedForRequest] = useState(null);
  const [requestQty, setRequestQty] = useState(10);
  const [requestNotes, setRequestNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleOpenRequest = (med) => {
    setSelectedMedForRequest(med);
    setRequestQty(Math.min(10, med.quantity));
    setRequestNotes('');
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!selectedMedForRequest) return;
    if (requestQty > selectedMedForRequest.quantity) {
      toast.error(`Requested quantity exceeds available stock (${selectedMedForRequest.quantity})`);
      return;
    }

    setIsSubmitting(true);
    const unitPrice = selectedMedForRequest.unitOriginalPrice;
    const concession = selectedMedForRequest.concessionPercent || 0;
    const finalUnitPrice = Math.round(unitPrice * (1 - concession / 100) * 100) / 100;
    const totalAmount = Math.round(finalUnitPrice * requestQty);

    const payload = {
      medicineId: selectedMedForRequest.id,
      medicineName: `${selectedMedForRequest.brandName} (${selectedMedForRequest.power})`,
      power: selectedMedForRequest.power,
      quantity: requestQty,
      unitOriginalPrice: unitPrice,
      concessionPercent: concession,
      unitFinalPrice: finalUnitPrice,
      totalAmount,
      fromHospitalId: user?.id || 'hosp-1',
      fromHospitalName: user?.name || 'Apollo Hospital',
      toHospitalId: selectedMedForRequest.hospitalId,
      toHospitalName: selectedMedForRequest.hospitalName,
      notes: requestNotes,
    };

    try {
      await dispatch(createNewRequest(payload));
      setIsSubmitting(false);
      setSelectedMedForRequest(null);
      toast.success(`Exchange request for ${selectedMedForRequest.brandName} sent successfully!`);
    } catch (err) {
      setIsSubmitting(false);
      toast.error('Failed to submit request');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-primary-900 via-secondary-800 to-secondary-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-primary-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Verified Inter-Hospital Network</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Inter-Hospital Medicine Marketplace</h1>
          <p className="text-xs text-slate-300 max-w-xl">
            Acquire critical pharmaceutical batches from neighboring hospital pharmacies with guaranteed cold-chain logistics and dynamic discount concessions.
          </p>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search Brand / Generic */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Brand / Generic name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          {/* Filter Power */}
          <div>
            <input
              type="text"
              placeholder="Filter by Dosage / Power (e.g. 1g, 40mg)"
              value={powerFilter}
              onChange={(e) => setPowerFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          {/* Filter Location */}
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Location (e.g. Gurgaon, Delhi, Mumbai)"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          {/* Storage Filter */}
          <div>
            <select
              value={selectedStorage}
              onChange={(e) => setSelectedStorage(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:outline-none"
            >
              <option value="">All Storage Conditions</option>
              <option value="Cold Storage (2°C - 8°C)">Cold Storage (2°C - 8°C)</option>
              <option value="Room Temperature (15°C - 25°C)">Room Temperature (15°C - 25°C)</option>
              <option value="Protect from Light (<25°C)">Protect from Light</option>
              <option value="Deep Freeze (-20°C)">Deep Freeze (-20°C)</option>
            </select>
          </div>

        </div>
      </div>

      {/* Medicine Cards Grid */}
      {isLoading && marketplace.length === 0 ? (
        <LoadingSpinner text="Querying active marketplace lots..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {marketplace.length > 0 ? (
            marketplace.map((med) => {
              const discountedPrice = Math.round(
                med.unitOriginalPrice * (1 - (med.concessionPercent || 0) / 100) * 100
              ) / 100;

              return (
                <div
                  key={med.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-md hover:shadow-xl hover:border-primary-300 transition-all p-5 flex flex-col justify-between group"
                >
                  <div className="space-y-3.5">
                    
                    {/* Card Top Pill Bar */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full truncate max-w-[150px]">
                        {med.category || 'Pharmaceutical'}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-200 shadow-sm">
                        {med.concessionPercent || 0}% OFF
                      </span>
                    </div>

                    {/* Image / Icon Badge */}
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary-50 to-primary-100 border border-primary-200 text-primary-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                        <Pill className="w-6 h-6 rotate-45" />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 group-hover:text-primary-700 transition-colors leading-tight">
                          {med.brandName}
                        </h3>
                        <p className="text-xs font-semibold text-primary-700 mt-0.5">{med.power}</p>
                        <p className="text-[11px] text-slate-400 truncate max-w-[200px]">{med.genericName}</p>
                      </div>
                    </div>

                    {/* Hospital & Location Meta */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-slate-700 font-semibold truncate max-w-[180px]">
                          <Building2 className="w-3.5 h-3.5 text-primary-600 flex-shrink-0" />
                          <span className="truncate">{med.hospitalName}</span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 flex-shrink-0">
                          <Navigation className="w-3 h-3 text-emerald-500" />
                          {med.distanceKm || 12} km away
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{med.location}</span>
                      </div>
                    </div>

                    {/* Specs Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-medium">Available Units</span>
                        <span className="font-extrabold text-slate-900 text-sm">{med.quantity} Units</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-medium">Expiry Date</span>
                        <span className="font-bold text-slate-800">{med.expiryDate}</span>
                      </div>
                    </div>

                  </div>

                  {/* Pricing and Request Button */}
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 line-through">MRP ₹{med.unitOriginalPrice}</span>
                      <div className="text-base font-extrabold text-primary-700">
                        ₹{discountedPrice} <span className="text-[10px] text-slate-500 font-normal">/ unit</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenRequest(med)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-md shadow-primary-500/20 transition-all hover:scale-105"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Request</span>
                    </button>
                  </div>

                </div>
              );
            })
          ) : (
            <div className="col-span-full bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
              <Boxes className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="font-bold text-sm text-slate-700">No medicines found matching these filters</p>
              <p className="text-xs text-slate-400 mt-1">Try clearing your search query or dosage filters</p>
            </div>
          )}
        </div>
      )}

      {/* Request Quantity Modal */}
      {selectedMedForRequest && (
        <Modal
          isOpen={!!selectedMedForRequest}
          onClose={() => setSelectedMedForRequest(null)}
          title={`Request Medicine: ${selectedMedForRequest.brandName}`}
          subtitle={`Providing Hospital: ${selectedMedForRequest.hospitalName} (${selectedMedForRequest.location})`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSendRequest} className="space-y-4 pt-1">
            
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Formulation & Strength:</span>
                <span className="font-bold text-slate-800">{selectedMedForRequest.power}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Storage SLA:</span>
                <span className="font-medium text-slate-700">{selectedMedForRequest.storageType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Available Stock:</span>
                <span className="font-bold text-emerald-600">{selectedMedForRequest.quantity} units</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Requested Quantity (Units) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max={selectedMedForRequest.quantity}
                required
                value={requestQty}
                onChange={(e) => setRequestQty(Math.max(1, Math.min(selectedMedForRequest.quantity, Number(e.target.value))))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none font-bold"
              />
            </div>

            {/* Estimated Total */}
            <div className="p-3 bg-primary-50/60 rounded-xl border border-primary-200 flex justify-between items-center text-xs">
              <span className="text-slate-600 font-semibold">Estimated Total Cost:</span>
              <span className="text-base font-extrabold text-primary-800">
                ₹{(Math.round(selectedMedForRequest.unitOriginalPrice * (1 - (selectedMedForRequest.concessionPercent || 0) / 100) * 100) / 100 * requestQty).toLocaleString()}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Clinical Requirement / Urgency Note
              </label>
              <textarea
                rows="2"
                placeholder="e.g. Critical requirement for surgical ICU inpatient bed..."
                value={requestNotes}
                onChange={(e) => setRequestNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedMedForRequest(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-all disabled:opacity-75"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Request</span>
              </button>
            </div>

          </form>
        </Modal>
      )}

    </div>
  );
};

export default Marketplace;
