import React from 'react';
import { X, ExternalLink, Loader2, AlertCircle, FileText, ShieldCheck } from 'lucide-react';

/**
 * Secure PDF Viewer Modal
 * Renders actual uploaded PDF using native browser rendering inside an iframe,
 * with an 'Open in New Tab' action for full-screen inspection.
 * Enforces zero-forced-download policy and displays real-time loading/error states.
 */
export const PdfViewerModal = ({
  isOpen,
  onClose,
  doc,
  viewUrl,
  isLoading,
  error,
  hospitalName,
}) => {
  if (!isOpen || !doc) return null;

  const title = doc.customDocumentName || doc.documentType || doc.documentName || 'Statutory Compliance Document';
  const docNumber = doc.documentNumber || doc.document_number;
  const issuingAuthority = doc.issuingAuthority || doc.issuing_authority;
  const expiryDate = doc.expiryDate || doc.expiry_date;
  const filename = doc.originalFilename || doc.original_filename || doc.documentName || doc.document_name || 'document.pdf';

  const handleOpenNewTab = () => {
    if (viewUrl) {
      window.open(viewUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-viewer-title"
    >
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/70 shrink-0">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                <ShieldCheck className="w-3 h-3 text-teal-600" />
                Statutory Filing
              </span>
              {doc.documentType && (
                <span className="text-[11px] font-bold text-slate-500 truncate">
                  {doc.documentType}
                </span>
              )}
            </div>
            <h2 id="pdf-viewer-title" className="text-base sm:text-lg font-black text-slate-900 truncate">
              {title}
            </h2>
            <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-xs text-slate-500 font-medium">
              {filename && <span className="font-mono text-[11px] text-slate-600">📄 {filename}</span>}
              {docNumber && <span>Cert No: <strong className="text-slate-800 font-mono">{docNumber}</strong></span>}
              {issuingAuthority && <span>Authority: <strong className="text-slate-800">{issuingAuthority}</strong></span>}
              {expiryDate && <span>Expiry: <strong className="text-slate-800">{expiryDate}</strong></span>}
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {viewUrl && !isLoading && !error && (
              <button
                type="button"
                onClick={handleOpenNewTab}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 hover:text-teal-700 font-bold text-xs shadow-2xs transition flex items-center gap-1.5"
                title="Open in native browser PDF viewer tab"
              >
                <ExternalLink className="w-3.5 h-3.5 text-teal-600" />
                <span className="hidden sm:inline">Open in New Tab</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl hover:bg-slate-200/80 text-slate-400 hover:text-slate-700 flex items-center justify-center transition"
              aria-label="Close document viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-3 sm:p-5 overflow-hidden flex flex-col bg-slate-100/60 min-h-[350px]">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
              <p className="text-sm font-bold text-slate-800">Securing Document Preview...</p>
              <p className="text-xs text-slate-500 max-w-sm">
                Generating an authorized time-limited cryptographic URL from the private MedEx regulatory bucket.
              </p>
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-rose-900">Unable to Open Document</p>
              <p className="text-xs text-slate-600 max-w-md bg-white p-3 rounded-xl border border-slate-200 font-mono">
                {error}
              </p>
              <p className="text-xs text-slate-500">
                Ensure this document belongs to your healthcare institution and that your session has permission to view it.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs"
              >
                Close Viewer
              </button>
            </div>
          ) : viewUrl ? (
            <div className="flex-1 flex flex-col rounded-2xl overflow-hidden border border-slate-200/90 bg-white shadow-inner">
              <iframe
                src={viewUrl}
                title={title}
                className="w-full h-full min-h-[500px] sm:min-h-[600px] border-0"
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-2 text-slate-400">
              <FileText className="w-10 h-10 stroke-1" />
              <p className="text-xs font-medium">No preview available for this document.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-500 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Private Storage • Non-public bucket • Short-lived signed link</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {viewUrl && (
              <button
                type="button"
                onClick={handleOpenNewTab}
                className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                <span>Open in Tab</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfViewerModal;
