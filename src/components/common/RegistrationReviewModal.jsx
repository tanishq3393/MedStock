import React from 'react';
import {
  X,
  Building2,
  MapPin,
  FileText,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

/**
 * Shared Registration Review Modal
 * Displays the complete registration form:
 * - SECTION 1: Hospital / Institution Information (All Step 1 fields)
 * - SECTION 2: Campus / Address Information (All Step 2 fields)
 * - SECTION 3: Attached Regulatory Documents (Current document-card design with working View button)
 *
 * Used uniformly in:
 * 1. Step 4 -> View Registration Form
 * 2. Submitted Page -> View Registration Form
 */
export const RegistrationReviewModal = ({
  isOpen,
  onClose,
  hospitalData = {},
  campusData = {},
  documents = [],
  emailVerified = false,
  onViewDocument,
  title = 'Hospital Registration Form Review',
}) => {
  if (!isOpen) return null;

  // Normalize hospital data whether from state or persisted backend record
  const hosp = {
    name: hospitalData.name || '',
    registrationNo: hospitalData.registrationNo || hospitalData.registration_no || '',
    issuingAuthority: hospitalData.issuingAuthority || hospitalData.issuing_authority || '',
    organizationType: hospitalData.organizationType || hospitalData.organization_type || '',
    authorizedPerson: hospitalData.authorizedPerson || hospitalData.authorized_person || '',
    designation: hospitalData.designation || '',
    email: hospitalData.email || '',
    phone: hospitalData.phone || '',
  };

  // Normalize campus data whether from state or persisted backend record
  const camp = {
    campusName: campusData.campusName || campusData.campus_name || 'Main Campus',
    address: campusData.address || '',
    state: campusData.state || '',
    district: campusData.district || '',
    city: campusData.city || '',
    pincode: campusData.pincode || '',
    receivingGate: campusData.receivingGate || campusData.receiving_gate || '',
  };

  const isVerified = (emailVerified && hospitalData.emailVerified !== false && hospitalData.email_verified !== false) || hospitalData.emailVerified === true || hospitalData.email_verified === true;
  const isSkipped = !isVerified && (hospitalData.email_verification_status === 'TEMPORARILY_SKIPPED' || hospitalData.emailVerificationStatus === 'TEMPORARILY_SKIPPED');

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="registration-review-title"
    >
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/70 shrink-0">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                <ShieldCheck className="w-3 h-3 text-teal-600" />
                MedEx Network Registration
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                Complete Dossier
              </span>
            </div>
            <h2 id="registration-review-title" className="text-base sm:text-xl font-black text-slate-900 truncate">
              {title}
            </h2>
            <p className="text-xs text-slate-500">
              Institutional application, physical campus infrastructure, and statutory regulatory filings.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-slate-200/80 text-slate-400 hover:text-slate-700 flex items-center justify-center transition shrink-0"
            aria-label="Close registration review"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* ============================================================== */}
          {/* SECTION 1: HOSPITAL / INSTITUTION INFORMATION */}
          {/* ============================================================== */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-teal-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-600" />
                <span>Section 1 — Hospital / Institution Information</span>
              </h3>
              {isVerified ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Email Verified ✓
                </span>
              ) : isSkipped ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  <AlertCircle className="w-3 h-3 text-amber-600" />
                  OTP Verification Paused
                </span>
              ) : (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Verification Pending
                </span>
              )}
            </div>

            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 text-xs grid grid-cols-1 sm:grid-cols-2 gap-3.5 shadow-2xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Hospital Name</span>
                <span className="font-extrabold text-slate-900 text-xs">{hosp.name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Registration Number / ID</span>
                <span className="font-mono font-bold text-teal-800">{hosp.registrationNo || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Official Email</span>
                <span className="font-medium text-slate-800">
                  {hosp.email || 'N/A'}
                  {isVerified && <span className="text-emerald-600 font-bold ml-1.5">✓</span>}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Phone Number</span>
                <span className="font-medium text-slate-800">{hosp.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Organization Type</span>
                <span className="font-medium text-slate-800">{hosp.organizationType || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Designation</span>
                <span className="font-medium text-slate-800">{hosp.designation || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Issuing Authority</span>
                <span className="font-medium text-slate-800">{hosp.issuingAuthority || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Authorized Representative</span>
                <span className="font-medium text-slate-800">{hosp.authorizedPerson || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* SECTION 2: CAMPUS / ADDRESS INFORMATION */}
          {/* ============================================================== */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-teal-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-teal-600" />
                <span>Section 2 — Campus / Address Information</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                Primary Facility
              </span>
            </div>

            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 text-xs grid grid-cols-1 sm:grid-cols-2 gap-3.5 shadow-2xs">
              <div className="sm:col-span-2">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Campus Name</span>
                <span className="font-extrabold text-slate-900">{camp.campusName}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Address</span>
                <span className="font-medium text-slate-800">{camp.address || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">State</span>
                <span className="font-medium text-slate-800">{camp.state || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">District</span>
                <span className="font-medium text-slate-800">{camp.district || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">City</span>
                <span className="font-medium text-slate-800">{camp.city || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Pincode</span>
                <span className="font-mono font-bold text-slate-800">{camp.pincode || 'N/A'}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Receiving Gate / Medicine Dropoff</span>
                <span className="font-medium text-slate-800">
                  {camp.receivingGate || 'Main Logistics Receiving Gate'}
                </span>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* SECTION 3: ATTACHED REGULATORY DOCUMENTS */}
          {/* ============================================================== */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-teal-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                <span>Section 3 — Attached Regulatory Documents ({documents.length})</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-500">
                Private Supabase Storage
              </span>
            </div>

            {documents.length === 0 ? (
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
                No statutory compliance documents attached.
              </div>
            ) : (
              <div className="space-y-2.5">
                {documents.map((doc, idx) => {
                  const docTitle =
                    doc.documentType ||
                    doc.customDocumentName ||
                    doc.documentName ||
                    doc.custom_document_name ||
                    'Statutory Compliance Document';
                  const docNum = doc.documentNumber || doc.document_number;
                  const authority = doc.issuingAuthority || doc.issuing_authority;
                  const issueDt = doc.issueDate || doc.issue_date;
                  const expiryDt = doc.expiryDate || doc.expiry_date;
                  const filename =
                    doc.originalFilename ||
                    doc.original_filename ||
                    doc.documentName ||
                    doc.document_name ||
                    'document.pdf';
                  const customName = doc.customDocumentName || doc.custom_document_name;

                  return (
                    <div
                      key={doc.id || doc._id || idx}
                      className="bg-slate-50/90 p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-xs">{docTitle}</span>
                          {customName && customName !== docTitle && (
                            <span className="text-[10px] text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                              {customName}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-medium">
                          {docNum && (
                            <span>
                              No: <strong className="text-slate-800 font-mono">{docNum}</strong>
                            </span>
                          )}
                          {docNum && authority && <span className="text-slate-300">•</span>}
                          {authority && (
                            <span>
                              Authority: <strong className="text-slate-800">{authority}</strong>
                            </span>
                          )}
                          {(docNum || authority) && (issueDt || expiryDt) && (
                            <span className="text-slate-300">•</span>
                          )}
                          {issueDt && (
                            <span>
                              Issued: <strong className="text-slate-800">{issueDt}</strong>
                            </span>
                          )}
                          {expiryDt && (
                            <span>
                              Expires: <strong className="text-slate-800">{expiryDt}</strong>
                            </span>
                          )}
                          <span className="text-slate-300">•</span>
                          <span className="font-mono text-slate-600">📄 {filename}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onViewDocument && onViewDocument(doc)}
                        className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-teal-50 text-teal-800 border border-teal-300 font-bold text-xs transition flex items-center gap-1.5 shrink-0 self-end sm:self-center shadow-2xs cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-teal-600" />
                        <span>View</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition"
          >
            Close Registration Form
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegistrationReviewModal;
