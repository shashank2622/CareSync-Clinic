import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { Button } from '../../components/common/Button.js';
import { Activity, Lock, Mail, AlertCircle, ArrowRight, UserCheck, Stethoscope, Shield } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, quickLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (role: 'PATIENT' | 'DOCTOR' | 'ADMIN') => {
    setError(null);
    setIsLoading(true);
    try {
      await quickLogin(role);
      if (role === 'DOCTOR') navigate('/doctor/dashboard');
      else if (role === 'ADMIN') navigate('/admin/dashboard');
      else navigate('/my-appointments');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Quick login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-6 space-y-6">
      {/* Login Card */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-900/5 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center mx-auto shadow-md shadow-teal-600/20">
            <Activity className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Welcome to CareSync</h1>
          <p className="text-xs text-slate-500">Sign in to access your appointments and medical records</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-sm outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-sm outline-none transition-all"
              />
            </div>
          </div>

          <Button type="submit" variant="primary" className="w-full font-bold" isLoading={isLoading}>
            Sign In to Account
          </Button>
        </form>

        {/* Quick Demo Logins */}
        <div className="space-y-2.5 pt-4 border-t border-slate-100">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">
            ⚡ 1-Click Evaluation / Demo Logins
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('PATIENT')}
              className="px-2 py-2 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-slate-700 text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-teal-600" />
              <span>Patient</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('DOCTOR')}
              className="px-2 py-2 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-slate-700 text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer"
            >
              <Stethoscope className="w-4 h-4 text-teal-600" />
              <span>Doctor</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('ADMIN')}
              className="px-2 py-2 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-slate-700 text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer"
            >
              <Shield className="w-4 h-4 text-teal-600" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-bold text-teal-600 hover:underline">
            Register as Patient
          </Link>
        </div>
      </div>
    </div>
  );
};
