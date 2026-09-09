import React, { useRef } from 'react';
import { 
  ShieldCheck, 
  Printer, 
  X, 
  Building2, 
  FileCheck2, 
  QrCode, 
  AlertTriangle, 
  Flame, 
  CheckCircle2,
  Calendar,
  MapPin,
  Hash
} from 'lucide-react';

export const DisposalCertificateModal = ({ isOpen, onClose, disposal }) => {
  const printRef = useRef(null);

  if (!isOpen || !disposal) return null;

  const handlePrint = () => {
    window.print();
  };

  const certificateId = disposal.certificateId || `CPCB-CERT-${disposal.id ? disposal.id.toUpperCase() : '2026-X99'}`;
  const manifestId = disposal.id || 'MW-2026-001';
  const hospitalName = disposal.hospitalName || 'Authorized Medical Facility';
  const medicineName = disposal.medicineName || 'Pharmaceutical Formulation';
  const batchNo = disposal.batchNo || 'BATCH-UNKNOWN';
  const quantity = disposal.quantity || 0;
  const unit = disposal.unit || 'units';
  const method = disposal.treatmentMethod || 'High-Temperature Thermal Incineration (>1100°C)';
  const facility = disposal.facilityName || 'Enviro-Clean CBMWTF Facility, Taloja CETP';
  const certifiedDate = disposal.certifiedDate || disposal.updatedAt || new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 print:border-none print:shadow-none print:my-0">
        
        {/* Header Action Bar (Hidden during print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-300">
              Official Bio-Medical Destruction Certificate
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold transition-all shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Certificate Body */}
        <div ref={printRef} className="p-8 sm:p-10 space-y-6 text-slate-800 bg-white">
          
          {/* Mandatory Demo / Sample Document Disclaimer */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-center space-y-0.5">
            <span className="text-xs font-black uppercase tracking-widest text-amber-900 font-mono block">
              DEMO / SAMPLE DOCUMENT - NO REAL PATIENT DATA
            </span>
            <p className="text-[10px] text-amber-800">
              Simulated Bio-Medical Waste Destruction Certificate for technical prototype demonstration only. Not an actual legal regulatory instrument.
            </p>
          </div>

          {/* Top National Regulatory Header */}
          <div className="border-b-2 border-slate-800 pb-6 text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-[10px] font-mono font-extrabold text-slate-700 uppercase tracking-widest">
              <span>Bio-Medical Waste Management Rules (2016) • Form IV Compliance</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
              Certificate of Safe Pharmaceutical Destruction
            </h1>
            <p className="text-xs text-slate-600 font-medium max-w-lg mx-auto">
              Simulated record of eco-compliant thermal destruction of expired/recalled pharmaceutical compounds for CDSCO/CPCB audit demonstrations.
            </p>
          </div>

          {/* Certificate Metadata Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <p className="text-[10px] font-mono uppercase text-slate-400 font-bold">Certificate No.</p>
              <p className="font-mono font-bold text-slate-900 truncate">{certificateId}</p>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase text-slate-400 font-bold">Manifest ID</p>
              <p className="font-mono font-bold text-primary-700 truncate">{manifestId}</p>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase text-slate-400 font-bold">Destruction Date</p>
              <p className="font-mono font-bold text-slate-900">{certifiedDate}</p>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase text-slate-400 font-bold">Audit Status</p>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified</span>
              </span>
            </div>
          </div>

          {/* Detailed Verification Grid */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Originating Facility */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-1.5">
                <div className="flex items-center gap-2 text-slate-700">
                  <Building2 className="w-4 h-4 text-primary-600" />
                  <span className="text-[11px] font-mono uppercase font-bold text-slate-500">Originating Hospital</span>
                </div>
                <p className="text-sm font-black text-slate-900">{hospitalName}</p>
                <p className="text-xs text-slate-500 font-medium">Licensed Pharmaceutical Healthcare Provider</p>
              </div>

              {/* Treatment Facility */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-1.5">
                <div className="flex items-center gap-2 text-slate-700">
                  <Flame className="w-4 h-4 text-rose-600" />
                  <span className="text-[11px] font-mono uppercase font-bold text-slate-500">Authorized CBMWTF Facility</span>
                </div>
                <p className="text-sm font-black text-slate-900">{facility}</p>
                <p className="text-xs text-slate-500 font-medium">CPCB / SPCB Authorized Bio-Hazard Disposal Unit</p>
              </div>

            </div>

            {/* Waste Manifest Specifications Table */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 border-b border-slate-200 font-mono text-[11px] text-slate-600 uppercase">
                  <tr>
                    <th className="p-3">Compound / Description</th>
                    <th className="p-3">Batch Number</th>
                    <th className="p-3">Destruction Qty</th>
                    <th className="p-3">Method of Treatment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  <tr>
                    <td className="p-3">
                      <p className="font-bold text-slate-900">{medicineName}</p>
                      <p className="text-[10px] text-slate-500 font-mono">Category: Yellow (Cytotoxic / Expired Drug)</p>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-700">{batchNo}</td>
                    <td className="p-3 font-mono font-bold text-slate-900">{quantity} {unit}</td>
                    <td className="p-3 text-slate-700">{method}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Validation Seal and Signatures */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Mock QR Verification Stamp */}
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl border-2 border-slate-800 p-1 flex items-center justify-center bg-slate-50">
                <QrCode className="w-12 h-12 text-slate-900" />
              </div>
              <div>
                <p className="text-[10px] font-mono font-bold text-slate-500 uppercase">Simulated Verification Stamp</p>
                <p className="text-xs font-mono font-extrabold text-slate-900">SIMULATED-{manifestId.slice(-6).toUpperCase()}</p>
                <p className="text-[10px] text-primary-600 font-semibold mt-0.5">Prototype Demo Ledger Record</p>
              </div>
            </div>

            {/* Digital Signatures */}
            <div className="text-right space-y-1">
              <div className="font-mono text-xs font-bold text-slate-900 underline decoration-slate-400">
                Dr. R. K. Sharma, Ph.D.
              </div>
              <p className="text-[10px] text-slate-500 uppercase font-mono">Chief Environmental Medical Officer</p>
              <p className="text-[9px] text-slate-400 font-mono">Simulated Digital Sign-off: {certifiedDate}</p>
            </div>

          </div>

          {/* Regulatory Disclaimer */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[10px] text-slate-500 leading-relaxed text-center">
            Notice: This certificate is a prototype simulation for CDSCO Rule 65 / CPCB inspection walkthroughs. For production deployment, integration with state environmental API portals and verified PKI cryptographic digital signatures is required.
          </div>

        </div>

      </div>
    </div>
  );
};

export default DisposalCertificateModal;
