import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layouts
import MainLayout from './layouts/MainLayout';
import HospitalLayout from './layouts/HospitalLayout';
import AdminLayout from './layouts/AdminLayout';

// Public & Auth Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import HospitalSignupPage from './pages/auth/HospitalSignupPage';
import AdminSignupPage from './pages/auth/AdminSignupPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import EmailVerificationPage from './pages/auth/EmailVerificationPage';

// Informational & Legal Pages
import AboutPage from './pages/AboutPage';
import HowItWorksPage from './pages/HowItWorksPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsPage from './pages/TermsPage';
import CookiePreferencesPage from './pages/CookiePreferencesPage';
import NotFoundPage from './pages/NotFoundPage';

// Hospital Pages
import HospitalDashboard from './pages/hospital/HospitalDashboard';
import HospitalInventory from './pages/hospital/HospitalInventory';
import Marketplace from './pages/hospital/Marketplace';
import MyRequests from './pages/hospital/MyRequests';
import IncomingRequests from './pages/hospital/IncomingRequests';
import HistoryPage from './pages/hospital/HistoryPage';
import TrackPage from './pages/hospital/TrackPage';
import PaymentHistory from './pages/hospital/PaymentHistory';
import HospitalFeedback from './pages/hospital/HospitalFeedback';
import HospitalProfilePage from './pages/hospital/HospitalProfilePage';
import HospitalWasteManagement from './pages/hospital/HospitalWasteManagement';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminMedicineData from './pages/admin/AdminMedicineData';
import AdminHospitalDetails from './pages/admin/AdminHospitalDetails';
import AdminVerification from './pages/admin/AdminVerification';
import AdminManagement from './pages/admin/AdminManagement';
import AdminFeedback from './pages/admin/AdminFeedback';

// Protected Route Wrapper
import ProtectedRoute from './components/common/ProtectedRoute';

export const App = () => {
  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#1A3A4A',
            color: '#FFFFFF',
            fontSize: '12px',
            fontWeight: '600',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#FFFFFF',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#FFFFFF',
            },
          },
        }}
      />

      <Routes>
        {/* Public Informational & Auth Routes with MainLayout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/cookie-preferences" element={<CookiePreferencesPage />} />

          {/* Authentication & Security Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/hospital-signup" element={<HospitalSignupPage />} />
          <Route path="/admin-signup" element={<AdminSignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<EmailVerificationPage />} />
        </Route>

        {/* Hospital Portal Routes */}
        <Route
          path="/hospital"
          element={
            <ProtectedRoute allowedRole="hospital">
              <HospitalLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/hospital/dashboard" replace />} />
          <Route path="dashboard" element={<HospitalDashboard />} />
          <Route path="inventory" element={<HospitalInventory />} />
          <Route path="marketplace" element={<Marketplace />} />
          <Route path="my-requests" element={<MyRequests />} />
          <Route path="incoming-requests" element={<IncomingRequests />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="track" element={<TrackPage />} />
          <Route path="payment-history" element={<PaymentHistory />} />
          <Route path="waste-management" element={<HospitalWasteManagement />} />
          <Route path="bio-waste-disposal" element={<HospitalWasteManagement />} />
          <Route path="feedback" element={<HospitalFeedback />} />
          <Route path="profile" element={<HospitalProfilePage />} />
        </Route>

        {/* Admin Portal Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="medicine-data" element={<AdminMedicineData />} />
          <Route path="hospital-details" element={<AdminHospitalDetails />} />
          <Route path="verification" element={<AdminVerification />} />
          <Route path="management" element={<AdminManagement />} />
          <Route path="feedback" element={<AdminFeedback />} />
        </Route>

        {/* Catch-all 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
};

export default App;

