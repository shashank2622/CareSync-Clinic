import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { Button } from './Button.js';
import {
  Activity,
  Calendar,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Stethoscope,
  Pill,
  Shield,
  Clock,
  CalendarCheck,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 font-extrabold text-xl text-teal-700 tracking-tight">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-600/20">
              <Activity className="w-5 h-5" />
            </div>
            <span>CareSync<span className="text-slate-900 font-medium">Clinic</span></span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            <Link
              to="/doctors"
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                isActive('/doctors')
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Find Doctors
            </Link>

            {/* Patient Links */}
            {user?.role === 'PATIENT' && (
              <>
                <Link
                  to="/book"
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isActive('/book')
                      ? 'bg-teal-50 text-teal-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Book Visit
                </Link>
                <Link
                  to="/my-appointments"
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isActive('/my-appointments')
                      ? 'bg-teal-50 text-teal-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  My Appointments
                </Link>
                <Link
                  to="/prescriptions"
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isActive('/prescriptions')
                      ? 'bg-teal-50 text-teal-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Prescriptions
                </Link>
              </>
            )}

            {/* Doctor Links */}
            {user?.role === 'DOCTOR' && (
              <>
                <Link
                  to="/doctor/dashboard"
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isActive('/doctor/dashboard')
                      ? 'bg-teal-50 text-teal-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Doctor Portal
                </Link>
                <Link
                  to="/doctor/schedule"
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isActive('/doctor/schedule')
                      ? 'bg-teal-50 text-teal-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  My Shifts
                </Link>
              </>
            )}

            {/* Admin Links */}
            {user?.role === 'ADMIN' && (
              <>
                <Link
                  to="/admin/dashboard"
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isActive('/admin/dashboard')
                      ? 'bg-teal-50 text-teal-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Analytics
                </Link>
                <Link
                  to="/admin/doctors"
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isActive('/admin/doctors')
                      ? 'bg-teal-50 text-teal-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Doctors
                </Link>
                <Link
                  to="/admin/leaves"
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isActive('/admin/leaves')
                      ? 'bg-teal-50 text-teal-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Leave & Conflicts
                </Link>
                <Link
                  to="/admin/users"
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isActive('/admin/users')
                      ? 'bg-teal-50 text-teal-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Users
                </Link>
              </>
            )}
          </nav>

          {/* User Controls & Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {/* Google Calendar Connected Indicator */}
                {user.hasGoogleCalendarConnected && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <CalendarCheck className="w-3.5 h-3.5" />
                    <span>Cal Synced</span>
                  </span>
                )}

                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-teal-300 hover:bg-teal-50/50 transition-all text-sm"
                >
                  <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs">
                    {user.fullName.charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-800 text-xs leading-none">{user.fullName}</p>
                    <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">{user.role}</span>
                  </div>
                </Link>

                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-rose-600 hover:bg-rose-50">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    Log In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2">
          <Link
            to="/doctors"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
          >
            Find Doctors
          </Link>
          {user?.role === 'PATIENT' && (
            <>
              <Link
                to="/book"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
              >
                Book Appointment
              </Link>
              <Link
                to="/my-appointments"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
              >
                My Appointments
              </Link>
              <Link
                to="/prescriptions"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
              >
                Prescriptions
              </Link>
            </>
          )}
          {user?.role === 'DOCTOR' && (
            <Link
              to="/doctor/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
            >
              Doctor Portal
            </Link>
          )}
          {user?.role === 'ADMIN' && (
            <Link
              to="/admin/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
            >
              Admin Dashboard
            </Link>
          )}
          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
            {user ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg font-medium text-slate-800"
                >
                  My Profile ({user.fullName})
                </Link>
                <Button variant="danger" size="sm" onClick={handleLogout} className="w-full">
                  Logout
                </Button>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Log In
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
