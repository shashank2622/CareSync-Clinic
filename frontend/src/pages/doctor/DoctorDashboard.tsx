import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { appointmentsApi } from '../../api/index.js';
import { Button } from '../../components/common/Button.js';
import { Badge, AppointmentStatusBadge, UrgencyBadge } from '../../components/common/Badge.js';
import {
  Calendar,
  Clock,
  User,
  Activity,
  CheckCircle2,
  Stethoscope,
  Sparkles,
  ArrowRight,
  FileText,
  AlertTriangle,
} from 'lucide-react';

export const DoctorDashboard: React.FC = () => {
  const { data: appointmentsData, isLoading } = useQuery({
    queryKey: ['doctorAppointments'],
    queryFn: () => appointmentsApi.getAppointments(),
  });

  const appointments = appointmentsData?.data || [];
  const upcomingAppointments = appointments.filter((a) => a.status === 'CONFIRMED');
  const completedAppointments = appointments.filter((a) => a.status === 'COMPLETED');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Physician Workstation</span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Clinical Consultation Queue</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review patient symptoms, AI diagnostic prep, and conduct clinical visits.
        </p>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Upcoming Consultations</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">{upcomingAppointments.length}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Completed Consultations</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">{completedAppointments.length}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">High Urgency Patients</p>
            <h3 className="text-2xl font-extrabold text-rose-600 mt-1 font-mono">
              {upcomingAppointments.filter((a) => a.preVisitSummary?.urgencyLevel === 'HIGH' || a.preVisitSummary?.urgencyLevel === 'EMERGENCY').length}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Queue Table / Cards */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900">Today's Patient Consultations</h2>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200"></div>
            ))}
          </div>
        ) : upcomingAppointments.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
            <CheckCircle2 className="w-10 h-10 text-teal-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">Your queue is clear</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No upcoming appointments currently scheduled. New patient bookings will appear here in real time.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingAppointments.map((apt) => (
              <div
                key={apt.id}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-teal-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500">#{apt.appointmentNumber}</span>
                    <AppointmentStatusBadge status={apt.status} />
                    {apt.preVisitSummary?.urgencyLevel && (
                      <UrgencyBadge level={apt.preVisitSummary.urgencyLevel} />
                    )}
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-teal-600 text-white font-bold flex items-center justify-center text-sm flex-shrink-0">
                      {apt.patient.user.fullName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{apt.patient.user.fullName}</h3>
                      <p className="text-xs text-slate-500">
                        {apt.patient.bloodGroup ? `Blood: ${apt.patient.bloodGroup} • ` : ''}
                        Scheduled for: <strong className="text-slate-700">{new Date(apt.slotStartTime).toUTCString()}</strong>
                      </p>
                    </div>
                  </div>

                  {apt.symptomSubmission && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 space-y-1">
                      <p><strong className="text-slate-900">Chief Complaint:</strong> {apt.symptomSubmission.chiefComplaint}</p>
                      <p className="text-slate-500 line-clamp-1">Symptoms: {apt.symptomSubmission.symptomsText}</p>
                    </div>
                  )}
                </div>

                <div className="pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 flex md:flex-col items-stretch gap-2">
                  <Link to={`/doctor/consultation/${apt.id}`}>
                    <Button variant="primary" size="md" className="w-full font-bold shadow-md shadow-teal-600/10">
                      <Stethoscope className="w-4 h-4 mr-1.5" /> Start Consultation
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
