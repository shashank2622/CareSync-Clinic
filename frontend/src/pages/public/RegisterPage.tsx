import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { Button } from '../../components/common/Button.js';
import { Activity, User, Mail, Lock, Phone, Heart, AlertCircle, FileText } from 'lucide-react';
import { Gender } from '../../types/index.js';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    dob: '',
    gender: 'PREFER_NOT_TO_SAY' as Gender,
    bloodGroup: '',
    emergencyContact: '',
    medicalHistorySummary: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await register(formData);
      navigate('/book');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please check your details and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto my-6 space-y-6">
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-900/5 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center mx-auto shadow-md shadow-teal-600/20">
            <Activity className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Create Patient Account</h1>
          <p className="text-xs text-slate-500">Register to schedule visits, track symptoms, and manage prescriptions</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  name="fullName"
                  placeholder="Alice Johnson"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  name="email"
                  placeholder="alice@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password * (Min 8 chars, 1 Upper, 1 Number)</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  name="phone"
                  placeholder="+1-555-0199"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none bg-white focus:border-teal-500"
              >
                <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                <option value="FEMALE">Female</option>
                <option value="MALE">Male</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
              <input
                type="text"
                name="bloodGroup"
                placeholder="e.g. O+, A-"
                value={formData.bloodGroup}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact</label>
            <input
              type="text"
              name="emergencyContact"
              placeholder="e.g. Mark Johnson (Spouse): +1-555-0302"
              value={formData.emergencyContact}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Medical History / Allergies Summary</label>
            <textarea
              name="medicalHistorySummary"
              rows={2}
              placeholder="e.g. Penicillin allergy, mild asthma in childhood..."
              value={formData.medicalHistorySummary}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-teal-500"
            ></textarea>
          </div>

          <Button type="submit" variant="primary" className="w-full font-bold pt-2" isLoading={isLoading}>
            Complete Registration & Get Started
          </Button>
        </form>

        <div className="text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-teal-600 hover:underline">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};
