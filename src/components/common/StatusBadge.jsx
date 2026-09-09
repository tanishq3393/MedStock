import React from 'react';
<<<<<<< HEAD
import { CheckCircle2, Clock, AlertTriangle, XCircle, MinusCircle, Radio, Check, X, AlertCircle, Trash2, ShieldCheck } from 'lucide-react';
=======
import { 
  Check, 
  X, 
  AlertCircle, 
  MinusCircle, 
  Truck, 
  Clock, 
  Package, 
  Flame, 
  ShieldCheck, 
  RotateCcw 
} from 'lucide-react';
>>>>>>> 6ddff35 (Added Cancel)

/**
 * StatusBadge
 * Consistent institutional badge for all MediStock lifecycles:
 * - Inventory: available, low_stock, expiring_soon, expired, archived
 * - Requests: pending, accepted, rejected, transferred, received
 * - Transfers: request_approved, preparing, dispatched, in_transit, delivered, received
 * - Disposal: expired, disposal_requested, disposed
 * - Accounts: verified, pending_verification, requires_attention, suspended
 */
export const StatusBadge = ({ status, className = '', showIcon = true }) => {
  if (!status) return null;

  const raw = String(status).trim();
  const normalized = raw.toLowerCase().replace(/[\-_]/g, ' ');

<<<<<<< HEAD
  // GREEN: available / verified / accepted / paid / delivered / success / certified / healthy / active
  if (['available', 'verified', 'accepted', 'paid', 'delivered', 'success', 'incinerated & certified', 'certified', 'healthy', 'active stock', 'active'].includes(normalized)) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 ${className}`}>
        {showIcon && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />}
        <span className="capitalize">{status === 'healthy' || status === 'active' ? 'Available' : status}</span>
      </span>
    );
  }

  // PURPLE/SLATE: disposed / incinerated / bio-destroyed
  if (['disposed', 'incinerated', 'bio-destroyed', 'destroyed'].includes(normalized)) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200/80 ${className}`}>
        {showIcon && <Trash2 className="w-3.5 h-3.5 text-purple-600 stroke-[2.2]" />}
        <span className="capitalize">{status}</span>
=======
  // 1. GREEN / SUCCESS: Accepted, Delivered, Received, Disposed, Verified, Healthy
  if ([
    'verified', 'accepted', 'approved', 'request approved', 'paid', 'delivered', 
    'received', 'disposed', 'incinerated', 'certified', 'healthy', 'available', 
    'success'
  ].includes(normalized)) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs ${className}`}>
        {showIcon && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5] flex-shrink-0" />}
        <span className="capitalize">{raw}</span>
>>>>>>> 6ddff35 (Added Cancel)
      </span>
    );
  }

<<<<<<< HEAD
  // BLUE/CYAN: in progress / ordered / pickup scheduled / under review / in transit
  if (['ordered', 'in transit', 'in_transit', 'under_review', 'under review', 'pickup scheduled', 'pickup_scheduled'].includes(normalized)) {
=======
  // 2. BLUE / CYAN: In Transit, Dispatched, Preparing, Transferred, Under Review
  if ([
    'in transit', 'dispatched', 'preparing', 'transferred', 'packed', 'pickup scheduled', 
    'under review', 'ordered', 'active'
  ].includes(normalized)) {
>>>>>>> 6ddff35 (Added Cancel)
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs ${className}`}>
        {showIcon && <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse flex-shrink-0" />}
        <span className="capitalize">{raw}</span>
      </span>
    );
  }

<<<<<<< HEAD
  // AMBER/ORANGE: disposal requested / pending disposal / near expiry / expiring soon / low stock / attention
  if (['disposal requested', 'disposal_requested', 'pending_disposal', 'pending disposal', 'expiring soon', 'expiring_soon', 'near expiry', 'near-expiry', 'low stock', 'low-stock', 'pending', 'reported', 'quarantine', 'in transit to bio-centre', 'documents_missing', 'documents missing'].includes(normalized)) {
    let displayLabel = status;
    if (normalized === 'near-expiry' || normalized === 'near expiry') displayLabel = 'Expiring Soon';
    if (normalized === 'low-stock') displayLabel = 'Low Stock';
    if (normalized === 'pending_disposal') displayLabel = 'Disposal Requested';

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/90 ${className}`}>
        {showIcon && <AlertCircle className="w-3.5 h-3.5 text-amber-600 stroke-[2.5]" />}
        <span className="capitalize">{displayLabel}</span>
=======
  // 3. AMBER / WARNING: Pending, Disposal Requested, Expiring Soon, Low Stock, Requires Attention
  if ([
    'pending', 'pending verification', 'disposal requested', 'expiring soon', 
    'near expiry', 'low stock', 'requires attention', 'reported', 'quarantine', 
    'actionable', 'reviewing'
  ].includes(normalized)) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/90 shadow-xs ${className}`}>
        {showIcon && <AlertCircle className="w-3.5 h-3.5 text-amber-600 stroke-[2.5] flex-shrink-0" />}
        <span className="capitalize">{raw}</span>
>>>>>>> 6ddff35 (Added Cancel)
      </span>
    );
  }

<<<<<<< HEAD
  // RED: expired / critical / rejected / failed / cancelled / suspended
  if (['expired', 'critical', 'critical expiry', 'rejected', 'failed', 'cancelled', 'suspended'].includes(normalized)) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/80 ${className}`}>
        {showIcon && <X className="w-3.5 h-3.5 text-rose-600 stroke-[2.5]" />}
        <span className="capitalize">{normalized === 'critical' ? 'Critical Expiry' : status}</span>
=======
  // 4. RED / DANGER: Expired, Rejected, Failed, Suspended, Critical
  if ([
    'expired', 'rejected', 'failed', 'cancelled', 'suspended', 'critical', 'danger'
  ].includes(normalized)) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-xs ${className}`}>
        {showIcon && <X className="w-3.5 h-3.5 text-rose-600 stroke-[2.5] flex-shrink-0" />}
        <span className="capitalize">{raw}</span>
>>>>>>> 6ddff35 (Added Cancel)
      </span>
    );
  }

  // 5. SLATE / MUTED: Archived, Inactive, Default
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 ${className}`}>
      {showIcon && <MinusCircle className="w-3 h-3 text-slate-400 flex-shrink-0" />}
      <span className="capitalize">{raw}</span>
    </span>
  );
};

export default StatusBadge;
