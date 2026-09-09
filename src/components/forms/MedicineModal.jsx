import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { Calculator, Sparkles, AlertTriangle, ShieldCheck, ThermometerSnowflake, Package, Layers, Info } from 'lucide-react';
import { calculateConcessionRate } from '../../utils/pricingUtils';
import { calculateMedicineExpiry } from '../../utils/expiryUtils';
import { validateMedicineForm } from '../../utils/validation';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { getStoredItem, KEYS } from '../../services/storage';
import toast from 'react-hot-toast';

export const MedicineModal = ({ isOpen, onClose, onSubmit, initialData = null, isEdit = false }) => {
  const [formData, setFormData] = useState({
    medicineId: '',
    medicineName: '',
    brandName: '',
    genericName: '',
    power: '',
    form: 'Tablet',
    category: 'Critical Care / Antibiotic',
    storageType: 'Room Temperature (15°C - 25°C)',
    mfgDate: '',
    expiryDate: '',
    batchNo: '',
    manufacturer: '',
    quantity: 100,
    unitOriginalPrice: 500,
    minStockLevel: 20,
    concessionPercent: 20,
    notes: '',
  });

  const [autoSuggestedConcession, setAutoSuggestedConcession] = useState(null);
  const [masterMedicines, setMasterMedicines] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setMasterMedicines(getStoredItem(KEYS.MASTER_MEDICINES, []));
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        medicineId: initialData.medicineId || '',
        medicineName: initialData.brandName || initialData.medicineName || '',
        brandName: initialData.brandName || '',
        genericName: initialData.genericName || '',
        power: initialData.power || '',
        form: initialData.form || initialData.dosageForm || 'Tablet',
        category: initialData.category || 'Critical Care / Antibiotic',
        storageType: initialData.storageType || 'Room Temperature (15°C - 25°C)',
        mfgDate: initialData.mfgDate || '',
        expiryDate: initialData.expiryDate || '',
        batchNo: initialData.batchNo || '',
        manufacturer: initialData.manufacturer || '',
        quantity: initialData.quantity || 100,
        unitOriginalPrice: initialData.unitOriginalPrice || 500,
        minStockLevel: initialData.minStockLevel || 20,
        concessionPercent: initialData.concessionPercent ?? 20,
        notes: initialData.notes || '',
      });
    } else {
      const today = new Date().toISOString().split('T')[0];
      const futureDate = new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0];
      setFormData({
        medicineId: '',
        medicineName: '',
        brandName: '',
        genericName: '',
        power: '',
        form: 'Tablet',
        category: 'Critical Care / Antibiotic',
        storageType: 'Room Temperature (15°C - 25°C)',
        mfgDate: today,
        expiryDate: futureDate,
        batchNo: 'BAT-' + Math.floor(10000 + Math.random() * 90000),
        manufacturer: '',
        quantity: 50,
        unitOriginalPrice: 350,
        minStockLevel: 20,
        concessionPercent: 15,
        notes: '',
      });
      setAutoSuggestedConcession(null);
    }
  }, [initialData, isOpen]);

  // Dynamic concession calculation based on shelf life
  const handleDateChange = (dateVal) => {
    setFormData((prev) => ({ ...prev, expiryDate: dateVal }));
    if (!dateVal) return;

    const suggested = calculateConcessionRate(dateVal);
    setAutoSuggestedConcession(suggested);
    if (!isEdit) {
      setFormData((prev) => ({ ...prev, concessionPercent: suggested }));
    }
  };

  const handleBrandNameChange = (val) => {
    const trimmed = val.trim().toLowerCase();
    const match = masterMedicines.find(
      (m) =>
        (m.medicineName || '').trim().toLowerCase() === trimmed ||
        (m.brandName || '').trim().toLowerCase() === trimmed
    );

    if (match) {
      setFormData((prev) => ({
        ...prev,
        brandName: val,
        medicineName: match.medicineName || match.brandName,
        genericName: match.genericName || prev.genericName,
        power: match.strength || match.power || prev.power,
        form: match.dosageForm || match.form || prev.form,
        category: match.category || prev.category,
        manufacturer: match.manufacturer || prev.manufacturer,
        storageType: match.storageType || prev.storageType,
        medicineId: match.id,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        brandName: val,
        medicineName: val,
      }));
    }
  };

  const finalUnitPrice = Math.round(
    formData.unitOriginalPrice * (1 - (formData.concessionPercent || 0) / 100) * 100
  ) / 100;

  const expiryEvaluation = formData.expiryDate ? calculateMedicineExpiry(formData.expiryDate, formData.quantity) : null;

  const handleSubmit = (e) => {
    e.preventDefault();

    const { isValid, errors, sanitizedData } = validateMedicineForm(formData);
    if (!isValid) {
      const firstError = Object.values(errors)[0];
      toast.error(firstError || 'Please correct form validation errors.');
      return;
    }

    // Defensive safeguard: Expired medicines cannot be added to active trade stock
    const exp = calculateMedicineExpiry(sanitizedData.expiryDate, sanitizedData.quantity);
    if (exp.isExpired && !isEdit) {
      toast.error('Cannot add an expired medicine batch to active stock. Please route expired items to Bio-Waste Disposal.');
      return;
    }

    onSubmit(sanitizedData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Medicine Record' : 'Add Medicine to Hospital Inventory'}
      subtitle="Enter pharmaceutical specifications, batch identification, cold chain conditions, and inventory thresholds."
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        
        {/* Field 1 & 2: Medicine Name / Brand Name & Generic Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Medicine / Brand Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              list="master-medicines-catalogue-datalist"
              placeholder="e.g. Augmentin 625 Duo, Meropenem IV"
              value={formData.brandName}
              onChange={(e) => handleBrandNameChange(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none font-semibold text-slate-900"
            />
            <datalist id="master-medicines-catalogue-datalist">
              {masterMedicines.map((m) => (
                <option key={m.id} value={m.medicineName || m.brandName}>
                  {m.genericName ? `${m.genericName} • ${m.strength || m.power}` : m.category}
                </option>
              ))}
            </datalist>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Generic / Composition Name
            </label>
            <input
              type="text"
              placeholder="e.g. Amoxicillin + Clavulanic Acid"
              value={formData.genericName}
              onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Field 3 & 4 & 5: Dosage/Strength, Form & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Dosage / Strength <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 625mg, 1g IV Vial, 40mg/0.4ml"
              value={formData.power}
              onChange={(e) => setFormData({ ...formData, power: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Dosage Form <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.form}
              onChange={(e) => setFormData({ ...formData, form: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white font-medium text-slate-800"
            >
              <option value="Tablet">Tablet</option>
              <option value="Capsule">Capsule</option>
              <option value="Syrup">Syrup</option>
              <option value="Injection / Vial">Injection / Vial</option>
              <option value="Infusion Bottle">Infusion Bottle</option>
              <option value="Pre-filled Syringe / Pen">Pre-filled Syringe / Pen</option>
              <option value="Ampoule">Ampoule</option>
              <option value="Suspension">Suspension</option>
              <option value="Ointment / Gel">Ointment / Gel</option>
              <option value="Inhaler">Inhaler</option>
              <option value="Drops">Drops</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Therapeutic Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white text-xs"
            >
              <option value="Critical Care / Antibiotic">Critical Care / Antibiotic</option>
              <option value="Cardiology / Hematology">Cardiology / Hematology</option>
              <option value="Emergency / Plasma expander">Emergency / Plasma expander</option>
              <option value="Oncology">Oncology</option>
              <option value="Diabetes Care">Diabetes Care</option>
              <option value="Gastroenterology">Gastroenterology</option>
              <option value="Steroids / Anti-inflammatory">Steroids / Anti-inflammatory</option>
              <option value="Analgesics / Antipyretic">Analgesics / Antipyretic</option>
            </select>
          </div>
        </div>

        {/* Field 6 & 7 & 8: Batch No, Manufacturer & Storage Condition */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Batch / Lot Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. BAT-88210"
              value={formData.batchNo}
              onChange={(e) => setFormData({ ...formData, batchNo: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Manufacturer Pharma
            </label>
            <input
              type="text"
              placeholder="e.g. Cipla, Sun Pharma, GSK"
              value={formData.manufacturer}
              onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Storage Condition
            </label>
            <select
              value={formData.storageType}
              onChange={(e) => setFormData({ ...formData, storageType: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white font-medium"
            >
              <option value="Room Temperature (15°C - 25°C)">Room Temperature (15°C - 25°C)</option>
              <option value="Cold Storage (2°C - 8°C)">Cold Storage (2°C - 8°C)</option>
              <option value="Deep Freeze (-20°C)">Deep Freeze (-20°C)</option>
              <option value="Protect from Light (<25°C)">Protect from Light (&lt;25°C)</option>
              <option value="Dry & Cool (<25°C)">Dry & Cool (&lt;25°C)</option>
            </select>
          </div>
        </div>

        {/* Field 9 & 10: Manufacturing Date & Expiry Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Manufacturing Date (MFG)
            </label>
            <input
              type="date"
              value={formData.mfgDate}
              onChange={(e) => setFormData({ ...formData, mfgDate: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Expiry Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.expiryDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none font-mono font-bold"
            />
          </div>
        </div>

        {/* Expiry Evaluation Callout */}
        {expiryEvaluation && (
          <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
            expiryEvaluation.isExpired 
              ? 'bg-rose-50 border-rose-200 text-rose-800' 
              : expiryEvaluation.isNearExpiry
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 flex-shrink-0" />
              <span>
                {expiryEvaluation.isExpired ? (
                  <><strong>Expiry Status:</strong> Expired ({Math.abs(expiryEvaluation.daysRemaining)} days ago). This batch will be tracked in inventory and available in <strong>Bio-Waste Disposal</strong>.</>
                ) : expiryEvaluation.isNearExpiry ? (
                  <><strong>Expiry Status:</strong> Expiring soon in {expiryEvaluation.daysRemaining} days. Eligible for redistribution discount.</>
                ) : (
                  <><strong>Expiry Status:</strong> Valid active stock ({expiryEvaluation.daysRemaining} days shelf life remaining).</>
                )}
              </span>
            </div>
            <span className="font-bold uppercase text-[10px] tracking-wider px-2 py-0.5 rounded-full bg-white/70">
              {expiryEvaluation.label}
            </span>
          </div>
        )}

        {/* Field 11, Quantity, Unit Price & Minimum Stock Level */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-primary-50/70 to-slate-50 border border-primary-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-primary-600" />
              <span className="text-xs font-bold text-primary-900">Stock Quantity & Unit Price Parameters</span>
            </div>
            {autoSuggestedConcession !== null && !expiryEvaluation?.isExpired && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                Algorithm Suggestion: {autoSuggestedConcession}%
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Stock Quantity (Units) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Math.max(1, Number(e.target.value)) })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Unit Price (₹ / unit) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.unitOriginalPrice}
                onChange={(e) => setFormData({ ...formData, unitOriginalPrice: Math.max(1, Number(e.target.value)) })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Minimum Stock Level (Buffer)
              </label>
              <input
                type="number"
                min="0"
                value={formData.minStockLevel}
                onChange={(e) => setFormData({ ...formData, minStockLevel: Math.max(0, Number(e.target.value)) })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-mono font-bold"
                placeholder="e.g. 20 units"
              />
            </div>
          </div>

          {/* Pricing Summary Row */}
          <div className="flex flex-wrap items-center justify-between pt-2 border-t border-primary-200/60 text-xs">
            <div>
              <span className="text-slate-500">Unit MRP: </span>
              <span className="font-bold text-slate-900 font-mono">₹{formData.unitOriginalPrice}</span>
              {formData.concessionPercent > 0 && !expiryEvaluation?.isExpired && (
                <span className="text-emerald-700 font-bold ml-2">({formData.concessionPercent}% discount: ₹{finalUnitPrice}/unit)</span>
              )}
            </div>
            <div>
              <span className="text-slate-500">Total Lot Value: </span>
              <span className="font-extrabold text-primary-700 font-mono text-sm">
                {formatCurrency(Number(formData.unitOriginalPrice || 0) * Number(formData.quantity || 0))}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Storage & Quality Notes
          </label>
          <textarea
            rows="2"
            placeholder="e.g. Original packaging sealed, temperature data logger verified, hospital central pharmacy bay A-3."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none"
          />
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-md shadow-primary-500/20 transition-all"
          >
            {isEdit ? 'Save Changes' : 'Add to Hospital Inventory'}
          </button>
        </div>

      </form>
    </Modal>
  );
};

export default MedicineModal;
