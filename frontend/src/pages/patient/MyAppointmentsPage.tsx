import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi, doctorsApi } from '../../api/index.js';
import { Button } from '../../components/common/Button.js';
import { Badge, AppointmentStatusBadge } from '../../components/common/Badge.js';
import { Modal } from '../../components/common/Modal.js';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Stethoscope,
  XCircle,
  RotateCcw,
  FileText,
  Sparkles,
  CalendarCheck,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Appointment } from '../../types/index.js';

export const MyAppointmentsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Cancel Modal State
  const [cancellingAppointment, setCancellingAppointment] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');

  // AI Post-Visit Summary Modal State
  const [selectedSummaryAppointmentId, setSelectedSummaryAppointmentId] = useState<string | null>(null);

  // Fetch appointments
  const { data: appointmentsData, isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => appointmentsApi.getAppointments(),
  });

  // Fetch Post-Visit AI summary when modal opened
  const { data: summaryData, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['postVisitSummary', selectedSummaryAppointmentId],
    queryFn: () => appointmentsApi.getPostVisitSummary(selectedSummaryAppointmentId!),
    enabled: !!selectedSummaryAppointmentId,
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: (data: { id: string; reason: string }) => appointmentsApi.cancelAppointment(data.id, data.reason),
    onSuccess: () => {
      setCancellingAppointment(null);
      setCancelReason('');
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  const appointments = appointmentsData?.data || [];

  const filteredAppointments = appointments.filter((apt) => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'UPCOMING') return apt.status === 'CONFIRMED' || apt.status === 'HOLD_ACTIVE';
    if (filterStatus === 'COMPLETED') return apt.status === 'COMPLETED';
    if (filterStatus === 'CANCELLED') return apt.status.startsWith('CANCELLED');
    return true;
  });

  const handleCancelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingAppointment) return;
    cancelMutation.mutate({ id: cancellingAppointment.id, reason: cancelReason });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Patient Care Hub</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">My Medical Consultations</h1>
          <p className="text-xs text-slate-500 mt-1">Track upcoming visits, clinical notes, and post-visit AI summaries.</p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {['ALL', 'UPCOMING', 'COMPLETED', 'CANCELLED'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                filterStatus === status
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments List */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-slate-200"></div>
          ))}
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4">
          <CalendarIcon className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No appointments found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You don't have any appointments matching this filter status.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((apt) => {
            const isUpcoming = apt.status === 'CONFIRMED';
            const isCompleted = apt.status === 'COMPLETED';

            return (
              <div
                key={apt.id}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-teal-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500">#{apt.appointmentNumber}</span>
                    <AppointmentStatusBadge status={apt.status} />
                    {apt.calendarEvent?.syncStatus === 'SYNCED' && (
                      <Badge variant="info" size="sm" className="gap-1">
                        <CalendarCheck className="w-3 h-3 text-teal-600" /> Synced with Google Cal
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 font-bold text-base flex-shrink-0">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{apt.doctor.user.fullName}</h3>
                      <p className="text-xs text-teal-700 font-semibold">{apt.doctor.specialization}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(apt.slotStartTime).toUTCString()}</span>
                    </div>
                    {apt.symptomSubmission && (
                      <div className="flex items-center gap-1.5 truncate">
                        <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate"><strong>Reason:</strong> {apt.symptomSubmission.chiefComplaint}</span>
                      </div>
                    )}
                  </div>

                  {apt.cancellationReason && (
                    <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-100">
                      <strong>Cancellation Note:</strong> {apt.cancellationReason}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap md:flex-col items-stretch gap-2 min-w-[170px] pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {isUpcoming && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300"
                      onClick={() => setCancellingAppointment(apt)}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" /> Cancel Visit
                    </Button>
                  )}

                  {isCompleted && (
                    <Button
                      variant="primary"
                      size="sm"
                      className="bg-teal-600 text-white font-bold"
                      onClick={() => setSelectedSummaryAppointmentId(apt.id)}
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1" /> AI Patient Summary
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Appointment Modal */}
      <Modal
        isOpen={!!cancellingAppointment}
        onClose={() => setCancellingAppointment(null)}
        title="Cancel Appointment"
        subtitle={`Appointment #${cancellingAppointment?.appointmentNumber}`}
      >
        <form onSubmit={handleCancelSubmit} className="space-y-4">
          <p className="text-xs text-slate-600">
            Are you sure you want to cancel this consultation with Dr. {cancellingAppointment?.doctor?.user?.fullName}?
            This action will release the slot and remove any Google Calendar events.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Cancellation *</label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Symptoms resolved, scheduling conflict, personal reasons..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-rose-500"
            ></textarea>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="ghost" size="sm" onClick={() => setCancellingAppointment(null)}>
              Keep Appointment
            </Button>
            <Button type="submit" variant="danger" size="sm" isLoading={cancelMutation.isPending}>
              Confirm Cancellation
            </Button>
          </div>
        </form>
      </Modal>

      {/* AI Post-Visit Summary Modal */}
      <Modal
        isOpen={!!selectedSummaryAppointmentId}
        onClose={() => setSelectedSummaryAppointmentId(null)}
        title="AI Post-Visit Summary & Care Plan"
        subtitle="Patient-friendly translation of physician's clinical notes"
        maxWidth="xl"
      >
        {isLoadingSummary ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-medium text-slate-500">Generating AI consultation summary...</p>
          </div>
        ) : summaryData?.data ? (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-xs space-y-2">
              <span className="font-bold text-teal-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-600" /> Patient-Friendly Consultation Summary
              </span>
              <p className="text-teal-900 leading-relaxed whitespace-pre-line">
                {summaryData.data.patientFriendlySummary || summaryData.data.patientSummary || 'No summary available.'}
              </p>
            </div>

            {summaryData.data.medicationSchedule && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Medication Schedule</h4>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 whitespace-pre-line">
                  {summaryData.data.medicationSchedule}
                </div>
              </div>
            )}

            {summaryData.data.followUpSteps && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Next Steps & Follow-up</h4>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 whitespace-pre-line">
                  {summaryData.data.followUpSteps}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 text-center text-xs text-slate-500">No clinical summary available yet.</div>
        )}
      </Modal>
    </div>
  );
};
