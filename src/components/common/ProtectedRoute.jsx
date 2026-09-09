import React, { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { hasRequiredRole, isValidRole } from '../../utils/rbac';
import { logoutUser } from '../../store/slices/authSlice';
import ErrorBoundary from './ErrorBoundary';
import toast from 'react-hot-toast';

/**
 * Route-Level Authorization & Protection Sentinel
 * MediStock / SmartMediShare Platform
 * 
 * Enforces strict Role-Based Access Control (RBAC):
 * - Blocks unauthenticated guests, redirecting to /login with target state
 * - Detects and purges corrupted or invalid sessions
 * - Blocks cross-role access (e.g. Hospital user attempting direct /admin navigation)
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

  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
};

export default ProtectedRoute;
