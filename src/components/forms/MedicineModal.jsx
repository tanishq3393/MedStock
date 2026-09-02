import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { Calculator, Sparkles, AlertTriangle, ShieldCheck, ThermometerSnowflake } from 'lucide-react';
import toast from 'react-hot-toast';

export const MedicineModal = ({ isOpen, onClose, onSubmit, initialData = null, isEdit = false }) => {
  const [formData, setFormData] = useState({
    brandName: '',
    genericName: '',
    power: '',
    category: 'Critical Care / Antibiotic',
    storageType: 'Room Temperature (15°C - 25°C)',
    expiryDate: '',
    batchNo: '',
    manufacturer: '',
    quantity: 100,
    unitOriginalPrice: 500,
    concessionPercent: 20,
    notes: '',
  });

  const [autoSuggestedConcession, setAutoSuggestedConcession] = useState(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        brandName: initialData.brandName || '',
        genericName: initialData.genericName || '',
        power: initialData.power || '',
        category: initialData.category || 'Critical Care / Antibiotic',
        storageType: initialData.storageType || 'Room Temperature (15°C - 25°C)',
        expiryDate: initialData.expiryDate || '',
        batchNo: initialData.batchNo || '',
        manufacturer: initialData.manufacturer || '',
        quantity: initialData.quantity || 100,
        unitOriginalPrice: initialData.unitOriginalPrice || 500,
        concessionPercent: initialData.concessionPercent ?? 20,
        notes: initialData.notes || '',
      });
    } else {
      setFormData({
        brandName: '',
        genericName: '',
        power: '',
        category: 'Critical Care / Antibiotic',
        storageType: 'Room Temperature (15°C - 25°C)',
        expiryDate: '',
        batchNo: 'BAT-' + Math.floor(10000 + Math.random() * 90000),
        manufacturer: '',
        quantity: 50,
        unitOriginalPrice: 400,
        concessionPercent: 20,
        notes: '',
      });
      setAutoSuggestedConcession(null);
    }
  }, [initialData, isOpen]);

  // Dynamic concession calculation based on shelf life
  const handleDateChange = (dateVal) => {
    setFormData((prev) => ({ ...prev, expiryDate: dateVal }));
    if (!dateVal) return;

    const today = new Date();
    const exp = new Date(dateVal);
    const diffMonths = (exp.getFullYear() - today.getFullYear()) * 12 + (exp.getMonth() - today.getMonth());

    let suggested = 15;
    if (diffMonths <= 2) {
      suggested = 50;
    } else if (diffMonths <= 4) {
      suggested = 40;
    } else if (diffMonths <= 6) {
      suggested = 30;
    } else if (diffMonths <= 12) {
      suggested = 20;
    } else {
      suggested = 15;
    }

    setAutoSuggestedConcession(suggested);
    // Auto apply if creating fresh
    if (!isEdit) {
      setFormData((prev) => ({ ...prev, concessionPercent: suggested }));
    }
  };

  const finalUnitPrice = Math.round(
    formData.unitOriginalPrice * (1 - (formData.concessionPercent || 0) / 100) * 100
  ) / 100;

  const totalLotValue = Math.round(finalUnitPrice * formData.quantity);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.brandName || !formData.power || !formData.expiryDate) {
      toast.error('Please fill all mandatory fields (Brand, Power, Expiry Date)');
      return;
    }
    onSubmit(formData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Medicine Inventory' : 'Add Medicine to Verified Inventory'}
      subtitle="Enter pharmaceutical batch specifications, cold-chain storage parameters, and expiry discount."
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Row 1: Brand & Generic */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Brand Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Meropenem IV, Augmentin"
              value={formData.brandName}
              onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Generic Composition / Formulation
            </label>
            <input
              type="text"
              placeholder="e.g. Meropenem Trihydrate IP"
              value={formData.genericName}
              onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Row 2: Power & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Strength / Power <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 1g IV Vial, 625mg Tab, 40mg/0.4ml"
              value={formData.power}
              onChange={(e) => setFormData({ ...formData, power: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Therapeutic Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white"
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

        {/* Row 3: Storage Type & Batch No */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Storage Condition / Cold Chain <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.storageType}
              onChange={(e) => setFormData({ ...formData, storageType: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white font-medium"
            >
              <option value="Room Temperature (15°C - 25°C)">Room Temperature (15°C - 25°C)</option>
              <option value="Cold Storage (2°C - 8°C)">Cold Storage (2°C - 8°C)</option>
              <option value="Deep Freeze (-20°C)">Deep Freeze (-20°C)</option>
              <option value="Protect from Light (<25°C)">Protect from Light (&lt;25°C)</option>
              <option value="Dry & Cool (<25°C)">Dry & Cool (&lt;25°C)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Batch / Lot Number
            </label>
            <input
              type="text"
              placeholder="e.g. MP23G418"
              value={formData.batchNo}
              onChange={(e) => setFormData({ ...formData, batchNo: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none font-mono"
            />
          </div>
        </div>

        {/* Row 4: Manufacturer & Expiry Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Manufacturer Pharma House
            </label>
            <input
              type="text"
              placeholder="e.g. Sanofi India, AstraZeneca, Cipla"
              value={formData.manufacturer}
              onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none"
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
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Concession Calculator Panel */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-primary-50/70 to-slate-50 border border-primary-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-primary-600" />
              <span className="text-xs font-bold text-primary-800">Smart Concession Calculator</span>
            </div>
            {autoSuggestedConcession !== null && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                Algorithm Suggestion: {autoSuggestedConcession}%
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Available Quantity (Units)
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Math.max(1, Number(e.target.value)) })}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Original MRP / Bill (₹ / unit)
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.unitOriginalPrice}
                onChange={(e) => setFormData({ ...formData, unitOriginalPrice: Math.max(1, Number(e.target.value)) })}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-semibold text-slate-600">
                  Concession Offered
                </label>
                <span className="text-xs font-bold text-primary-700">{formData.concessionPercent}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                step="1"
                value={formData.concessionPercent}
                onChange={(e) => setFormData({ ...formData, concessionPercent: Number(e.target.value) })}
                className="w-full accent-primary-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Pricing Preview Pill */}
          <div className="flex flex-wrap items-center justify-between pt-2 border-t border-primary-200/60 text-xs">
            <div>
              <span className="text-slate-500">Discounted Unit Price: </span>
              <span className="font-bold text-slate-800">₹{finalUnitPrice}</span>
              <span className="text-slate-400 line-through text-[11px] ml-1.5">₹{formData.unitOriginalPrice}</span>
            </div>
            <div>
              <span className="text-slate-500">Total Lot Settlement: </span>
              <span className="font-extrabold text-primary-700 text-sm">₹{totalLotValue.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Storage & Quality Verification Notes
          </label>
          <textarea
            rows="2"
            placeholder="e.g. Original packaging sealed, digital data logger temperature verified at 4°C."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none"
          />
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-md shadow-primary-500/20 transition-all"
          >
            {isEdit ? 'Save Changes' : 'Publish to Inventory'}
          </button>
        </div>

      </form>
    </Modal>
  );
};

export default MedicineModal;
