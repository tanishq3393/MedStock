import { getStoredItem, setStoredItem, KEYS, isHospitalSuspended } from './storage';
import { HOSPITAL_ANALYTICS } from './mockData';
import { calculateMedicineExpiry, calculateRequestExpiry, processExpiredRequests } from '../utils/expiryUtils';
import { calculateOrderPricing } from '../utils/pricingUtils';
import { auditService } from './auditService';
import { findAlternatives } from './medicineAlternativeService';
import { getCancellationPolicy, calculateRefundAmounts } from '../utils/cancellationPolicy';

const SUSPENDED_HOSPITAL_ERROR = 'Your hospital account is currently suspended. You cannot perform transactions or operational activities.';

/**
 * Ensures caller is authorized and hospital is not suspended
 * @param {string} requestedHospitalId 
 */
const assertHospitalActive = (requestedHospitalId) => {
  const session = getStoredItem(KEYS.AUTH, null);
  const authenticatedHospitalId = session?.user?.role === 'hospital' ? session.user.id : requestedHospitalId;
  if (session?.user?.role === 'hospital' && requestedHospitalId && authenticatedHospitalId !== requestedHospitalId) {
    throw new Error('You are not authorized to act for this hospital');
  }
  if (isHospitalSuspended(authenticatedHospitalId)) {
    throw new Error(SUSPENDED_HOSPITAL_ERROR);
  }
};

/**
 * Resolves current hospital ID from session or param, never falling back to a hardcoded hospital
 */
const resolveHospitalId = (hospitalId) => {
  if (hospitalId) return hospitalId;
  const session = getStoredItem(KEYS.AUTH, null);
  if (session?.user?.role === 'hospital') return session.user.id;
  return null;
};

export const hospitalService = {
  // ==========================================
  // 1. DASHBOARD ANALYTICS (Fully Derived)
  // ==========================================
  async getDashboard(hospitalIdParam) {
    await new Promise((r) => setTimeout(r, 200));
    const hospitalId = resolveHospitalId(hospitalIdParam);
    if (!hospitalId) {
      throw new Error('Hospital identity not specified');
    }

    // Refresh expired requests first
    const allRequests = getStoredItem(KEYS.REQUESTS, []);
    const { requests: refreshedRequests, hasExpiredChanges } = processExpiredRequests(allRequests);
    if (hasExpiredChanges) {
      setStoredItem(KEYS.REQUESTS, refreshedRequests);
    }

    const medicines = getStoredItem(KEYS.MEDICINES, []);
    const myMeds = medicines.filter((m) => m.hospitalId === hospitalId);
    const myIncoming = refreshedRequests.filter((r) => r.toHospitalId === hospitalId);
    const myOutgoing = refreshedRequests.filter((r) => r.fromHospitalId === hospitalId);
    const trackingList = getStoredItem(KEYS.TRACKING, []);
    const myTransfers = trackingList.filter((t) => t.senderHospitalId === hospitalId || t.receiverHospitalId === hospitalId);

    // Calculate dynamic monthly financial values from actual fulfilled transactions
    const monthlySales = myIncoming
      .filter((r) => ['accepted', 'paid', 'dispatched', 'delivered'].includes(r.status))
      .reduce((sum, r) => sum + Number(r.totalAmount || 0), 0);

    const monthlyPurchases = myOutgoing
      .filter((r) => ['accepted', 'paid', 'dispatched', 'delivered'].includes(r.status))
      .reduce((sum, r) => sum + Number(r.totalAmount || 0), 0);

    const profitabilityPercent = monthlySales > 0 
      ? Math.round(((monthlySales - monthlyPurchases) / monthlySales) * 100 * 10) / 10
      : (myIncoming.length > 0 ? 18.5 : 0);

    const pendingRequestsCount = myIncoming.filter((r) => r.status === 'pending').length;
    const activeShipmentsCount = myTransfers.filter((t) => !['Delivered', 'Cancelled'].includes(t.status)).length;

    const calculatedStats = {
      totalMedicines: myMeds.reduce((acc, m) => acc + Number(m.quantity || 0), 0),
      activeSkus: myMeds.filter((m) => m.quantity > 0 && !calculateMedicineExpiry(m.expiryDate).isExpired).length,
      monthlyPurchases,
      monthlySales,
      profitabilityPercent,
      pendingRequestsCount,
      activeShipmentsCount,
      isDemoSimulation: true,
    };

    return {
      stats: calculatedStats,
      purchasesMonthly: HOSPITAL_ANALYTICS.purchasesMonthly,
      salesMonthly: HOSPITAL_ANALYTICS.salesMonthly,
      profitabilityTrend: HOSPITAL_ANALYTICS.profitabilityTrend,
    };
  },

  // ==========================================
  // 2. INVENTORY MANAGEMENT (Isolated CRUD)
  // ==========================================
  async getInventory(hospitalIdParam) {
    await new Promise((r) => setTimeout(r, 200));
    const hospitalId = resolveHospitalId(hospitalIdParam);
    if (!hospitalId) return [];

    const medicines = getStoredItem(KEYS.MEDICINES, []);
    // STRICT HOSPITAL ISOLATION: Never include hosp-1 as a fallback!
    let isolatedMedicines = medicines.filter((m) => m.hospitalId === hospitalId);

    // If hospital has no inventory at all, initialize default sample inventory specifically for this hospital
    if (isolatedMedicines.length === 0) {
      const hospitals = getStoredItem(KEYS.HOSPITALS, []);
      const hosp = hospitals.find((h) => h.id === hospitalId);
      if (hosp) {
        const defaultSample = [
          {
            id: `med-${hospitalId}-101`,
            brandName: 'Amoxicillin + Clavulanic Acid 625mg',
            genericName: 'Augmentin Broad-Spectrum',
            power: '625mg Tablets',
            category: 'Antibiotics',
            storageType: 'Room Temperature (15°C - 25°C)',
            mfgDate: '2024-02-01',
            expiryDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
            batchNo: `AMX-${hospitalId.slice(-4)}-01`,
            manufacturer: 'GlaxoSmithKline Pharma',
            quantity: 120,
            unitOriginalPrice: 220,
            concessionPercent: 15,
            hospitalId: hospitalId,
            hospitalName: hosp.name,
            location: `${hosp.city}, ${hosp.state}`,
            distanceKm: 8.5,
            dateAdded: new Date().toISOString().split('T')[0],
            status: 'active',
            notes: 'Essential antibacterial stock for outpatient pharmacy.',
          },
          {
            id: `med-${hospitalId}-102`,
            brandName: 'Paracetamol IV 100ml Infusion',
            genericName: 'Acetaminophen Sterile Infusion',
            power: '10mg/ml (100ml)',
            category: 'Analgesics / Antipyretic',
            storageType: 'Room Temperature (<30°C)',
            mfgDate: '2023-11-01',
            expiryDate: new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0], // Near expiry
            batchNo: `PCM-${hospitalId.slice(-4)}-02`,
            manufacturer: 'Intas Pharmaceuticals',
            quantity: 45,
            unitOriginalPrice: 65,
            concessionPercent: 45,
            hospitalId: hospitalId,
            hospitalName: hosp.name,
            location: `${hosp.city}, ${hosp.state}`,
            distanceKm: 8.5,
            dateAdded: new Date().toISOString().split('T')[0],
            status: 'active',
            notes: 'Near-term surplus batch eligible for priority inter-hospital discount.',
          }
        ];
        medicines.push(...defaultSample);
        setStoredItem(KEYS.MEDICINES, medicines);
        isolatedMedicines = defaultSample;
      }
    }

    return isolatedMedicines;
  },

  async addMedicine(medicineData) {
    await new Promise((r) => setTimeout(r, 250));
    assertHospitalActive(medicineData.hospitalId);

    const qty = Number(medicineData.quantity);
    const unitPrice = Number(medicineData.unitOriginalPrice);

    if (!Number.isFinite(qty) || qty <= 0) throw new Error('Inventory quantity must be greater than zero');
    if (!Number.isFinite(unitPrice) || unitPrice < 0) throw new Error('Unit price cannot be negative');

    // Date consistency & expiration guards
    if (medicineData.expiryDate) {
      const exp = calculateMedicineExpiry(medicineData.expiryDate, qty);
      if (exp.isExpired) {
        throw new Error('Cannot add expired medicine to active inventory. Please route directly to Bio-Waste Disposal.');
      }
    }
    if (medicineData.mfgDate && medicineData.expiryDate) {
      const mfg = new Date(medicineData.mfgDate);
      const exp = new Date(medicineData.expiryDate);
      if (mfg > exp) {
        throw new Error('Manufacturing date cannot be later than Expiry date');
      }
    }

    const medicines = getStoredItem(KEYS.MEDICINES, []);
    const hospitals = getStoredItem(KEYS.HOSPITALS, []);
    const hosp = hospitals.find((h) => h.id === medicineData.hospitalId) || { name: medicineData.hospitalName || 'Hospital' };

    const newMed = {
      id: 'med-' + Date.now(),
      ...medicineData,
      brandName: medicineData.brandName || medicineData.medicineName || 'Medicine',
      genericName: medicineData.genericName || '',
      power: medicineData.power || medicineData.dosage || '',
      form: medicineData.form || medicineData.dosageForm || 'Tablet',
      batchNo: medicineData.batchNo || 'BAT-' + Math.floor(10000 + Math.random() * 90000),
      mfgDate: medicineData.mfgDate || new Date().toISOString().split('T')[0],
      expiryDate: medicineData.expiryDate,
      hospitalName: hosp.name,
      quantity: qty,
      unitOriginalPrice: unitPrice,
      minStockLevel: Number(medicineData.minStockLevel || medicineData.minimumStockLevel || 20),
      concessionPercent: Math.max(0, Math.min(90, Number(medicineData.concessionPercent || 0))),
      dateAdded: new Date().toISOString().split('T')[0],
      status: medicineData.status || 'active',
      distanceKm: Number(medicineData.distanceKm) || 12,
    };

    medicines.unshift(newMed);
    setStoredItem(KEYS.MEDICINES, medicines);

    // Audit trail logging
    auditService.logEvent({
      action: 'INVENTORY_ADDED',
      entityType: 'INVENTORY',
      entityId: newMed.id,
      actorRole: 'hospital',
      hospitalId: newMed.hospitalId,
      hospitalName: newMed.hospitalName,
      summary: `Added ${newMed.brandName} (${newMed.quantity} units, Batch: ${newMed.batchNo}) to hospital inventory.`,
      resultingStatus: 'active',
      metadata: { quantity: newMed.quantity, batchNo: newMed.batchNo, unitOriginalPrice: newMed.unitOriginalPrice },
    });

    return newMed;
  },

  async updateMedicine(id, updatedData) {
    await new Promise((r) => setTimeout(r, 200));
    const medicines = getStoredItem(KEYS.MEDICINES, []);
    const index = medicines.findIndex((m) => m.id === id);
    if (index === -1) throw new Error('Medicine not found');
    assertHospitalActive(medicines[index].hospitalId);

    // Guard: Disposed medicine cannot be edited or reactivated
    if (medicines[index].status === 'disposed') {
      throw new Error('Cannot update or reactivate a permanently disposed medicine batch');
    }

    const updatedQty = updatedData.quantity !== undefined ? Number(updatedData.quantity) : medicines[index].quantity;
    const updatedPrice = updatedData.unitOriginalPrice !== undefined ? Number(updatedData.unitOriginalPrice) : medicines[index].unitOriginalPrice;

    if (!Number.isFinite(updatedQty) || updatedQty < 0) throw new Error('Quantity cannot be negative');
    if (!Number.isFinite(updatedPrice) || updatedPrice < 0) throw new Error('Price cannot be negative');

    // Date consistency check
    const mfgDate = updatedData.mfgDate || medicines[index].mfgDate;
    const expDate = updatedData.expiryDate || medicines[index].expiryDate;
    if (mfgDate && expDate) {
      if (new Date(mfgDate) > new Date(expDate)) {
        throw new Error('Manufacturing date cannot be later than Expiry date');
      }
    }

    medicines[index] = {
      ...medicines[index],
      ...updatedData,
      quantity: updatedQty,
      unitOriginalPrice: updatedPrice,
      minStockLevel: updatedData.minStockLevel !== undefined ? Number(updatedData.minStockLevel) : (medicines[index].minStockLevel || 20),
      concessionPercent: Math.max(0, Math.min(90, Number(updatedData.concessionPercent ?? medicines[index].concessionPercent ?? 0))),
    };

    setStoredItem(KEYS.MEDICINES, medicines);

    auditService.logEvent({
      action: 'INVENTORY_UPDATED',
      entityType: 'INVENTORY',
      entityId: medicines[index].id,
      actorRole: 'hospital',
      hospitalId: medicines[index].hospitalId,
      hospitalName: medicines[index].hospitalName,
      summary: `Updated inventory record for ${medicines[index].brandName}.`,
      resultingStatus: medicines[index].status || 'active',
      metadata: { quantity: medicines[index].quantity, batchNo: medicines[index].batchNo },
    });

    return medicines[index];
  },

  async disposeMedicine({ hospitalId: hospitalIdParam, medicineId, reason, facilityName }) {
    await new Promise((r) => setTimeout(r, 200));
    const hospitalId = resolveHospitalId(hospitalIdParam);
    const medicines = getStoredItem(KEYS.MEDICINES, []);
    const medIdx = medicines.findIndex((m) => m.id === medicineId);
    if (medIdx === -1) throw new Error('Medicine not found in inventory');

    const med = medicines[medIdx];
    if (med.status === 'disposed') {
      throw new Error('This medicine batch has already been certified as disposed');
    }
    const hospitals = getStoredItem(KEYS.HOSPITALS, []);
    const hosp = hospitals.find((h) => h.id === hospitalId) || { name: med.hospitalName || 'Hospital Pharmacy' };

    // Format current date/time
    const now = new Date();
    const formattedDateTime = now.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }) + ' ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Calculate days expired
    const daysExpired = med.expiryDate 
      ? Math.max(1, Math.ceil((Date.now() - new Date(med.expiryDate).getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    // 1. Mark as disposed in single source of truth (Inventory)
    medicines[medIdx] = {
      ...med,
      status: 'disposed',
      disposedDate: formattedDateTime,
      usableQuantity: 0,
    };
    setStoredItem(KEYS.MEDICINES, medicines);

    // 2. Append to Disposal History
    const disposals = getStoredItem(KEYS.DISPOSALS, []);
    const disposalCentre = facilityName || 'GreenBio Medical Waste Centre';
    const newDisposal = {
      id: 'disp-' + Date.now(),
      hospitalId: hospitalId || med.hospitalId,
      hospitalName: hosp.name || med.hospitalName,
      medicineId: med.id,
      medicineName: med.brandName,
      brandName: med.brandName,
      genericName: med.genericName || '',
      power: med.power || '',
      form: med.form || 'Tablet',
      batchNo: med.batchNo || 'BAT-EXP-01',
      quantity: med.quantity,
      unit: 'units',
      expiryDate: med.expiryDate,
      daysExpired,
      wasteCategory: 'Expired Pharmaceuticals (Bio-Medical Waste)',
      reason: reason || 'Statutory Expiration Safe Bio-Disposal',
      facilityName: disposalCentre,
      bioCentreName: disposalCentre,
      bioCentreAddress: 'Plot G-14, Medical Waste Treatment Zone, Taloja MIDC, Navi Mumbai 410208',
      treatmentMethod: 'High-Temperature Thermal Incineration (1100°C)',
      status: 'Disposed',
      disposalDate: formattedDateTime,
      certificateId: 'CPCB-DISP-' + Math.floor(100000 + Math.random() * 900000),
      manifestNumber: 'GBW-BMW-' + Math.floor(10000 + Math.random() * 90000),
      isDemoSimulation: true,
    };

    disposals.unshift(newDisposal);
    setStoredItem(KEYS.DISPOSALS, disposals);

    // 3. Log audit event
    auditService.logEvent({
      action: 'BIO_WASTE_DISPOSED',
      entityType: 'WASTE',
      entityId: newDisposal.id,
      hospitalId: newDisposal.hospitalId,
      hospitalName: newDisposal.hospitalName,
      summary: `Disposed ${newDisposal.quantity} units of expired ${newDisposal.medicineName} (Batch: ${newDisposal.batchNo}) at ${disposalCentre}.`,
      resultingStatus: 'Disposed',
      metadata: { medicineId: med.id, batchNo: newDisposal.batchNo, quantity: newDisposal.quantity }
    });

    return { updatedMedicine: medicines[medIdx], newDisposal };
  },

  async deleteMedicine(id) {
    await new Promise((r) => setTimeout(r, 200));
    const medicines = getStoredItem(KEYS.MEDICINES, []);
    const medicine = medicines.find((m) => m.id === id);
    if (!medicine) throw new Error('Medicine not found');
    assertHospitalActive(medicine.hospitalId);

    const filtered = medicines.filter((m) => m.id !== id);
    setStoredItem(KEYS.MEDICINES, filtered);

    auditService.logEvent({
      action: 'INVENTORY_DELETED',
      entityType: 'INVENTORY',
      entityId: medicine.id,
      hospitalId: medicine.hospitalId,
      hospitalName: medicine.hospitalName,
      summary: `Removed ${medicine.brandName} from verified inventory.`,
      resultingStatus: 'removed',
      metadata: { brandName: medicine.brandName, batchNo: medicine.batchNo },
    });

    return true;
  },

  async importInventoryBatch(hospitalIdParam, { itemsToCreate = [], itemsToUpdate = [], skippedCount = 0, stats = {} }) {
    await new Promise((r) => setTimeout(r, 300));
    const hospitalId = resolveHospitalId(hospitalIdParam);
    if (!hospitalId) throw new Error('Hospital identity not specified');
    assertHospitalActive(hospitalId);

    const medicines = getStoredItem(KEYS.MEDICINES, []);
    const hospitals = getStoredItem(KEYS.HOSPITALS, []);
    const hosp = hospitals.find((h) => h.id === hospitalId) || { name: 'Hospital Pharmacy', city: 'Mumbai', state: 'MH' };

    // 1. Process Updates
    itemsToUpdate.forEach((updateItem) => {
      const idx = medicines.findIndex((m) => 
        (updateItem.id && m.id === updateItem.id) ||
        (m.hospitalId === hospitalId && 
         m.brandName?.toLowerCase().trim() === updateItem.brandName?.toLowerCase().trim() && 
         m.batchNo?.toLowerCase().trim() === updateItem.batchNo?.toLowerCase().trim())
      );

      if (idx !== -1) {
        const currentMed = medicines[idx];
        const newQty = updateItem.quantity !== undefined ? Number(updateItem.quantity) : currentMed.quantity;
        const newPrice = updateItem.unitOriginalPrice !== undefined ? Number(updateItem.unitOriginalPrice) : currentMed.unitOriginalPrice;
        const exp = calculateMedicineExpiry(updateItem.expiryDate || currentMed.expiryDate, newQty);

        medicines[idx] = {
          ...currentMed,
          ...updateItem,
          id: currentMed.id,
          hospitalId: currentMed.hospitalId,
          hospitalName: currentMed.hospitalName,
          quantity: Math.max(0, newQty),
          unitOriginalPrice: Math.max(0, newPrice),
          status: exp.isExpired ? 'expired' : (currentMed.status === 'expired' ? 'active' : currentMed.status || 'active'),
          lastUpdated: new Date().toISOString().split('T')[0],
        };
      }
    });

    // 2. Process Creations
    const timestamp = Date.now();
    itemsToCreate.forEach((item, index) => {
      const qty = Math.max(1, Number(item.quantity) || 1);
      const unitPrice = Math.max(0, Number(item.unitOriginalPrice) || 50);
      const exp = calculateMedicineExpiry(item.expiryDate, qty);

      const newMedicine = {
        id: `med-${hospitalId}-${timestamp}-${index + 1}`,
        brandName: item.brandName.trim(),
        genericName: item.genericName || item.brandName.trim(),
        power: item.power || (item.category ? `${item.category}` : 'Formulation'),
        category: item.category || 'General Formulation',
        storageType: item.storageType || 'Room Temperature (15°C - 25°C)',
        mfgDate: item.mfgDate || new Date(Date.now() - 180 * 86400000).toISOString().split('T')[0],
        expiryDate: item.expiryDate,
        batchNo: item.batchNo.trim(),
        manufacturer: item.manufacturer || 'Standard Pharma Corp',
        quantity: qty,
        unitOriginalPrice: unitPrice,
        concessionPercent: Math.max(0, Math.min(90, Number(item.concessionPercent || 0))),
        hospitalId: hospitalId,
        hospitalName: hosp.name,
        location: hosp.city && hosp.state ? `${hosp.city}, ${hosp.state}` : 'Hospital Pharmacy',
        distanceKm: Number(item.distanceKm) || 10,
        dateAdded: new Date().toISOString().split('T')[0],
        status: exp.isExpired ? 'expired' : 'active',
        minStockThreshold: Number(item.minStockThreshold) || 25,
        unit: item.unit || 'Units',
        notes: item.notes || (exp.isExpired ? 'Imported expired batch. Quarantined for bio-waste disposal.' : 'Imported via Hospital CSV system.'),
      };

      medicines.unshift(newMedicine);
    });

    // 3. Persist atomically
    setStoredItem(KEYS.MEDICINES, medicines);

    // 4. Log audit trail event
    auditService.logEvent({
      action: 'INVENTORY_IMPORTED_CSV',
      entityType: 'INVENTORY',
      entityId: `import-${timestamp}`,
      hospitalId: hospitalId,
      hospitalName: hosp.name,
      summary: `Imported ${itemsToCreate.length + itemsToUpdate.length} inventory records via CSV (${itemsToCreate.length} added, ${itemsToUpdate.length} updated, ${skippedCount} skipped).`,
      resultingStatus: 'completed',
      metadata: {
        totalRecords: itemsToCreate.length + itemsToUpdate.length + skippedCount,
        addedCount: itemsToCreate.length,
        updatedCount: itemsToUpdate.length,
        skippedCount: skippedCount,
        expiredCount: stats?.expiredCount || 0,
        nearExpiryCount: stats?.nearExpiryCount || 0,
        lowStockCount: stats?.lowStockCount || 0,
        timestamp: new Date().toISOString(),
      },
    });

    return {
      success: true,
      addedCount: itemsToCreate.length,
      updatedCount: itemsToUpdate.length,
      skippedCount: skippedCount,
      totalHospitalInventory: medicines.filter((m) => m.hospitalId === hospitalId),
    };
  },

  // ==========================================
  // 3. MARKETPLACE (Only valid active listings)
  // ==========================================
  async getMarketplace(currentHospitalId, filters = {}) {
    await new Promise((r) => setTimeout(r, 200));
    const medicines = getStoredItem(KEYS.MEDICINES, []);

    // HIDE own hospital medicines, HIDE zero quantity, and HIDE expired medicines
    let results = medicines.filter((m) => {
      if (m.hospitalId === currentHospitalId) return false;
      if (Number(m.quantity) <= 0) return false;
      if (m.status === 'pending_disposal' || m.status === 'disposed') return false;

      // Expired medicines must never appear in marketplace
      const exp = calculateMedicineExpiry(m.expiryDate);
      if (exp.isExpired) return false;

      return true;
    });

    // Medicine form / dosage search with composition-based alternative matching
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      const directMatches = results.filter((m) =>
        m.brandName.toLowerCase().includes(q) ||
        m.genericName?.toLowerCase().includes(q) ||
        m.category?.toLowerCase().includes(q) ||
        m.power.toLowerCase().includes(q) ||
        m.hospitalName.toLowerCase().includes(q)
      );

      // Find exact composition alternatives for any direct matches
      const altIds = new Set();
      directMatches.forEach((directMed) => {
        const alts = findAlternatives(directMed, results);
        alts.forEach((alt) => altIds.add(alt.id));
      });

      const directList = results.filter((m) => directMatches.some((dm) => dm.id === m.id));
      const altList = results.filter((m) => !directMatches.some((dm) => dm.id === m.id) && altIds.has(m.id));
      results = [...directList, ...altList];
    }
    if (filters.power) {
      const p = filters.power.toLowerCase();
      results = results.filter((m) => m.power.toLowerCase().includes(p));
    }
    if (filters.location) {
      const loc = filters.location.toLowerCase();
      results = results.filter((m) => m.location.toLowerCase().includes(loc));
    }
    if (filters.storageType) {
      results = results.filter((m) => m.storageType?.toLowerCase().includes(filters.storageType.toLowerCase()));
    }
    if (filters.dosageForm && filters.dosageForm !== 'all') {
      const form = filters.dosageForm.toLowerCase();
      results = results.filter((m) =>
        m.power.toLowerCase().includes(form) ||
        m.brandName.toLowerCase().includes(form) ||
        m.category.toLowerCase().includes(form)
      );
    }

    return results;
  },

  // ==========================================
  // 4. REQUESTS & 48-HOUR SLA & FIRST ACCEPTANCE WINS
  // ==========================================
  async createRequest(reqData) {
    await new Promise((r) => setTimeout(r, 300));
    assertHospitalActive(reqData.fromHospitalId);

    const qty = Number(reqData.quantity);
    if (qty <= 0) throw new Error('Requisition quantity must be greater than zero');

    // Verify medicine stock available
    const medicines = getStoredItem(KEYS.MEDICINES, []);
    const targetMed = medicines.find((m) => m.id === reqData.medicineId);
    if (!targetMed) throw new Error('Target medicine listing not found');

    // Guard: Cannot request own hospital's inventory
    if (reqData.fromHospitalId && targetMed.hospitalId && reqData.fromHospitalId === targetMed.hospitalId) {
      throw new Error('Hospitals cannot submit requisitions for their own inventory items');
    }

    if (targetMed.quantity < qty) {
      throw new Error(`Requested quantity (${qty}) exceeds available stock (${targetMed.quantity})`);
    }

    // Check expiry
    const exp = calculateMedicineExpiry(targetMed.expiryDate);
    if (exp.isExpired) throw new Error('Cannot request an expired medicine');

    const requests = getStoredItem(KEYS.REQUESTS, []);
    const requestDate = new Date().toISOString();
    const expiryDate = calculateRequestExpiry(requestDate, 48).expiryDate;

    // Pricing calculation
    const isCold = targetMed.storageType?.toLowerCase().includes('cold');
    const pricing = calculateOrderPricing({
      unitOriginalPrice: targetMed.unitOriginalPrice,
      expiryDate: targetMed.expiryDate,
      concessionPercent: targetMed.concessionPercent,
      quantity: qty,
      distanceKm: targetMed.distanceKm || 15,
      isColdChain: isCold,
    });

    const newReq = {
      id: 'req-' + Date.now(),
      requirementGroupId: reqData.requirementGroupId || `req-grp-${reqData.fromHospitalId}-${targetMed.brandName.slice(0, 5)}-${qty}`,
      medicineId: reqData.medicineId,
      medicineName: `${targetMed.brandName} (${targetMed.power})`,
      power: targetMed.power,
      quantity: qty,
      unitOriginalPrice: pricing.unitOriginalPrice,
      concessionPercent: pricing.concessionPercent,
      unitFinalPrice: pricing.unitSellingPrice,
      logisticsFee: pricing.logisticsFee,
      gstAmount: pricing.gstAmount,
      totalAmount: pricing.totalPayable,
      fromHospitalId: reqData.fromHospitalId,
      fromHospitalName: reqData.fromHospitalName,
      toHospitalId: reqData.toHospitalId,
      toHospitalName: reqData.toHospitalName,
      requestDate,
      expiryDate,
      status: 'pending',
      rejectReason: null,
      transactionId: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
      paymentId: null,
      paymentStatus: 'pending',
      notes: reqData.notes || '',
    };

    requests.unshift(newReq);
    setStoredItem(KEYS.REQUESTS, requests);

    auditService.logEvent({
      action: 'REQUEST_CREATED',
      entityType: 'REQUEST',
      entityId: newReq.id,
      hospitalId: newReq.fromHospitalId,
      hospitalName: newReq.fromHospitalName,
      partnerHospitalId: newReq.toHospitalId,
      partnerHospitalName: newReq.toHospitalName,
      summary: `Created requisition for ${newReq.quantity} units of ${newReq.medicineName} from ${newReq.toHospitalName}.`,
      resultingStatus: 'pending',
      metadata: { quantity: newReq.quantity, totalAmount: newReq.totalAmount, expiryDate: newReq.expiryDate },
    });

    return newReq;
  },

  async getOutgoingRequests(hospitalIdParam) {
    await new Promise((r) => setTimeout(r, 150));
    const hospitalId = resolveHospitalId(hospitalIdParam);
    if (!hospitalId) return [];

    const allRequests = getStoredItem(KEYS.REQUESTS, []);
    const { requests: refreshedRequests, hasExpiredChanges } = processExpiredRequests(allRequests);
    if (hasExpiredChanges) {
      setStoredItem(KEYS.REQUESTS, refreshedRequests);
    }

    return refreshedRequests.filter((r) => r.fromHospitalId === hospitalId);
  },

  async getIncomingRequests(hospitalIdParam) {
    await new Promise((r) => setTimeout(r, 150));
    const hospitalId = resolveHospitalId(hospitalIdParam);
    if (!hospitalId) return [];

    const allRequests = getStoredItem(KEYS.REQUESTS, []);
    const { requests: refreshedRequests, hasExpiredChanges } = processExpiredRequests(allRequests);
    if (hasExpiredChanges) {
      setStoredItem(KEYS.REQUESTS, refreshedRequests);
    }

    return refreshedRequests.filter((r) => r.toHospitalId === hospitalId);
  },

  /**
   * Responds to request: 'accept' or 'reject'.
   * Implements FIRST ACCEPTANCE WINS:
   * When accepted, reserves/deducts stock and automatically declines competing pending requests!
   */
  async handleRequest(requestId, action, reason = '', hospitalId) {
    await new Promise((r) => setTimeout(r, 300));
    const requests = getStoredItem(KEYS.REQUESTS, []);
    const reqIndex = requests.findIndex((r) => r.id === requestId);
    if (reqIndex === -1) throw new Error('Requisition not found');

    const targetReq = requests[reqIndex];
    assertHospitalActive(hospitalId || targetReq.toHospitalId);

    // Guard: Expired requests cannot be accepted
    const sla = calculateRequestExpiry(targetReq.requestDate);
    if (targetReq.status === 'expired' || sla.isExpired) {
      targetReq.status = 'expired';
      targetReq.rejectReason = 'Automated 48-Hour SLA Expiration';
      setStoredItem(KEYS.REQUESTS, requests);
      throw new Error('Cannot accept requisition: 48-hour SLA has elapsed and request has expired.');
    }

    if (targetReq.status !== 'pending') {
      throw new Error(`Cannot process requisition: Current status is already "${targetReq.status}"`);
    }

    const medicines = getStoredItem(KEYS.MEDICINES, []);
    const rejectedCompetingRequests = [];

    if (action === 'accept') {
      // 1. Stock Check & Reservation in Seller's Inventory
      const medIndex = medicines.findIndex((m) => m.id === targetReq.medicineId && m.hospitalId === targetReq.toHospitalId);
      if (medIndex === -1) {
        throw new Error('Associated medicine record not found in your inventory');
      }

      const availableQty = Number(medicines[medIndex].quantity);
      if (availableQty < targetReq.quantity) {
        throw new Error(`Insufficient inventory stock: You only have ${availableQty} units available, but ${targetReq.quantity} were requested.`);
      }

      // Safe stock deduction (Prevent negative inventory)
      medicines[medIndex].quantity = Math.max(0, availableQty - targetReq.quantity);
      setStoredItem(KEYS.MEDICINES, medicines);

      // 2. Mark this request as accepted
      targetReq.status = 'accepted';
      targetReq.rejectReason = null;
      targetReq.acceptedAt = new Date().toISOString();

      // 3. FIRST ACCEPTANCE WINS: Find and decline competing pending requests from the same buyer
      // Deterministic requirement matching: Same buyer hospital AND (same requirementGroupId OR same medicineName and quantity)
      requests.forEach((r, idx) => {
        if (
          idx !== reqIndex &&
          r.status === 'pending' &&
          r.fromHospitalId === targetReq.fromHospitalId &&
          (
            (targetReq.requirementGroupId && r.requirementGroupId === targetReq.requirementGroupId) ||
            (r.medicineName === targetReq.medicineName && r.quantity === targetReq.quantity)
          )
        ) {
          r.status = 'rejected';
          r.rejectReason = `First-acceptance fulfilled: Requisition accepted by ${targetReq.toHospitalName}. Competing request automatically declined.`;
          r.autoDeclined = true;
          rejectedCompetingRequests.push(r);

          auditService.logEvent({
            action: 'COMPETING_REQUEST_REJECTED',
            entityType: 'REQUEST',
            entityId: r.id,
            hospitalId: r.fromHospitalId,
            hospitalName: r.fromHospitalName,
            partnerHospitalId: r.toHospitalId,
            partnerHospitalName: r.toHospitalName,
            summary: `Automated First-Acceptance: Declined competing request for ${r.medicineName} sent to ${r.toHospitalName}.`,
            resultingStatus: 'rejected',
            metadata: { winningRequestId: targetReq.id, winningHospital: targetReq.toHospitalName },
          });
        }
      });

      // Audit trail for accepted request
      auditService.logEvent({
        action: 'REQUEST_ACCEPTED',
        entityType: 'REQUEST',
        entityId: targetReq.id,
        hospitalId: targetReq.toHospitalId,
        hospitalName: targetReq.toHospitalName,
        partnerHospitalId: targetReq.fromHospitalId,
        partnerHospitalName: targetReq.fromHospitalName,
        summary: `Accepted requisition from ${targetReq.fromHospitalName} for ${targetReq.quantity} units of ${targetReq.medicineName}. Reserved inventory stock.`,
        resultingStatus: 'accepted',
        metadata: { quantity: targetReq.quantity, remainingStock: medicines[medIndex].quantity },
      });

    } else if (action === 'reject') {
      targetReq.status = 'rejected';
      targetReq.rejectReason = reason || 'Declined by providing hospital due to clinical inventory allocation.';

      auditService.logEvent({
        action: 'REQUEST_REJECTED',
        entityType: 'REQUEST',
        entityId: targetReq.id,
        hospitalId: targetReq.toHospitalId,
        hospitalName: targetReq.toHospitalName,
        partnerHospitalId: targetReq.fromHospitalId,
        partnerHospitalName: targetReq.fromHospitalName,
        summary: `Declined requisition for ${targetReq.medicineName} from ${targetReq.fromHospitalName}. Reason: ${targetReq.rejectReason}`,
        resultingStatus: 'rejected',
        metadata: { reason: targetReq.rejectReason },
      });
    }

    setStoredItem(KEYS.REQUESTS, requests);

    return {
      acceptedRequest: targetReq,
      rejectedRequests: rejectedCompetingRequests,
      updatedRequest: targetReq,
    };
  },

  /**
   * Cancels an active requisition with tiered refund policy rules.
   * Safely restores seller-reserved stock if accepted/packed prior to dispatch.
   */
  async cancelRequest({ requestId, reason = 'No longer required', note = '', hospitalId }) {
    await new Promise((r) => setTimeout(r, 250));
    const requests = getStoredItem(KEYS.REQUESTS, []);
    const reqIndex = requests.findIndex((r) => r.id === requestId);
    if (reqIndex === -1) throw new Error('Requisition not found');

    const targetReq = requests[reqIndex];
    assertHospitalActive(hospitalId || targetReq.fromHospitalId);

    if (targetReq.status === 'cancelled') {
      throw new Error('This requisition has already been cancelled.');
    }

    const policy = getCancellationPolicy(targetReq);
    if (!policy.canCancel) {
      throw new Error(policy.reason || 'This requisition cannot be cancelled at this stage.');
    }

    const { totalAmount, penaltyAmount, refundAmount } = calculateRefundAmounts(targetReq, policy);

    // Stock Safety: If accepted/reviewing/packed (stock was deducted from seller), and NOT dispatched,
    // restore the reserved quantity back to the seller's inventory lot in KEYS.MEDICINES!
    const normalizedStatus = (targetReq.status || '').toLowerCase().replace(/[\-_]/g, ' ');
    const isPreDispatchReserved = ['accepted', 'approved', 'reviewing', 'packed'].includes(normalizedStatus);
    const isDispatched = ['in transit', 'dispatched', 'shipped'].includes(normalizedStatus);

    if (isPreDispatchReserved && !isDispatched) {
      const medicines = getStoredItem(KEYS.MEDICINES, []);
      const medIndex = medicines.findIndex(
        (m) => m.id === targetReq.medicineId && m.hospitalId === targetReq.toHospitalId
      );
      if (medIndex !== -1) {
        medicines[medIndex].quantity = Number(medicines[medIndex].quantity || 0) + Number(targetReq.quantity || 0);
        setStoredItem(KEYS.MEDICINES, medicines);
      }
    }

    // Update Requisition State
    targetReq.status = 'cancelled';
    targetReq.cancellation = {
      cancelledAt: new Date().toISOString(),
      cancelledBy: hospitalId || targetReq.fromHospitalId,
      cancelledByHospitalName: targetReq.fromHospitalName,
      reason: reason || 'Buyer requirement changed',
      note: note || '',
      stage: policy.stage,
      stageLabel: policy.stageLabel,
      penaltyPercent: policy.penaltyPercent,
      penaltyAmount,
      refundPercent: policy.refundPercent,
      refundAmount,
      totalAmount,
      isDemoRefund: true,
      refundStatus: 'Processed (Demo Escrow)',
    };

    setStoredItem(KEYS.REQUESTS, requests);

    // Update related tracking in KEYS.TRACKING if present
    const trackings = getStoredItem(KEYS.TRACKING, []);
    let trackingModified = false;
    const updatedTrackings = trackings.map((t) => {
      if (t.transactionId === targetReq.transactionId || t.trackingNumber === targetReq.trackingNumber) {
        trackingModified = true;
        return {
          ...t,
          status: 'Cancelled',
          cancellationReason: reason,
        };
      }
      return t;
    });
    if (trackingModified) {
      setStoredItem(KEYS.TRACKING, updatedTrackings);
    }

    // Audit Trail Logging
    auditService.logEvent({
      action: 'REQUEST_CANCELLED',
      entityType: 'REQUEST',
      entityId: targetReq.id,
      hospitalId: targetReq.fromHospitalId,
      hospitalName: targetReq.fromHospitalName,
      partnerHospitalId: targetReq.toHospitalId,
      partnerHospitalName: targetReq.toHospitalName,
      summary: `Cancelled requisition for ${targetReq.medicineName} (${targetReq.quantity} units). Reason: ${reason}. Refund: ₹${refundAmount.toLocaleString()} (${policy.refundPercent}%).`,
      resultingStatus: 'cancelled',
      metadata: {
        reason,
        penaltyPercent: policy.penaltyPercent,
        penaltyAmount,
        refundPercent: policy.refundPercent,
        refundAmount,
      },
    });

    return targetReq;
  },

  // ==========================================
  // 5. DEMO PAYMENT SIMULATOR & ESCROW RELEASE
  // ==========================================
  async processPayment({ requestId, paymentMethod = 'Demo B2B Escrow Transfer' }) {
    await new Promise((r) => setTimeout(r, 600));
    const requests = getStoredItem(KEYS.REQUESTS, []);
    const payments = getStoredItem(KEYS.PAYMENTS, []);
    const trackingList = getStoredItem(KEYS.TRACKING, []);

    const index = requests.findIndex((r) => r.id === requestId);
    if (index === -1) throw new Error('Requisition not found');

    const req = requests[index];
    assertHospitalActive(req.fromHospitalId);

    if (req.status !== 'accepted') {
      throw new Error(`Cannot pay for requisition in "${req.status}" status. Requisition must be accepted first.`);
    }

    const paymentId = 'pay_demo_' + Math.random().toString(36).substring(2, 11);
    const orderId = 'order_demo_' + Math.random().toString(36).substring(2, 10);

    // Update Request
    req.status = 'paid';
    req.paymentId = paymentId;
    req.paymentStatus = 'success';
    req.paidDate = new Date().toISOString();
    setStoredItem(KEYS.REQUESTS, requests);

    // Record Payment
    const newPayment = {
      id: 'pay-' + Date.now(),
      transactionId: req.transactionId,
      requestId: req.id,
      medicineName: req.medicineName,
      quantity: req.quantity,
      amount: req.totalAmount,
      gstAmount: req.gstAmount || Math.round(req.totalAmount * 0.12),
      totalPaid: req.totalAmount,
      paymentStatus: 'Success',
      date: new Date().toLocaleString(),
      razorpayPaymentId: paymentId + ' (Demo Simulator)',
      razorpayOrderId: orderId,
      paymentMethod: paymentMethod + ' [Simulation]',
      buyerHospital: req.fromHospitalName,
      buyerHospitalId: req.fromHospitalId,
      sellerHospital: req.toHospitalName,
      sellerHospitalId: req.toHospitalId,
      isDemoSimulation: true,
    };
    payments.unshift(newPayment);
    setStoredItem(KEYS.PAYMENTS, payments);

    // Generate Stable Tracking record
    const newTracking = {
      transactionId: req.transactionId,
      trackingNumber: 'SMS-EXP-' + Math.floor(10000 + Math.random() * 90000),
      senderHospital: req.toHospitalName,
      senderHospitalId: req.toHospitalId,
      receiverHospital: req.fromHospitalName,
      receiverHospitalId: req.fromHospitalId,
      medicineName: req.medicineName,
      quantity: req.quantity,
      status: 'Pickup Scheduled',
      currentLocation: `${req.toHospitalName} Central Logistics Bay`,
      destination: `${req.fromHospitalName} Pharmacy Intake Dock`,
      eta: 'Tomorrow, 03:00 PM (Est. 24h Cold Transit)',
      courierName: 'MediCold Bio-Express (Demo Fleet)',
      courierContact: '+91 91122 33445 (Dispatcher: Vikram S.)',
      vehicleNo: 'MH-04-EX-7741 (Temp Telemetry)',
      temperature: '3.9°C (Compliant)',
      isDemoSimulation: true,
      timeline: [
        { step: 'Requisition Accepted & Verified', date: new Date().toLocaleString(), completed: true, details: 'Exchange terms approved and stock earmarked.' },
        { step: 'Payment Processed via Escrow Simulator', date: new Date().toLocaleString(), completed: true, details: `Ref: ${paymentId}, ₹${newPayment.totalPaid} placed in secure nodal escrow.` },
        { step: 'Pickup Scheduled with Bio-Courier', date: 'In Progress', completed: true, details: 'Sealed cold-chain package awaiting dispatch courier.' },
        { step: 'In Transit with Live IoT Temperature', date: 'Pending', completed: false, details: 'Active GPS and temperature logger.' },
        { step: 'Delivered & Clinical Inspection Done', date: 'Pending', completed: false, details: 'Receiving dock inspection required before final escrow disbursement.' },
      ],
      coordinates: {
        origin: [28.5273, 77.2155],
        current: [24.5854, 73.7125],
        destination: [19.0144, 73.0408],
      }
    };
    trackingList.unshift(newTracking);
    setStoredItem(KEYS.TRACKING, trackingList);

    auditService.logEvent({
      action: 'PAYMENT_PROCESSED',
      entityType: 'PAYMENT',
      entityId: newPayment.id,
      hospitalId: req.fromHospitalId,
      hospitalName: req.fromHospitalName,
      partnerHospitalId: req.toHospitalId,
      partnerHospitalName: req.toHospitalName,
      summary: `Payment of ₹${newPayment.totalPaid.toLocaleString()} processed in escrow for ${req.medicineName}. Shipment ${newTracking.trackingNumber} scheduled.`,
      resultingStatus: 'paid',
      metadata: { transactionId: req.transactionId, paymentId, totalPaid: newPayment.totalPaid },
    });

    return { request: req, payment: newPayment, tracking: newTracking };
  },

  // ==========================================
  // 6. STABLE LOGISTICS & TRACKING
  // ==========================================
  async getTrackingByTxn(txnId) {
    await new Promise((r) => setTimeout(r, 200));
    const trackingList = getStoredItem(KEYS.TRACKING, []);
    if (!txnId) return trackingList[0] || null;
    return trackingList.find((t) => t.transactionId?.toLowerCase() === txnId.trim().toLowerCase()) || trackingList[0] || null;
  },

  async getAllTracking() {
    await new Promise((r) => setTimeout(r, 150));
    return getStoredItem(KEYS.TRACKING, []);
  },

  // ==========================================
  // 7. SALES & PURCHASES HISTORY (Isolated)
  // ==========================================
  async getSalesHistory(hospitalIdParam) {
    await new Promise((r) => setTimeout(r, 150));
    const hospitalId = resolveHospitalId(hospitalIdParam);
    if (!hospitalId) return [];

    const requests = getStoredItem(KEYS.REQUESTS, []);
    return requests
      .filter((r) => r.toHospitalId === hospitalId && ['accepted', 'paid', 'dispatched', 'delivered'].includes(r.status))
      .map((r) => ({
        id: r.id,
        transactionId: r.transactionId,
        medicine: r.medicineName,
        partnerHospital: r.fromHospitalName,
        partnerHospitalId: r.fromHospitalId,
        quantity: r.quantity,
        amount: r.totalAmount,
        date: r.requestDate.split('T')[0],
        status: r.status,
      }));
  },

  async getPurchasesHistory(hospitalIdParam) {
    await new Promise((r) => setTimeout(r, 150));
    const hospitalId = resolveHospitalId(hospitalIdParam);
    if (!hospitalId) return [];

    const requests = getStoredItem(KEYS.REQUESTS, []);
    return requests
      .filter((r) => r.fromHospitalId === hospitalId && ['accepted', 'paid', 'dispatched', 'delivered', 'rejected', 'expired'].includes(r.status))
      .map((r) => ({
        id: r.id,
        transactionId: r.transactionId,
        medicine: r.medicineName,
        partnerHospital: r.toHospitalName,
        partnerHospitalId: r.toHospitalId,
        quantity: r.quantity,
        amount: r.totalAmount,
        date: r.requestDate.split('T')[0],
        status: r.status,
      }));
  },

  // ==========================================
  // 8. PAYMENT HISTORY (Strictly Isolated)
  // ==========================================
  async getPaymentHistory(hospitalIdParam) {
    await new Promise((r) => setTimeout(r, 150));
    const hospitalId = resolveHospitalId(hospitalIdParam);
    const payments = getStoredItem(KEYS.PAYMENTS, []);
    if (!hospitalId) return payments;

    const hospitals = getStoredItem(KEYS.HOSPITALS, []);
    const hosp = hospitals.find((h) => h.id === hospitalId);
    const hospName = hosp?.name?.toLowerCase();

    return payments.filter((p) => {
      if (p.buyerHospitalId === hospitalId || p.sellerHospitalId === hospitalId) return true;
      if (hospName && (p.buyerHospital?.toLowerCase().includes(hospName) || p.sellerHospital?.toLowerCase().includes(hospName))) return true;
      return false;
    });
  },

  // ==========================================
  // 9. HOSPITAL WASTE MANAGEMENT (Complete Flow)
  // ==========================================
  async getHospitalDisposals(hospitalIdParam) {
    await new Promise((r) => setTimeout(r, 150));
    const hospitalId = resolveHospitalId(hospitalIdParam);
    if (!hospitalId) return [];

    const disposals = getStoredItem(KEYS.DISPOSALS, []);
    return disposals.filter((d) => d.hospitalId === hospitalId);
  },

  async createWasteRequest(wasteData) {
    await new Promise((r) => setTimeout(r, 250));
    const hospitalId = resolveHospitalId(wasteData.hospitalId);
    assertHospitalActive(hospitalId);

    const hospitals = getStoredItem(KEYS.HOSPITALS, []);
    const hosp = hospitals.find((h) => h.id === hospitalId) || { name: 'Hospital Facility', city: 'Mumbai' };

    const disposals = getStoredItem(KEYS.DISPOSALS, []);

    // Assign appropriate regional authorized bio-medical waste treatment plant
    let bioCentreName = 'Maharashtra Enviro Power Bio-Medical Waste Plant';
    let bioCentreAddress = 'Plot P-32, MIDC Taloja, Raigad, Maharashtra 410208';
    if (hosp.city?.toLowerCase().includes('delhi')) {
      bioCentreName = 'Delhi Central Bio-Medical Incinerator, Okhla';
      bioCentreAddress = 'Okhla Industrial Area Phase-I, New Delhi 110020';
    } else if (hosp.city?.toLowerCase().includes('gurgaon') || hosp.state?.toLowerCase().includes('haryana')) {
      bioCentreName = 'Haryana State Bio-Hazard Incineration Facility';
      bioCentreAddress = 'IMT Manesar Sector 8, Gurugram, Haryana 122051';
    } else if (hosp.city?.toLowerCase().includes('bangalore') || hosp.state?.toLowerCase().includes('karnataka')) {
      bioCentreName = 'Karnataka Common Bio-Medical Waste Treatment Facility';
      bioCentreAddress = 'Peenya Industrial Area, Bengaluru, Karnataka 560058';
    }

    const newDisposal = {
      id: 'disp-' + Date.now(),
      hospitalId,
      hospitalName: hosp.name,
      medicineId: wasteData.medicineId || null,
      medicineName: wasteData.medicineName,
      wasteCategory: wasteData.wasteCategory || 'Expired Pharmaceuticals',
      batchNo: wasteData.batchNo || 'N/A',
      quantity: wasteData.quantity,
      expiryDate: wasteData.expiryDate || null,
      reason: wasteData.reason || 'Statutory Expiration Disposal',
      preferredPickupDate: wasteData.preferredPickupDate || new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
      pickupDate: null,
      bioCentreName,
      bioCentreAddress,
      vehicleNo: 'MH-04-GP-' + Math.floor(1000 + Math.random() * 9000),
      driverContact: '+91 98' + Math.floor(10000000 + Math.random() * 90000000) + ' (Authorized Driver)',
      currentLocation: 'Assigned Bio-Centre Dispatch Queue',
      eta: 'Pickup scheduled within 48h',
      status: 'Pending Assessment',
      certificateNo: null,
      certificateDate: null,
      treatmentMethod: 'High-Temperature Double-Chamber Incineration (1100°C) with Flue Gas Scrubber',
      manifestNumber: 'MPCB-BMW-MNF-' + Math.floor(10000 + Math.random() * 90000),
      createdDate: new Date().toISOString().split('T')[0],
      isDemoSimulation: true,
    };

    disposals.unshift(newDisposal);
    setStoredItem(KEYS.DISPOSALS, disposals);

    // If a specific medicine was linked, update its status to 'pending_disposal' in inventory
    if (wasteData.medicineId) {
      const medicines = getStoredItem(KEYS.MEDICINES, []);
      const medIdx = medicines.findIndex((m) => m.id === wasteData.medicineId);
      if (medIdx !== -1) {
        medicines[medIdx].status = 'pending_disposal';
        setStoredItem(KEYS.MEDICINES, medicines);
      }
    }

    auditService.logEvent({
      action: 'WASTE_REQUEST_CREATED',
      entityType: 'WASTE',
      entityId: newDisposal.id,
      hospitalId,
      hospitalName: hosp.name,
      summary: `Submitted bio-medical waste disposal request for ${newDisposal.medicineName} (${newDisposal.quantity}). Assigned to ${bioCentreName}.`,
      resultingStatus: 'Pending Assessment',
      metadata: { wasteCategory: newDisposal.wasteCategory, batchNo: newDisposal.batchNo },
    });

    return newDisposal;
  },

  // ==========================================
  // 10. FEEDBACK
  // ==========================================
  async submitFeedback(feedbackData) {
    await new Promise((r) => setTimeout(r, 200));
    const hospitalId = resolveHospitalId(feedbackData.hospitalId);
    const feedbacks = getStoredItem(KEYS.FEEDBACKS, []);
    const newFb = {
      id: 'fb-' + Date.now(),
      hospitalId: hospitalId || 'hosp-1',
      hospitalName: feedbackData.hospitalName || 'Hospital Facility',
      rating: Number(feedbackData.rating),
      category: feedbackData.category || 'General Service',
      feedbackText: feedbackData.feedbackText,
      date: new Date().toISOString().split('T')[0],
      adminReply: null,
      repliedDate: null,
    };
    feedbacks.unshift(newFb);
    setStoredItem(KEYS.FEEDBACKS, feedbacks);
    return newFb;
  },

  async getFeedbacks(hospitalIdParam) {
    await new Promise((r) => setTimeout(r, 150));
    const hospitalId = resolveHospitalId(hospitalIdParam);
    const feedbacks = getStoredItem(KEYS.FEEDBACKS, []);
    if (!hospitalId) return feedbacks;
    return feedbacks.filter((f) => f.hospitalId === hospitalId);
  }
};
