import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, XCircle, MinusCircle, Radio, Check, X, AlertCircle } from 'lucide-react';

export const StatusBadge = ({ status, className = '', showIcon = true }) => {
  if (!status) return null;

  const normalized = status.toLowerCase().trim();

  // GREEN: completed / healthy / successful / paid / delivered / certified
  if (['verified', 'accepted', 'paid', 'delivered', 'success', 'incinerated & certified', 'certified', 'healthy'].includes(normalized)) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 ${className}`}>
        {showIcon && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />}
        <span className="capitalize">{status}</span>
      </span>
    );
  }

  // BLUE: active / in progress / ordered / pickup scheduled / under review
  if (['ordered', 'in transit', 'in_transit', 'under_review', 'under review', 'pickup scheduled', 'pickup_scheduled'].includes(normalized)) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/80 ${className}`}>
        {showIcon && <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />}
        <span className="capitalize">{status}</span>
      </span>
    );
  }

  // AMBER: attention / pending / near expiry / low stock / reported / quarantine
  if (['pending', 'near expiry', 'near-expiry', 'low stock', 'low-stock', 'reported', 'quarantine', 'in transit to bio-centre', 'documents_missing', 'documents missing'].includes(normalized)) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/90 ${className}`}>
        {showIcon && <AlertCircle className="w-3.5 h-3.5 text-amber-600 stroke-[2.5]" />}
        <span className="capitalize">{status}</span>
      </span>
    );
  }

  // RED: critical / failed / expired / rejected / suspended
  if (['rejected', 'failed', 'cancelled', 'suspended', 'expired', 'critical'].includes(normalized)) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/80 ${className}`}>
        {showIcon && <X className="w-3.5 h-3.5 text-rose-600 stroke-[2.5]" />}
        <span className="capitalize">{status}</span>
      </span>
    );
  }

  // GRAY: inactive / default
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 ${className}`}>
      {showIcon && <MinusCircle className="w-3 h-3 text-slate-400" />}
      <span className="capitalize">{status}</span>
    </span>
  );
};

export default StatusBadge;

