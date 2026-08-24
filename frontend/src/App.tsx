import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext.js';
import { MainLayout } from './layouts/MainLayout.js';
import { ProtectedRoute } from './layouts/ProtectedRoute.js';

// Public Pages
import { LandingPage } from './pages/public/LandingPage.js';
import { DoctorSearchPage } from './pages/public/DoctorSearchPage.js';
import { LoginPage } from './pages/public/LoginPage.js';
import { RegisterPage } from './pages/public/RegisterPage.js';

// Patient Pages
import { BookAppointmentFlow } from './pages/patient/BookAppointmentFlow.js';
import { MyAppointmentsPage } from './pages/patient/MyAppointmentsPage.js';
import { PrescriptionsPage } from './pages/patient/PrescriptionsPage.js';
import { PatientProfilePage } from './pages/patient/PatientProfilePage.js';

// Doctor Pages
import { DoctorDashboard } from './pages/doctor/DoctorDashboard.js';
import { DoctorConsultationPage } from './pages/doctor/DoctorConsultationPage.js';
import { DoctorSchedulePage } from './pages/doctor/DoctorSchedulePage.js';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard.js';
import { DoctorManagementPage } from './pages/admin/DoctorManagementPage.js';
import { LeaveManagementPage } from './pages/admin/LeaveManagementPage.js';
import { UserManagementPage } from './pages/admin/UserManagementPage.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              {/* Public Routes */}
              <Route index element={<LandingPage />} />
              <Route path="doctors" element={<DoctorSearchPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />

              {/* Patient Protected Routes */}
              <Route
                path="book"
                element={
                  <ProtectedRoute allowedRoles={['PATIENT']}>
                    <BookAppointmentFlow />
                  </ProtectedRoute>
                }
              />
              <Route
                path="my-appointments"
                element={
                  <ProtectedRoute allowedRoles={['PATIENT']}>
                    <MyAppointmentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="prescriptions"
                element={
                  <ProtectedRoute allowedRoles={['PATIENT']}>
                    <PrescriptionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="profile"
                element={
                  <ProtectedRoute>
                    <PatientProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Doctor Protected Routes */}
              <Route
                path="doctor/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['DOCTOR']}>
                    <DoctorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="doctor/consultation/:id"
                element={
                  <ProtectedRoute allowedRoles={['DOCTOR']}>
                    <DoctorConsultationPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="doctor/schedule"
                element={
                  <ProtectedRoute allowedRoles={['DOCTOR']}>
                    <DoctorSchedulePage />
                  </ProtectedRoute>
                }
              />

              {/* Admin Protected Routes */}
              <Route
                path="admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/doctors"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <DoctorManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/leaves"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <LeaveManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/users"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <UserManagementPage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
