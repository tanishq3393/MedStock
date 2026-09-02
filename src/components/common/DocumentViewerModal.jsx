import React from 'react';
import Modal from './Modal';
import { FileText, Download, CheckCircle2, AlertCircle, Eye, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

export const DocumentViewerModal = ({ isOpen, onClose, document: doc, hospitalName }) => {
  if (!doc) return null;

  const handleDownload = () => {
    toast.success(`Downloading verified document: ${doc.name}`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={doc.type || 'Compliance Document Preview'}
      subtitle={`Submitted by ${hospitalName || 'Registered Hospital'}`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4 pt-1">
        
        {/* Document Header Meta */}
        <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">{doc.name}</p>
              <p className="text-[11px] text-slate-500">Size: {doc.size || '2.4 MB'} • Format: Adobe PDF (Encrypted)</p>
            </div>
          </div>
          <div>
            {doc.verified ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5" />
                Pending Verification
              </span>
            )}
          </div>
        </div>

        {/* Mock Document Render Area */}
        <div className="border border-slate-200 rounded-xl p-8 bg-slate-100/50 flex flex-col items-center justify-center min-h-[260px] text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-md border border-slate-200 flex items-center justify-center text-primary-600">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">{doc.type}</h4>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Digitally signed by Chief Medical Officer & authenticated against State Drug Control Administration records.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open in Secure PDF Viewer
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-slate-400">SHA-256 Hash: 7e99b4a1... verified</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </Modal>
  );
};

export default DocumentViewerModal;
