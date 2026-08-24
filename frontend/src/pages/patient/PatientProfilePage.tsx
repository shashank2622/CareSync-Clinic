import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { authApi, calendarApi } from '../../api/index.js';
import { Button } from '../../components/common/Button.js';
import { Badge } from '../../components/common/Badge.js';
import {
  User,
  Mail,
  Phone,
  Calendar,
  CalendarCheck,
  CalendarX,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
} from 'lucide-react';

export const PatientProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    dob: user?.patientProfile?.dob || '',
    bloodGroup: user?.patientProfile?.bloodGroup || '',
    emergencyContact: user?.patientProfile?.emergencyContact || '',
    medicalHistorySummary: user?.patientProfile?.medicalHistorySummary || '',
  });

  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Check Google Calendar connection status
  const { data: calendarData, refetch: refetchCalendar } = useQuery({
    queryKey: ['calendarStatus'],
    queryFn: () => calendarApi.getStatus(),
  });

  const isCalendarConnected = !!calendarData?.data?.isConnected;

  useEffect(() => {
    if (searchParams.get('calendar_connected') === 'success') {
      refetchCalendar();
      refreshUser();
    }
  }, [searchParams, refetchCalendar, refreshUser]);

  // Connect calendar handler
  const handleConnectCalendar = async () => {
    try {
      const res = await calendarApi.getConnectUrl();
      if (res.success && res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err: any) {
      alert('Could not initiate Google Calendar connection: ' + err.message);
    }
  };

  // Disconnect calendar mutation
  const disconnectMutation = useMutation({
    mutationFn: calendarApi.disconnect,
    onSuccess: () => {
      refetchCalendar();
      refreshUser();
    },
  });

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: () => {
      setIsSaved(true);
      setSaveError(null);
      refreshUser();
      setTimeout(() => setIsSaved(false), 3000);
    },
    onError: (err: any) => {
      setSaveError(err.response?.data?.message || 'Profile update failed.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Account & Preferences</span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Patient Profile & Integrations</h1>
        <p className="text-xs text-slate-500 mt-1">Manage personal health records, emergency contacts, and calendar synchronization.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Form (2 cols) */}
        <div className="md:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900">Personal & Medical Details</h2>
            {isSaved && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Profile Updated
              </span>
            )}
          </div>

          {saveError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={formData.dob || ''}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
                <input
                  type="text"
                  placeholder="e.g. O+, A-"
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact</label>
              <input
                type="text"
                placeholder="e.g. Spouse / Relative Name and Phone"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Medical History / Chronic Conditions</label>
              <textarea
                rows={3}
                placeholder="Allergies, past surgeries, or recurring conditions..."
                value={formData.medicalHistorySummary}
                onChange={(e) => setFormData({ ...formData, medicalHistorySummary: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-teal-500"
              ></textarea>
            </div>

            <Button type="submit" variant="primary" size="sm" isLoading={updateProfileMutation.isPending}>
              Save Profile Changes
            </Button>
          </form>
        </div>

        {/* Integrations (1 col) */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Google Calendar</h3>
                <p className="text-[11px] text-slate-500">Two-way consultation sync</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Status:</span>
                {isCalendarConnected ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Connected
                  </span>
                ) : (
                  <span className="text-slate-400 font-medium">Not Connected</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                When connected, confirmed appointments are automatically placed on your personal Google Calendar and updated on reschedule.
              </p>
            </div>

            {isCalendarConnected ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-rose-600 border-rose-200 hover:bg-rose-50"
                onClick={() => disconnectMutation.mutate()}
                isLoading={disconnectMutation.isPending}
              >
                <CalendarX className="w-4 h-4 mr-1.5" /> Disconnect Calendar
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                className="w-full bg-blue-600 hover:bg-blue-700 font-bold"
                onClick={handleConnectCalendar}
              >
                <LinkIcon className="w-4 h-4 mr-1.5" /> Connect Google Calendar
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
