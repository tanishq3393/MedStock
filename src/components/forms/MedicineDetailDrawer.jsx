import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  MapPin, 
  Thermometer, 
  Calendar, 
  ShieldCheck, 
  Send, 
  History, 
  Sparkles, 
  Clock, 
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Lock,
  ArrowRight
} from 'lucide-react';
import Medicine3DPreview from '../spatial/Medicine3DPreview';

export const MedicineDetailDrawer = ({ 
  isOpen, 
  onClose, 
  medicine, 
  onRequestSubmit,
  isRequestDisabled = false
}) => {
  if (!isOpen || !medicine) return null;

  const [requestQty, setRequestQty] = useState(Math.min(10, medicine.quantity));
  const [requestNotes, setRequestNotes] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'compliance' | 'history'
  const [isSubmitting, setIsSubmitting] = useState(false);

  const unitPrice = medicine.unitOriginalPrice;
  const concession = medicine.concessionPercent || 0;
  const finalUnitPrice = Math.round(unitPrice * (1 - concession / 100) * 100) / 100;
  const totalAmount = Math.round(finalUnitPrice * requestQty);

  const isColdChain = medicine.storageType?.toLowerCase().includes('cold');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onRequestSubmit({
      medicine,
      quantity: requestQty,
      notes: requestNotes,
      finalUnitPrice,
      totalAmount,
    });
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Container */}
      <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto z-10 animate-slideLeft">
        
        {/* Top Header */}
        <div className="p-5 border-b border-slate-200/90 flex items-start justify-between bg-slate-50/50 sticky top-0 z-20 backdrop-blur-md">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary-50 text-primary-700 border border-primary-200">
                CDSCO COMPLIANT LOT
              </span>
              {concession > 20 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  NEAR EXPIRY OPPORTUNITY
                </span>
              )}
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 leading-tight">
              {medicine.brandName}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {medicine.power} • {medicine.genericName}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-6 flex-1">
          
          {/* Spatial 3D Medicine Package Viewer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold text-slate-700">Digital Package Hologram</span>
              <span className="font-mono text-[10px]">Tamper-Proof Verification</span>
            </div>
            <Medicine3DPreview medicine={medicine} />
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`pb-1 px-1 transition-all ${
                activeTab === 'overview'
                  ? 'text-primary-700 border-b-2 border-primary-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Specifications & SLA
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('compliance')}
              className={`pb-1 px-1 transition-all ${
                activeTab === 'compliance'
                  ? 'text-primary-700 border-b-2 border-primary-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Hospital Accreditation
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`pb-1 px-1 transition-all ${
                activeTab === 'history'
                  ? 'text-primary-700 border-b-2 border-primary-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Batch Ledger
            </button>
          </div>

          {/* TAB 1: Specifications & SLA */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Manufacturer</span>
                  <span className="font-bold text-slate-800">{medicine.manufacturer || 'Sanofi Healthcare'}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Batch Lot</span>
                  <span className="font-mono font-bold text-slate-800">{medicine.batchNo || 'LOT-2024-X'}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1 col-span-2">
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Storage Protocol</span>
                  <span className={`font-mono font-bold flex items-center gap-1 ${
                    isColdChain ? 'text-primary-700' : 'text-slate-800'
                  }`}>
                    {isColdChain && <Thermometer className="w-3.5 h-3.5 text-cyan-600" />}
                    {medicine.storageType}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Mfg Date</span>
                  <span className="font-mono font-bold text-slate-700">{medicine.mfgDate || '2023-11-15'}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Expiry Window</span>
                  <span className="font-mono font-bold text-amber-700">{medicine.expiryDate}</span>
                </div>
              </div>

              {/* Pricing breakdown box */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-primary-50/50 border border-primary-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Standard Government MRP:</span>
                  <span className="font-mono line-through text-slate-400">₹{medicine.unitOriginalPrice} / unit</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Automated Expiry Concession:</span>
                  <span className="font-mono font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded">
                    {medicine.concessionPercent || 0}% Concession Applied
                  </span>
                </div>
                <div className="pt-2 border-t border-primary-200/60 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Net Transfer Rate:</span>
                  <span className="text-lg font-extrabold text-primary-800 font-mono">
                    ₹{finalUnitPrice} <span className="text-xs font-normal text-slate-500">/ unit</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Hospital Accreditation */}
          {activeTab === 'compliance' && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <Building2 className="w-4 h-4 text-primary-600" />
                <span>{medicine.hospitalName}</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Registered Healthcare Provider with Form 20B / 21B drug distribution endorsement and cold-chain compliance telemetry verified by State Drug Control Administration.
              </p>
              <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px]">Location</span>
                  <span className="text-slate-800 font-bold">{medicine.location}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Cluster Distance</span>
                  <span className="text-slate-800 font-bold">{medicine.distanceKm || 12} km</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Batch Ledger */}
          {activeTab === 'history' && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <span className="font-mono text-[10px] text-slate-400 block uppercase font-bold">Traceability Timeline</span>
              <div className="space-y-2 font-mono text-[11px] text-slate-600">
                <div className="flex justify-between">
                  <span>Batch Ingest Date:</span>
                  <span className="text-slate-900 font-bold">{medicine.dateAdded || '2024-08-01'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Certified Stock:</span>
                  <span className="text-slate-900 font-bold">{medicine.quantity} units</span>
                </div>
                <div className="flex justify-between">
                  <span>Escrow Lock SLA:</span>
                  <span className="text-emerald-700 font-bold">24-hour physical signoff</span>
                </div>
              </div>
            </div>
          )}

          {/* Requisition Submission Form */}
          <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Initiate B2B Medicine Requisition
            </h4>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Quantity Required (Units):</span>
                <span className="text-slate-500 font-normal">Max available: {medicine.quantity}</span>
              </div>
              <input
                type="number"
                min="1"
                max={medicine.quantity}
                required
                value={requestQty}
                onChange={(e) => setRequestQty(Math.max(1, Math.min(medicine.quantity, Number(e.target.value))))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Clinical Requirement / Urgency Note
              </label>
              <textarea
                rows="2"
                placeholder="e.g. Inpatient ICU surgical quota / immediate patient emergency..."
                value={requestNotes}
                onChange={(e) => setRequestNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {isRequestDisabled && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
                This hospital is suspended and cannot submit medicine exchange requests.
              </div>
            )}

            <div className="p-3 rounded-xl bg-slate-900 text-white flex items-center justify-between text-xs">
              <span className="text-slate-400">Escrow Total:</span>
              <span className="text-base font-extrabold text-cyan-300 font-mono">
                ₹{totalAmount.toLocaleString()}
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isRequestDisabled}
              className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-lg shadow-primary-600/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] disabled:opacity-75"
            >
              <Send className="w-4 h-4" />
              <span>Submit Requisition Request</span>
            </button>
          </form>

        </div>

      </div>
    </div>
  );
};

export default MedicineDetailDrawer;
