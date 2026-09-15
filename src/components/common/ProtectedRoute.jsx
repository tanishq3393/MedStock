import React, { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { hasRequiredRole, isValidRole } from '../../utils/rbac';
import { logoutUser } from '../../store/slices/authSlice';
import { getLiveHospitalRecord } from '../../services/storage';
import ErrorBoundary from './ErrorBoundary';
import { ShieldAlert, Clock, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Route-Level Authorization & Protection Sentinel
 * MedEx Platform
 * 
 * Enforces strict Role-Based Access Control (RBAC):
 * - Blocks unauthenticated guests, redirecting to /login with target state
 * - Detects and purges corrupted or invalid sessions
 * - Blocks cross-role access (e.g. Hospital user attempting direct /admin navigation)
 * - Blocks unapproved/pending hospitals from accessing operational hospital dashboard
 * - Wraps protected view tree in ErrorBoundary for fault isolation
 */
export const ProtectedRoute = ({ children, allowedRole }) => {
  const { isAuthenticated, user, role, token } = useSelector((state) => state.auth);
  const location = useLocation();
  const dispatch = useDispatch();
  const deniedNoticeShown = useRef(false);

  // 1. Session integrity check: Token, user, and role must all exist and be valid
  const isSessionCorrupted = isAuthenticated && (!user || !role || !isValidRole(role) || !token);

  useEffect(() => {
    if (isSessionCorrupted) {
      dispatch(logoutUser());
      toast.error('Session expired or invalid. Please sign in again.');
    }
  }, [isSessionCorrupted, dispatch]);

  if (isSessionCorrupted || !isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Role-Based Access Control check
  if (allowedRole && !hasRequiredRole(user, allowedRole)) {
    if (!deniedNoticeShown.current) {
      deniedNoticeShown.current = true;
      const targetArea = allowedRole === 'admin' ? 'Supervisory Administration' : 'Hospital Operations';
      toast.error(`Access Denied: Your account (${role.toUpperCase()}) cannot access the ${targetArea} portal.`);
    }

    if (role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/hospital/dashboard" replace />;
    }
  }

  // 3. Operational Approval Check: Block pending or rejected hospital from dashboard / operations
  if (role === 'hospital' || allowedRole === 'hospital') {
    const liveHospital = getLiveHospitalRecord(user.id || user.hospitalId || user.email);
    const effectiveStatus = (liveHospital?.status || user.status || '').toLowerCase();

    if (effectiveStatus === 'draft') {
      return <Navigate to={`/hospital-register?hospitalId=${liveHospital?.id || user.hospitalId || user.id || ''}`} replace />;
    }

    if (effectiveStatus === 'requires_correction') {
      const correctionReason = liveHospital?.rejectionReason || user.rejectionReason || 'Administrator requested updates to statutory documents or institution details.';
      return (
        <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-50">
          <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-3xl border border-amber-300 shadow-xl space-y-6 text-center animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto border border-amber-200 shadow-sm">
              <ShieldAlert className="w-9 h-9 stroke-[2.2]" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-950 border border-amber-300">
                REGISTRATION REQUIRES CORRECTION
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Updates Required for Approval
              </h1>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                Platform administration has reviewed your hospital registration application and requested specific corrections.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-left text-xs text-amber-950 space-y-2">
              <div className="text-amber-900 font-bold text-[10px] uppercase tracking-wider">Reason / Instructions:</div>
              <div className="text-xs text-amber-950 font-medium leading-relaxed bg-white/70 p-2.5 rounded-xl border border-amber-200/80">
                {correctionReason}
              </div>
            </div>

            <div className="space-y-2">
              <a
                href={`/hospital-register?hospitalId=${liveHospital?.id || user.hospitalId || user.id || ''}&mode=correction`}
                className="w-full py-3.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2"
              >
                <span>Complete / Update Registration</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  dispatch(logoutUser());
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition"
              >
                Return to Login
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (effectiveStatus === 'pending' || effectiveStatus === 'pending_approval' || effectiveStatus === 'under_review') {
      return (
        <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-50">
          <div className="max-w-lg w-full bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-2xl space-y-6 animate-fadeIn">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-sm">
                <Clock className="w-9 h-9 stroke-[2.2] animate-pulse" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                Current status: Pending Admin Approval
              </span>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Hospital Registration Submitted Successfully
              </h1>
            </div>

            {/* Hospital Details Box */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Hospital Name:</span>
                <span className="font-extrabold text-slate-900 text-right">{liveHospital?.name || user.name || 'Registered Hospital'}</span>
              </div>
              {(liveHospital?.registrationNo || user.registrationNo) && (
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Registration ID:</span>
                  <span className="font-mono font-bold text-teal-700">{liveHospital?.registrationNo || user.registrationNo}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Official Email:</span>
                <span className="font-medium text-slate-700">{liveHospital?.email || user.email}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Campus Location:</span>
                <span className="font-medium text-slate-700 text-right">
                  {liveHospital?.city || user.city ? `${liveHospital?.city || user.city}, ${liveHospital?.state || user.state || ''}` : 'Hospital Campus'}
                </span>
              </div>
            </div>

            {/* Registration Timeline */}
            <div className="space-y-3 pt-1">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Registration Timeline
              </h4>
              <div className="relative pl-5 space-y-4 before:absolute before:left-1.5 before:top-1.5 before:bottom-1.5 before:w-0.5 before:bg-slate-200 text-xs">
                <div className="relative">
                  <span className="absolute -left-5 top-0.5 w-3.5 h-3.5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[9px] ring-4 ring-white">✓</span>
                  <div>
                    <h5 className="font-bold text-teal-950">Registration Submitted</h5>
                    <p className="text-[11px] text-slate-500">Your registration and required documents have been received.</p>
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute -left-5 top-0.5 w-3.5 h-3.5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[9px] ring-4 ring-white animate-pulse">●</span>
                  <div>
                    <h5 className="font-bold text-amber-950">Admin Review</h5>
                    <p className="text-[11px] text-slate-500">Your hospital registration is waiting for administrator approval.</p>
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute -left-5 top-0.5 w-3.5 h-3.5 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center text-[9px] ring-4 ring-white">○</span>
                  <div>
                    <h5 className="font-bold text-slate-400">Hospital Portal Access</h5>
                    <p className="text-[11px] text-slate-400">Available after approval.</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                dispatch(logoutUser());
              }}
              className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Login</span>
            </button>
          </div>
        </div>
      );
    }

    if (effectiveStatus === 'rejected') {
      const rejectionReason = liveHospital?.rejectionReason || user.rejectionReason || 'Statutory documentation incomplete or compliance requirements not met.';
      return (
        <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-50">
          <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-3xl border border-rose-300 shadow-xl space-y-6 text-center animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto border border-rose-200 shadow-sm">
              <ShieldAlert className="w-9 h-9 stroke-[2.2]" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-950 border border-rose-300">
                REGISTRATION REJECTED
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Application Requires Attention
              </h1>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                Your hospital registration was reviewed and could not be approved by platform administration.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/90 border border-rose-200 text-left text-xs text-rose-950 space-y-2">
              <div className="text-rose-900 font-bold text-[10px] uppercase tracking-wider">Reason for Rejection:</div>
              <div className="text-xs text-rose-950 font-medium leading-relaxed bg-white/70 p-2.5 rounded-xl border border-rose-200/80">
                {rejectionReason}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                dispatch(logoutUser());
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Login</span>
            </button>
          </div>
        </div>
      );
    }
  }

  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
};

export default ProtectedRoute;
