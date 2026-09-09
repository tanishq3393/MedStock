import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Building2, 
  MapPin, 
  Thermometer, 
  Calendar, 
  ShieldCheck, 
  Send, 
  Sparkles, 
  Clock, 
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Lock,
  ArrowRight,
  TrendingDown,
  Info,
  Layers,
  ChevronDown,
  Box,
  Pill,
  Maximize2,
  FileText,
  Tag,
  Share2
} from 'lucide-react';
import Medicine3DPreview from '../spatial/Medicine3DPreview';
import PurchaseInvoiceViewer from '../hospital/PurchaseInvoiceViewer';
import { calculateOrderPricing } from '../../utils/pricingUtils';
import { findAlternatives, extractMedicineComposition, CLINICAL_SAFETY_DISCLAIMER } from '../../services/medicineAlternativeService';
import { validateRequisition } from '../../utils/validation';
import toast from 'react-hot-toast';

// ============================================================
// SAFE NUMERIC & CURRENCY HELPERS
// Ensures drawer NEVER crashes when numeric fields are missing/undefined
// ============================================================

function formatNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number)
    ? number.toLocaleString('en-IN')
    : fallback.toLocaleString('en-IN');
}

function formatCurrency(value) {
  const number = Number(value);
  return Number.isFinite(number)
    ? `₹${number.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : '₹0.00';
}

function formatDecimal(value, fractionDigits = 2) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(fractionDigits) : '0.00';
}

function normalizeMedicine(med) {
  if (!med) return null;

  const rawPrice = med.unitOriginalPrice ?? med.price ?? med.unitPrice ?? 0;
  const numPrice = Number(rawPrice);
  const safePrice = Number.isFinite(numPrice) ? Math.max(0, numPrice) : 0;

  const rawQty = med.quantity ?? med.stock ?? 0;
  const numQty = Number(rawQty);
  const safeQty = Number.isFinite(numQty) ? Math.max(0, Math.floor(numQty)) : 0;

  const rawConcession = med.concessionPercent ?? med.discountPercent ?? 0;
  const numConcession = Number(rawConcession);
  const safeConcession = Number.isFinite(numConcession) ? Math.max(0, Math.min(100, numConcession)) : 0;

  const rawDistance = med.distanceKm ?? med.distance ?? 12;
  const numDistance = Number(rawDistance);
  const safeDistance = Number.isFinite(numDistance) ? Math.max(0, numDistance) : 12;

  return {
    ...med,
    id: med.id || `med-${Math.random().toString(36).substr(2, 9)}`,
    brandName: med.brandName || med.medicineName || med.name || 'Not available',
    genericName: med.genericName || med.composition || 'Not available',
    power: med.power || med.strength || med.dosage || 'Not available',
    dosageForm: med.dosageForm || med.form || 'Tablet',
    route: med.route || 'Oral',
    hospitalName: med.hospitalName || med.hospital || med.seller || 'Authorized Hospital',
    location: med.location || med.city || 'Not available',
    distanceKm: safeDistance,
    batchNo: med.batchNo || med.batchNumber || med.batch || 'Not available',
    mfgDate: med.mfgDate || med.manufacturingDate || 'Not available',
    expiryDate: med.expiryDate || med.expiry || 'Not available',
    manufacturer: med.manufacturer || 'Not available',
    packSize: med.packSize || med.unit || 'Not available',
    storageType: med.storageType || 'Room Temperature',
    category: med.category || 'Pharmaceutical',
    quantity: safeQty,
    stock: safeQty,
    unitOriginalPrice: safePrice,
    price: safePrice,
    unitPrice: safePrice,
    concessionPercent: safeConcession,
  };
}

/**
 * Safe formatting helpers to prevent TypeError crashes (e.g. .toLocaleString on undefined)
 */
export const safeText = (val, fallback = 'Not available') => {
  if (val === null || val === undefined || val === '') return fallback;
  return String(val);
};

export const formatCurrency = (val, fallback = '0.00') => {
  const num = Number(val);
  if (isNaN(num) || val === null || val === undefined) return fallback;
  return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const formatNumber = (val, fallback = '0') => {
  const num = Number(val);
  if (isNaN(num) || val === null || val === undefined) return fallback;
  return num.toLocaleString('en-IN');
};

export const formatDate = (val, fallback = 'Not available') => {
  if (!val) return fallback;
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return String(val);
  }
};

/**
 * Resolves appropriate medicine product packaging visual
 * Supports:
 * - Direct image fields: medicine.image, medicine.imageUrl, medicine.productImage, medicine.image_url, medicine.images
 * - Dosage-form visuals: vial, injection/syringe, capsule, syrup, tablet
 */
export const resolveMedicineImageUrl = (medicine) => {
  if (!medicine) return '/medicines/tablet_default.svg';
  
  // 1. Check explicit image fields
  const directUrl = medicine.image || medicine.imageUrl || medicine.productImage || medicine.image_url;
  if (directUrl && typeof directUrl === 'string' && directUrl.trim().length > 0) {
    return directUrl;
  }
  if (Array.isArray(medicine.images) && medicine.images.length > 0 && medicine.images[0]?.url) {
    return medicine.images[0].url;
  }

  // 2. Specific brand matching
  const brandLower = (medicine.brandName || '').toLowerCase();
  if (brandLower.includes('dolo')) return '/medicines/dolo_500_front.svg';
  if (brandLower.includes('calpol') && !brandLower.includes('pediatric')) return '/medicines/calpol_500_front.svg';
  if (brandLower.includes('p-500') || brandLower === 'p500') return '/medicines/p500_front.svg';
  if (brandLower.includes('paracare')) return '/medicines/paracare_front.svg';

  // 3. Dosage form matching
  const combined = ((medicine.dosageForm || '') + ' ' + (medicine.category || '') + ' ' + (medicine.power || '') + ' ' + (medicine.genericName || '')).toLowerCase();
  if (combined.includes('vial') || combined.includes('propofol') || combined.includes('meropenem') || combined.includes('infusion')) {
    return '/medicines/vial_default.svg';
  }
  if (combined.includes('syringe') || combined.includes('enoxaparin') || combined.includes('injection') || combined.includes('inj') || combined.includes('ampoule')) {
    return '/medicines/injection_default.svg';
  }
  if (combined.includes('capsule') || combined.includes('caplet') || combined.includes('softgel')) {
    return '/medicines/capsule_default.svg';
  }
  if (combined.includes('syrup') || combined.includes('suspension') || combined.includes('liquid') || combined.includes('elixir')) {
    return '/medicines/syrup_default.svg';
  }

  return '/medicines/tablet_default.svg';
};

/**
 * Normalizes dosage form without contradictory text
 */
export const resolveDosageForm = (med) => {
  if (med?.dosageForm && typeof med.dosageForm === 'string') return med.dosageForm;
  const combined = ((med?.brandName || '') + ' ' + (med?.power || '') + ' ' + (med?.category || '') + ' ' + (med?.genericName || '')).toLowerCase();
  if (combined.includes('vial')) return 'Single-Dose Vial';
  if (combined.includes('prefilled syringe') || combined.includes('syringe')) return 'Prefilled Syringe';
  if (combined.includes('injection') || combined.includes('inj')) return 'Injection';
  if (combined.includes('infusion') || combined.includes('iv infusion')) return 'IV Infusion';
  if (combined.includes('capsule')) return 'Capsule';
  if (combined.includes('syrup') || combined.includes('suspension')) return 'Oral Suspension';
  return 'Tablet';
};

export const resolveRoute = (med, form) => {
  if (med?.route && typeof med.route === 'string') return med.route;
  const f = (form || '').toLowerCase();
  if (f.includes('injection') || f.includes('vial') || f.includes('syringe') || f.includes('infusion')) {
    return 'Intravenous / Injection';
  }
  if (f.includes('topical') || f.includes('cream') || f.includes('ointment')) {
    return 'Topical';
  }
  if (f.includes('eye') || f.includes('ophthalmic') || f.includes('drops')) {
    return 'Ophthalmic';
  }
  return 'Oral';
};

/**
 * Redesigned MedicineDetailDrawer
 * 
 * Key Improvements:
 * 1. Primary CTA "Request This Medicine" placed prominently ABOVE THE FOLD.
 * 2. 2-column top product layout: 38% Medicine Packaging Image + 62% Product Info & Request Card.
 * 3. Dedicated dosage-form image area with tablet/capsule/vial/syrup/injection support and zero broken images.
 * 4. Structured 2-column Medicine Details grid with consistent label/value alignment.
 * 5. Distinct Selling Hospital and Lot Information cards.
 * 6. Collapsible Purchase Bill / Provenance section (collapsed by default).
 * 7. Verified composition-based alternatives with clinical safety notice.
 * 8. Mobile sticky bottom action bar.
 * 9. Defensive data helpers ensuring no `.toLocaleString()` TypeErrors.
 */
export const MedicineDetailDrawer = ({ 
  isOpen, 
  onClose, 
  medicine, 
  onRequestSubmit,
  isRequestDisabled = false,
  onOpenAlternatives,
  marketplace = []
}) => {
<<<<<<< HEAD
  // Raw medicine object tracked internally for alternative switching
  const [activeMedRaw, setActiveMedRaw] = useState(medicine);
=======
  // Active medicine state (allows navigating to alternatives internally)
  const [activeMed, setActiveMed] = useState(medicine);
>>>>>>> 6ddff35 (Added Cancel)
  const [requestQty, setRequestQty] = useState(1);
  const [requestNotes, setRequestNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [show3DView, setShow3DView] = useState(false);
  const [isInvoiceExpanded, setIsInvoiceExpanded] = useState(false);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  // Sync internal medicine when incoming prop changes
  useEffect(() => {
    setActiveMedRaw(medicine);
    setShow3DView(false);
    setIsInvoiceExpanded(false);
    setImageLoadFailed(false);
    setValidationError('');
  }, [medicine]);

<<<<<<< HEAD
  // Normalized safe medicine object guaranteed to never produce undefined field crashes
  const activeMed = useMemo(() => normalizeMedicine(activeMedRaw), [activeMedRaw]);

  useEffect(() => {
    if (activeMed) {
      const available = activeMed.quantity;
      if (available > 0) {
        setRequestQty(Math.min(10, available));
      } else {
        setRequestQty(0);
      }
    }
  }, [activeMedRaw]);
=======
  // Set default quantity safely
  useEffect(() => {
    if (activeMed?.quantity) {
      const maxQty = Math.max(1, Number(activeMed.quantity) || 1);
      setRequestQty(Math.min(10, maxQty));
    }
  }, [activeMed?.id, activeMed?.quantity]);
>>>>>>> 6ddff35 (Added Cancel)

  // Composition-matched alternatives
  const alternatives = useMemo(() => {
    if (!activeMed || !marketplace?.length) return [];
    return findAlternatives(activeMed, marketplace);
  }, [activeMed, marketplace]);

  // Composition specifications
  const compositionSpecs = useMemo(() => {
    if (!activeMed) return null;
    return extractMedicineComposition(activeMed);
  }, [activeMed]);

  // Safe pricing calculation with resilient fallback guarantees
  const pricing = useMemo(() => {
    if (!activeMed) {
      return {
        unitOriginalPrice: 0,
        unitSellingPrice: 0,
        unitFinalPrice: 0,
        unitDiscount: 0,
        quantity: 0,
        originalSubtotal: 0,
        totalSavings: 0,
        concessionSavings: 0,
        medicineSubtotal: 0,
        subtotal: 0,
        distanceKm: 12,
        isColdChain: false,
        logisticsFee: 0,
        gstRate: 0.12,
        gstAmount: 0,
        totalPayable: 0,
        tierLabel: '',
      };
    }

    const calculated = calculateOrderPricing({
      unitOriginalPrice: activeMed.unitOriginalPrice,
      expiryDate: activeMed.expiryDate !== 'Not available' ? activeMed.expiryDate : null,
      concessionPercent: activeMed.concessionPercent,
      quantity: requestQty > 0 ? requestQty : 1,
      distanceKm: activeMed.distanceKm,
      isColdChain: String(activeMed.storageType || '').toLowerCase().includes('cold')
    });

    const subtotal = Number(calculated.medicineSubtotal ?? calculated.subtotal ?? 0);
    const savings = Number(calculated.totalSavings ?? calculated.concessionSavings ?? 0);
    const gst = Number(calculated.gstAmount ?? 0);
    const total = Number(calculated.totalPayable ?? 0);
    const sellingPrice = Number(calculated.unitSellingPrice ?? calculated.unitFinalPrice ?? activeMed.unitOriginalPrice);

    return {
      ...calculated,
      subtotal,
      medicineSubtotal: subtotal,
      totalSavings: savings,
      concessionSavings: savings,
      gstAmount: gst,
      totalPayable: total,
      unitSellingPrice: sellingPrice,
      unitFinalPrice: sellingPrice,
    };
  }, [activeMed, requestQty]);

  if (!isOpen || !activeMed) return null;

<<<<<<< HEAD
  const concession = activeMed.concessionPercent || 0;
  const finalUnitPrice = pricing.unitFinalPrice;
  const totalAmount = pricing.totalPayable;
=======
  // Safe pricing calculation
  const concession = Math.max(0, Math.min(90, Number(activeMed.concessionPercent) || 0));
  const unitOriginalPrice = Math.max(0, Number(activeMed.unitOriginalPrice) || 0);

  const pricing = calculateOrderPricing({
    unitOriginalPrice,
    concessionPercent: concession,
    quantity: requestQty,
    storageType: activeMed.storageType
  });

  const finalUnitPrice = pricing?.unitSellingPrice || (unitOriginalPrice * (1 - concession / 100));
  const totalAmount = pricing?.totalPayable || (finalUnitPrice * requestQty);
>>>>>>> 6ddff35 (Added Cancel)
  const isColdChain = String(activeMed.storageType || '').toLowerCase().includes('cold');

  const dosageForm = resolveDosageForm(activeMed);
  const administrationRoute = resolveRoute(activeMed, dosageForm);
  const imageUrl = resolveMedicineImageUrl(activeMed);

  const isExpired = Boolean(activeMed?.expiryDate && new Date(activeMed.expiryDate) < new Date());

  // Requisition submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
<<<<<<< HEAD
    if (!activeMed) return;

    if (activeMed.quantity <= 0) {
      toast.error('This medicine batch is currently out of stock.');
      return;
    }

    const { isValid, error, sanitizedData } = validateRequisition(
      { quantity: requestQty, notes: requestNotes },
      activeMed
    );

    if (!isValid) {
      toast.error(error || 'Invalid requisition parameters.');
=======
    setValidationError('');

    if (isExpired) {
      setValidationError('Expired medicine cannot be requested as usable clinical inventory.');
      return;
    }

    const maxStock = Number(activeMed.quantity) || 0;
    if (requestQty < 1) {
      setValidationError('Quantity must be at least 1 unit.');
      return;
    }
    if (requestQty > maxStock) {
      setValidationError(`Requested quantity exceeds available stock (${maxStock} units).`);
>>>>>>> 6ddff35 (Added Cancel)
      return;
    }

    setIsSubmitting(true);
    try {
      await onRequestSubmit({
        medicine: activeMed,
<<<<<<< HEAD
        quantity: sanitizedData.quantity,
        notes: sanitizedData.notes,
        finalUnitPrice,
        totalAmount,
      });
=======
        quantity: requestQty,
        notes: requestNotes,
        finalUnitPrice,
        totalAmount,
      });
    } catch (err) {
      console.error('Requisition error:', err);
>>>>>>> 6ddff35 (Added Cancel)
    } finally {
      setIsSubmitting(false);
    }
  };

  // Switch inspection to an alternative medicine
  const handleSelectAlternative = (altMedicine) => {
<<<<<<< HEAD
    setActiveMedRaw(altMedicine);
    // Smoothly scroll container to top
=======
    setActiveMed(altMedicine);
    setImageLoadFailed(false);
    setValidationError('');
>>>>>>> 6ddff35 (Added Cancel)
    const container = document.getElementById('medicine-detail-modal-body');
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
      {/* Backdrop click to close */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Dialog Container */}
      <div 
        className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[calc(100vh-32px)] z-10 animate-scaleUp my-auto box-border"
        onClick={(e) => e.stopPropagation()}
        style={{ width: 'min(1100px, calc(100vw - 32px))' }}
      >
        
        {/* ================================================================= */}
        {/* 1. COMPACT HEADER WITH COMPLIANCE BADGES                          */}
        {/* ================================================================= */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200/90 flex items-center justify-between bg-white sticky top-0 z-30 backdrop-blur-md">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>VERIFIED HOSPITAL STOCK</span>
            </span>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-primary-50 text-primary-700 border border-primary-200">
              CDSCO RULE 65 COMPLIANT
            </span>
            {concession > 0 && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                {Math.round(concession)}% CONCESSION SAVINGS
              </span>
<<<<<<< HEAD
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>VERIFIED HOSPITAL STOCK</span>
              </span>
              {concession > 20 && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  {Math.round(concession)}% CONCESSION APPLIED
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              {activeMed.brandName}
            </h2>

            <div className="flex items-center gap-2 text-xs text-slate-600 font-medium flex-wrap">
              <span className="font-bold text-primary-700 font-mono">{activeMed.power}</span>
              <span className="text-slate-300">•</span>
              <span>{activeMed.genericName}</span>
              <span className="text-slate-300">•</span>
              <span className="font-semibold text-slate-500">{activeMed.dosageForm}</span>
            </div>
=======
            )}
>>>>>>> 6ddff35 (Added Cancel)
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0 cursor-pointer"
<<<<<<< HEAD
            title="Close detail view"
=======
            title="Close inspection window"
>>>>>>> 6ddff35 (Added Cancel)
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================================================================= */}
        {/* 2. SCROLLABLE PRODUCT DETAIL BODY                                 */}
        {/* ================================================================= */}
        <div 
          id="medicine-detail-modal-body" 
          className="p-4 sm:p-7 overflow-y-auto space-y-6 flex-1 bg-slate-50/40 font-sans"
        >
          
          {/* =============================================================== */}
          {/* SECTION A: ABOVE-THE-FOLD MAIN PRODUCT HERO                     */}
          {/* Desktop: 38% Product Image Card | 62% Medicine Info + CTA       */}
          {/* Mobile: Stacked with Primary Request Action right near Price   */}
          {/* =============================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
<<<<<<< HEAD
            {/* LEFT COLUMN: IMAGES, 3D PREVIEW, PURCHASE INVOICE */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Product Image Gallery with Thumbnails & Fallback */}
              <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 font-mono">
                    Product Packaging
                  </span>
                  <button
                    type="button"
                    onClick={() => setShow3DView(!show3DView)}
                    className="text-[11px] font-bold text-primary-700 hover:text-primary-800 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Box className="w-3.5 h-3.5" />
                    <span>{show3DView ? 'Show Photo Gallery' : 'View 3D Hologram'}</span>
                  </button>
                </div>
=======
            {/* --- LEFT: PRODUCT IMAGE CARD (Desktop: 38% width) --- */}
            <div className="lg:col-span-5 rounded-2xl bg-white border border-slate-200/90 p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 font-mono flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5 text-primary-600" />
                  <span>Medicine Packaging</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShow3DView(!show3DView)}
                  className="text-[11px] font-bold text-primary-700 hover:text-primary-800 transition-colors flex items-center gap-1"
                >
                  <Box className="w-3.5 h-3.5" />
                  <span>{show3DView ? 'Show Photo' : 'View 3D Model'}</span>
                </button>
              </div>
>>>>>>> 6ddff35 (Added Cancel)

              {/* Product Visual Area */}
              <div className="relative w-full h-56 sm:h-64 rounded-xl bg-gradient-to-b from-slate-50 to-slate-100/70 border border-slate-200/80 overflow-hidden flex items-center justify-center group">
                {show3DView ? (
                  <div className="w-full h-full p-2">
                    <Medicine3DPreview medicine={activeMed} />
                  </div>
                ) : !imageLoadFailed ? (
                  <>
                    <img
                      src={imageUrl}
                      alt={activeMed.brandName}
                      onError={() => setImageLoadFailed(true)}
                      className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300 cursor-zoom-in"
                      onClick={() => setIsZoomModalOpen(true)}
                    />
                    {/* Zoom Trigger Button */}
                    <button
                      type="button"
                      onClick={() => setIsZoomModalOpen(true)}
                      className="absolute bottom-2.5 right-2.5 p-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-700 shadow-sm border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold"
                    >
                      <Maximize2 className="w-3 h-3" />
                      <span>Zoom</span>
                    </button>
                    {/* Dosage Badge */}
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-sm text-slate-700 border border-slate-200 text-[10px] font-mono font-bold uppercase shadow-xs">
                      {dosageForm}
                    </div>
                  </>
                ) : (
                  /* Professional Fallback (Never shows broken image icon) */
                  <div className="p-6 text-center space-y-1.5">
                    <div className="text-3xl">💊</div>
                    <p className="text-xs font-extrabold text-slate-700">Medicine Image</p>
                    <p className="text-[11px] text-slate-400">Image not available</p>
                  </div>
                )}
              </div>

              {/* Cold Chain Storage Indicator */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500 text-[11px] flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-primary-600" />
                  <span>Storage Protocol:</span>
                </span>
                <span className={`font-bold ${isColdChain ? 'text-cyan-700' : 'text-slate-800'}`}>
                  {isColdChain ? 'Cold-Chain 2°C - 8°C' : 'Room Temp (15°C - 25°C)'}
                </span>
              </div>
            </div>

            {/* --- RIGHT: MEDICINE INFO + ABOVE-THE-FOLD PURCHASE CARD (Desktop: 62% width) --- */}
            <div className="lg:col-span-7 rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-4">
              
<<<<<<< HEAD
              {/* SELLER HOSPITAL & STOCK STATUS CARD */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">
                      Listed By Seller Hospital
                    </span>
                    <div className="flex items-center gap-1.5 text-sm font-extrabold text-slate-900">
                      <Building2 className="w-4 h-4 text-primary-600 flex-shrink-0" />
                      <span>{activeMed.hospitalName}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{activeMed.location}</span>
                      <span className="text-slate-300">•</span>
                      <span className="font-mono text-emerald-700 font-bold">{formatNumber(activeMed.distanceKm, 12)} km away</span>
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono font-extrabold shadow-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>In Stock: {formatNumber(activeMed.quantity, 0)} units</span>
                    </span>
                  </div>
                </div>

                {/* Batch, Mfg, Expiry, Storage Specs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs pt-1 font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[9px] text-slate-400 block font-bold uppercase">Batch Lot</span>
                    <span className="font-bold text-slate-800 text-xs">{activeMed.batchNo}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[9px] text-slate-400 block font-bold uppercase">Mfg Date</span>
                    <span className="font-semibold text-slate-700 text-xs">{activeMed.mfgDate}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[9px] text-slate-400 block font-bold uppercase">Expiry Date</span>
                    <span className="font-bold text-amber-700 text-xs">{activeMed.expiryDate}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[9px] text-slate-400 block font-bold uppercase">Storage</span>
                    <span className={`font-bold text-[11px] truncate block ${
                      isColdChain ? 'text-cyan-700' : 'text-slate-700'
                    }`}>
                      {isColdChain ? 'Cold 2-8°C' : 'Room Temp'}
                    </span>
                  </div>
                </div>
              </div>

              {/* COMPOSITION SPECIFICATIONS TABLE */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 font-mono flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-primary-600" />
                    <span>Active Pharmaceutical Composition</span>
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">
                    Verified Formulation
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-2 text-slate-500 font-semibold w-1/3">Active Ingredient</td>
                        <td className="py-2 text-slate-900 font-extrabold capitalize">
                          {compositionSpecs?.ingredients?.[0]?.name || activeMed.genericName}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-slate-500 font-semibold">Strength / Potency</td>
                        <td className="py-2 text-slate-900 font-extrabold font-mono">
                          {compositionSpecs?.normalizedStrength || activeMed.power}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-slate-500 font-semibold">Dosage Formulation</td>
                        <td className="py-2 text-slate-900 font-bold">
                          {compositionSpecs?.dosageForm || activeMed.dosageForm}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-slate-500 font-semibold">Administration Route</td>
                        <td className="py-2 text-slate-900 font-bold">
                          {compositionSpecs?.route || activeMed.route}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-slate-500 font-semibold">Manufacturer</td>
                        <td className="py-2 text-slate-900 font-bold">
                          {activeMed.manufacturer}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-slate-500 font-semibold">Packaging Unit</td>
                        <td className="py-2 text-slate-900 font-bold">
                          {activeMed.packSize}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* PRICING AND REQUISITION FORM */}
              <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 line-through block">
                      Standard MRP {formatCurrency(activeMed.unitOriginalPrice)} / unit
                    </span>
                    <div className="text-2xl font-black font-mono text-primary-800 leading-tight">
                      {formatCurrency(finalUnitPrice)} <span className="text-xs font-normal text-slate-500">/ unit</span>
                    </div>
=======
              {/* Medicine Identity */}
              <div className="space-y-1 border-b border-slate-100 pb-3">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                  {safeText(activeMed.brandName)}
                </h2>
                
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  <strong className="text-slate-800 font-semibold">Composition:</strong>{' '}
                  {safeText(activeMed.genericName)} • <span className="font-bold text-primary-700 font-mono">{safeText(activeMed.power)}</span>
                </p>

                <p className="text-xs text-slate-500 flex items-center gap-2 pt-0.5">
                  <span className="font-semibold text-slate-700">{dosageForm}</span>
                  <span className="text-slate-300">•</span>
                  <span>{administrationRoute}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500">Mfd by: {safeText(activeMed.manufacturer, 'Authorized Pharma')}</span>
                </p>
              </div>

              {/* Selling Hospital & Available Stock */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Selling Hospital</span>
                    <div className="text-xs font-extrabold text-slate-900 truncate">
                      {safeText(activeMed.hospitalName, 'Verified Hospital')}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono font-extrabold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Stock: {formatNumber(activeMed.quantity)} units</span>
                  </span>
                </div>
              </div>

              {/* Price & Concession Display */}
              <div className="flex flex-wrap items-baseline justify-between gap-2 pt-1">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black font-mono text-primary-800 tracking-tight">
                      ₹{formatCurrency(finalUnitPrice)}
                    </span>
                    <span className="text-xs font-normal text-slate-500">/ unit</span>
>>>>>>> 6ddff35 (Added Cancel)
                  </div>
                  {concession > 0 && (
                    <span className="text-xs font-mono text-slate-400 line-through block mt-0.5">
                      MRP ₹{formatCurrency(unitOriginalPrice)}
                    </span>
                  )}
                </div>

                {concession > 0 && (
                  <span className="px-3 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-mono font-bold shadow-xs">
                    {Math.round(concession)}% Concession Savings
                  </span>
                )}
              </div>

              {/* Requisition Form: Quantity & Action Button */}
              <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  
                  {/* Quantity Stepper */}
                  <div className="sm:col-span-6 space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>Quantity Required:</span>
<<<<<<< HEAD
                      <span className="text-slate-400 font-normal">Max: {formatNumber(activeMed.quantity, 0)}</span>
                    </div>
                    <input
                      type="number"
                      min={activeMed.quantity > 0 ? 1 : 0}
                      max={Math.max(1, activeMed.quantity)}
                      required
                      disabled={activeMed.quantity <= 0}
                      value={requestQty}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const max = Math.max(1, activeMed.quantity);
                        setRequestQty(Math.max(1, Math.min(max, Number.isFinite(val) ? val : 1)));
                      }}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-primary-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                    />
=======
                      <span className="text-slate-400 font-mono text-[11px]">Max: {formatNumber(activeMed.quantity)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setRequestQty((q) => Math.max(1, q - 1))}
                        disabled={requestQty <= 1}
                        className="w-10 h-10 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 flex items-center justify-center font-extrabold text-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={activeMed.quantity || 1}
                        value={requestQty}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (isNaN(val)) setRequestQty(1);
                          else setRequestQty(Math.max(1, Math.min(activeMed.quantity || 1, val)));
                        }}
                        className="flex-1 h-10 rounded-xl border border-slate-300 text-center font-mono font-bold text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setRequestQty((q) => Math.min(activeMed.quantity || 1, q + 1))}
                        disabled={requestQty >= (activeMed.quantity || 1)}
                        className="w-10 h-10 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 flex items-center justify-center font-extrabold text-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
                      >
                        +
                      </button>
                    </div>
>>>>>>> 6ddff35 (Added Cancel)
                  </div>

                  {/* Requisition Note */}
                  <div className="sm:col-span-6 space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Order / Clinical Note <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ICU emergency allocation"
                      value={requestNotes}
                      onChange={(e) => setRequestNotes(e.target.value)}
                      className="w-full h-10 px-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

<<<<<<< HEAD
                {/* ESCROW BREAKDOWN */}
                <div className="p-3.5 rounded-xl bg-slate-900 text-white space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Base Subtotal ({formatNumber(requestQty, 0)} units):</span>
                    <span>{formatCurrency(pricing.subtotal)}</span>
                  </div>
                  {Number(pricing.concessionSavings) > 0 && (
                    <div className="flex justify-between text-amber-400 text-[11px]">
                      <span>Concession Savings:</span>
                      <span>-{formatCurrency(pricing.concessionSavings)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>GST (12% Pharma):</span>
                    <span>+{formatCurrency(pricing.gstAmount)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-700 flex items-center justify-between font-bold">
                    <span className="text-slate-300">Total Escrow Value:</span>
                    <span className="text-base text-cyan-300">
                      {formatCurrency(pricing.totalPayable)}
=======
                {/* Validation Error Message */}
                {validationError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}

                {/* Total Escrow Strip */}
                <div className="p-3 rounded-xl bg-slate-900 text-white flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Total Escrow Value</span>
                    <span className="text-xs text-slate-300">
                      {requestQty} {requestQty === 1 ? 'unit' : 'units'} × ₹{formatCurrency(finalUnitPrice)} + 12% GST
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-cyan-300">
                      ₹{formatCurrency(totalAmount)}
>>>>>>> 6ddff35 (Added Cancel)
                    </span>
                  </div>
                </div>

                {/* --- PRIMARY CTA BUTTON (ABOVE THE FOLD!) --- */}
                <button
                  type="submit"
<<<<<<< HEAD
                  disabled={isSubmitting || isRequestDisabled || activeMed.quantity <= 0}
                  className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-lg shadow-primary-600/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{activeMed.quantity <= 0 ? 'Out of Stock' : 'Request This Medicine'}</span>
=======
                  disabled={isSubmitting || isRequestDisabled || !activeMed.quantity || activeMed.quantity < 1}
                  className="w-full py-3.5 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-extrabold text-sm tracking-wide shadow-lg shadow-primary-600/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Submitting Exchange Request...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>REQUEST THIS MEDICINE</span>
                    </>
                  )}
>>>>>>> 6ddff35 (Added Cancel)
                </button>
              </form>

            </div>

          </div>

<<<<<<< HEAD
          {/* SECTION: COMPOSITION-BASED ALTERNATIVES */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-5 h-5 text-primary-600 animate-pulse" />
                  <span>Composition-Based Alternatives</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-extrabold bg-primary-100 text-primary-800">
                  {alternatives.length} {alternatives.length === 1 ? 'Option' : 'Options'} Found
=======
          {/* =============================================================== */}
          {/* SECTION B: MEDICINE DETAILS (2-Column Desktop Grid)              */}
          {/* =============================================================== */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 font-mono flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary-600" />
                <span>Medicine Details & Pharmaceutical Specification</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">
                Verified Pharmacopoeia Data
              </span>
            </div>

            {/* Clean 2-column grid on desktop, 1 on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3.5 text-xs">
              
              {/* Item 1: Composition */}
              <div className="flex items-start justify-between border-b border-slate-100/80 pb-2">
                <span className="text-slate-500 font-semibold w-2/5">Composition</span>
                <span className="text-slate-900 font-bold w-3/5 text-right truncate">
                  {safeText(activeMed.genericName)}
>>>>>>> 6ddff35 (Added Cancel)
                </span>
              </div>

              {/* Item 2: Strength */}
              <div className="flex items-start justify-between border-b border-slate-100/80 pb-2">
                <span className="text-slate-500 font-semibold w-2/5">Strength</span>
                <span className="text-slate-900 font-extrabold font-mono w-3/5 text-right">
                  {safeText(activeMed.power)}
                </span>
              </div>

              {/* Item 3: Dosage Form */}
              <div className="flex items-start justify-between border-b border-slate-100/80 pb-2">
                <span className="text-slate-500 font-semibold w-2/5">Dosage Form</span>
                <span className="text-slate-900 font-bold w-3/5 text-right">
                  {dosageForm}
                </span>
              </div>

              {/* Item 4: Route */}
              <div className="flex items-start justify-between border-b border-slate-100/80 pb-2">
                <span className="text-slate-500 font-semibold w-2/5">Administration Route</span>
                <span className="text-slate-900 font-bold w-3/5 text-right">
                  {administrationRoute}
                </span>
              </div>

              {/* Item 5: Manufacturer */}
              <div className="flex items-start justify-between border-b border-slate-100/80 pb-2">
                <span className="text-slate-500 font-semibold w-2/5">Manufacturer</span>
                <span className="text-slate-900 font-bold w-3/5 text-right truncate">
                  {safeText(activeMed.manufacturer, 'Authorized Manufacturer')}
                </span>
              </div>

              {/* Item 6: Packaging Unit */}
              <div className="flex items-start justify-between border-b border-slate-100/80 pb-2">
                <span className="text-slate-500 font-semibold w-2/5">Packaging Unit</span>
                <span className="text-slate-900 font-bold w-3/5 text-right">
                  {safeText(activeMed.packSize, `${dosageForm} Pack`)}
                </span>
              </div>

              {/* Item 7: Brand Name */}
              <div className="flex items-start justify-between border-b border-slate-100/80 pb-2">
                <span className="text-slate-500 font-semibold w-2/5">Brand Name</span>
                <span className="text-slate-900 font-bold w-3/5 text-right truncate">
                  {safeText(activeMed.brandName)}
                </span>
              </div>

              {/* Item 8: Generic Name */}
              <div className="flex items-start justify-between border-b border-slate-100/80 pb-2">
                <span className="text-slate-500 font-semibold w-2/5">Generic Name</span>
                <span className="text-slate-900 font-bold w-3/5 text-right truncate">
                  {safeText(activeMed.genericName)}
                </span>
              </div>

            </div>
          </div>

          {/* =============================================================== */}
          {/* SECTION C: SELLER INFORMATION & LOT INFORMATION (2 Cards)       */}
          {/* Clearly differentiates Manufacturer vs Selling Hospital         */}
          {/* =============================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Card 1: SELLING HOSPITAL */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase font-mono">
                    Selling Hospital
                  </h4>
                  <span className="text-[10px] text-slate-400">Verified Marketplace Partner</span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                  <span>{safeText(activeMed.hospitalName, 'Verified Hospital')}</span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{safeText(activeMed.location, 'Central Pharmacy')}</span>
                  <span className="text-slate-300">•</span>
                  <span className="font-mono text-emerald-700 font-bold">{activeMed.distanceKm || 12} km away</span>
                </div>

                <div className="pt-1 flex items-center gap-1 text-[11px] text-emerald-800 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Licensed CDSCO inter-hospital node</span>
                </div>
              </div>
            </div>

            {/* Card 2: LOT INFORMATION */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase font-mono">
                    Lot Information
                  </h4>
                  <span className="text-[10px] text-slate-400">Batch, Manufacturing & Expiry</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[9px] text-slate-400 uppercase block font-bold">Batch Number</span>
                  <span className="font-extrabold text-slate-800 text-xs">{safeText(activeMed.batchNo, 'Not available')}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[9px] text-slate-400 uppercase block font-bold">Available Stock</span>
                  <span className="font-extrabold text-emerald-700 text-xs">{formatNumber(activeMed.quantity)} units</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[9px] text-slate-400 uppercase block font-bold">Manufacturing</span>
                  <span className="font-semibold text-slate-700 text-xs">{formatDate(activeMed.mfgDate, 'Not available')}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[9px] text-slate-400 uppercase block font-bold">Expiry Date</span>
                  <span className="font-extrabold text-amber-700 text-xs">{formatDate(activeMed.expiryDate, 'Not available')}</span>
                </div>
              </div>
            </div>

          </div>

          {/* =============================================================== */}
          {/* SECTION D: COLLAPSIBLE PURCHASE BILL / PROVENANCE INVOICE       */}
          {/* Default state: Collapsed (Does not push primary content down)    */}
          {/* =============================================================== */}
          <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setIsInvoiceExpanded(!isInvoiceExpanded)}
              className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <span>Purchase Bill / Provenance Invoice</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      Audit Ready
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isInvoiceExpanded ? 'Click to collapse provenance document' : 'View CDSCO Rule 65 verified provenance document'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary-700 font-mono hidden sm:inline">
                  {isInvoiceExpanded ? '[ Collapse ]' : '[ Expand ]'}
                </span>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isInvoiceExpanded ? 'rotate-180 text-primary-600' : ''}`} />
              </div>
            </button>

            {isInvoiceExpanded && (
              <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/50 space-y-3">
                <PurchaseInvoiceViewer medicine={activeMed} />
              </div>
            )}
          </div>

          {/* =============================================================== */}
          {/* SECTION E: COMPOSITION-BASED ALTERNATIVES                       */}
          {/* =============================================================== */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-primary-600 animate-pulse" />
                    <span>Composition-Based Alternative Medicines</span>
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-extrabold bg-primary-100 text-primary-800">
                    {alternatives.length} {alternatives.length === 1 ? 'Alternative' : 'Alternatives'} Found
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Different brands with equivalent active pharmaceutical ingredients, potency and formulation.
                </p>
              </div>
            </div>

            {/* MANDATORY CLINICAL SAFETY NOTICE */}
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed font-medium">
                {CLINICAL_SAFETY_DISCLAIMER}
              </p>
            </div>

            {/* ALTERNATIVES CARDS GRID */}
            {alternatives.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                {alternatives.map((alt) => {
<<<<<<< HEAD
                  const safeAlt = normalizeMedicine(alt);
                  const altUnitPrice = Number(safeAlt.discountedPrice ?? safeAlt.unitSellingPrice ?? safeAlt.unitOriginalPrice);
                  const hasSavings = (Number(safeAlt.savingsPerUnit) || 0) > 0;
                  const priceDiff = altUnitPrice - Number(finalUnitPrice || 0);
=======
                  const altConcession = Math.max(0, Math.min(90, Number(alt.concessionPercent) || 0));
                  const altOriginal = Number(alt.unitOriginalPrice) || 0;
                  const altUnitPrice = altOriginal * (1 - altConcession / 100);
                  const priceDifference = altUnitPrice - finalUnitPrice;
                  const isCheaper = priceDifference < -0.01;
>>>>>>> 6ddff35 (Added Cancel)

                  return (
                    <div 
                      key={safeAlt.id}
                      className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-primary-400 hover:shadow-card-hover transition-all flex flex-col justify-between space-y-3 group"
                    >
                      <div className="space-y-2">
                        {/* Alternative Badge */}
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                            <span>ALTERNATIVE</span>
                          </span>

                          <span className="text-[10px] font-mono text-slate-500">
<<<<<<< HEAD
                            {formatNumber(safeAlt.quantity, 0)} available
=======
                            {formatNumber(alt.quantity)} available
>>>>>>> 6ddff35 (Added Cancel)
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-primary-700 transition-colors">
<<<<<<< HEAD
                            {safeAlt.brandName}
                          </h4>
                          <p className="text-xs text-slate-600 font-medium mt-0.5">
                            {safeAlt.genericName} • {safeAlt.power}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Mfd by: {safeAlt.manufacturer}
=======
                            {safeText(alt.brandName)}
                          </h4>
                          <p className="text-xs text-slate-600 font-medium mt-0.5">
                            {safeText(alt.genericName)} • <span className="font-mono text-primary-700 font-bold">{safeText(alt.power)}</span>
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Mfd by: {safeText(alt.manufacturer, 'Authorized Pharma')}
>>>>>>> 6ddff35 (Added Cancel)
                          </p>
                        </div>

                        {/* Price Comparison */}
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs font-mono">
                          <div>
                            <span className="text-[9px] text-slate-400 block">Unit Price</span>
                            <span className="font-extrabold text-slate-900 text-sm">
<<<<<<< HEAD
                              {formatCurrency(altUnitPrice)} <span className="text-[9px] font-normal text-slate-500">/ unit</span>
=======
                              ₹{formatCurrency(altUnitPrice)} <span className="text-[9px] font-normal text-slate-500">/ unit</span>
>>>>>>> 6ddff35 (Added Cancel)
                            </span>
                          </div>

                          {isCheaper ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
<<<<<<< HEAD
                              ₹{formatDecimal(safeAlt.savingsPerUnit, 2)} cheaper
=======
                              ₹{formatCurrency(Math.abs(priceDifference))} cheaper
>>>>>>> 6ddff35 (Added Cancel)
                            </span>
                          ) : priceDifference > 0.01 ? (
                            <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
<<<<<<< HEAD
                              +₹{formatDecimal(priceDiff, 2)} / unit
=======
                              +₹{formatCurrency(priceDifference)} / unit
>>>>>>> 6ddff35 (Added Cancel)
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                              Equal Price
                            </span>
                          )}
                        </div>

                        {/* Seller Hospital */}
                        <div className="text-[11px] text-slate-600 flex items-center justify-between">
                          <span className="truncate font-semibold flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-primary-600 flex-shrink-0" />
<<<<<<< HEAD
                            <span className="truncate">{safeAlt.hospitalName}</span>
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 flex-shrink-0">
                            {formatNumber(safeAlt.distanceKm, 12)} km
                          </span>
                        </div>

                        {/* WHY IS THIS AN ALTERNATIVE? CHECKLIST */}
                        <div className="p-2.5 rounded-xl bg-primary-50/50 border border-primary-100 text-[10px] space-y-1 text-slate-700">
=======
                            <span className="truncate">{safeText(alt.hospitalName)}</span>
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 flex-shrink-0">
                            {alt.distanceKm || 12} km away
                          </span>
                        </div>

                        {/* Verified Equivalence Checklist */}
                        <div className="p-2 rounded-xl bg-primary-50/50 border border-primary-100 text-[10px] space-y-0.5 text-slate-700">
>>>>>>> 6ddff35 (Added Cancel)
                          <div className="font-bold text-primary-900 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-primary-600" />
                            <span>Verified Equivalence:</span>
                          </div>
<<<<<<< HEAD
                          <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-600 font-medium">
                            <div>✓ Same active ingredient</div>
                            <div>✓ Same strength ({safeAlt.power})</div>
                            <div>✓ Same dosage form ({safeAlt.dosageForm})</div>
                            <div>✓ Same route ({safeAlt.route})</div>
=======
                          <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-600">
                            <div>✓ Same composition</div>
                            <div>✓ Same potency ({safeText(alt.power)})</div>
                            <div>✓ Same form ({resolveDosageForm(alt)})</div>
                            <div>✓ Same route ({resolveRoute(alt, resolveDosageForm(alt))})</div>
>>>>>>> 6ddff35 (Added Cancel)
                          </div>
                        </div>
                      </div>

                      {/* Switch Inspection CTA */}
                      <button
                        type="button"
                        onClick={() => handleSelectAlternative(safeAlt)}
                        className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-primary-600 hover:text-white text-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 group-hover:bg-primary-600 group-hover:text-white cursor-pointer"
                      >
                        <span>View This Alternative</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
                <p className="text-xs font-bold text-slate-700">
                  No direct composition alternatives currently listed in peer hospital stock
                </p>
                <p className="text-[11px] text-slate-500">
                  Other listings have different active ingredients, strengths, or formulations.
                </p>
              </div>
            )}

          </div>

        </div>

        {/* ================================================================= */}
        {/* 3. MODAL FOOTER                                                   */}
        {/* ================================================================= */}
        <div className="px-5 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between text-xs flex-shrink-0">
          <span className="text-slate-500 text-[11px] font-mono">
            MediStock • CDSCO Rule 65 Peer Inter-Hospital Exchange
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
          >
            Close Detail View
          </button>
        </div>

        {/* ================================================================= */}
        {/* 4. MOBILE STICKY BOTTOM ACTION BAR                                */}
        {/* ================================================================= */}
        <div className="sm:hidden sticky bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 shadow-2xl flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-slate-400 font-mono block">Price per unit</span>
            <span className="text-base font-black font-mono text-primary-800">
              ₹{formatCurrency(finalUnitPrice)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isRequestDisabled || !activeMed.quantity || activeMed.quantity < 1}
            className="flex-1 py-2.5 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>REQUEST ({requestQty})</span>
          </button>
        </div>

      </div>

      {/* =================================================================== */}
      {/* 5. FULLSCREEN IMAGE ZOOM MODAL                                      */}
      {/* =================================================================== */}
      {isZoomModalOpen && (
        <div 
          className="fixed inset-0 z-60 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setIsZoomModalOpen(false)}
        >
          <div 
            className="relative max-w-2xl w-full bg-white rounded-3xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">{activeMed.brandName}</h4>
                <p className="text-xs text-slate-500">{activeMed.genericName} • {dosageForm}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsZoomModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="h-80 sm:h-96 w-full rounded-2xl bg-slate-50 flex items-center justify-center p-4 overflow-hidden border border-slate-100">
              <img
                src={imageUrl}
                alt={activeMed.brandName}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MedicineDetailDrawer;
