import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doctorsApi, adminApi } from '../../api/index.js';
import { Button } from '../../components/common/Button.js';
import { Badge } from '../../components/common/Badge.js';
import { Modal } from '../../components/common/Modal.js';
import {
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Bell,
  Stethoscope,
  Clock,
  User,
  ShieldCheck,
} from 'lucide-react';

export const LeaveManagementPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [reason, setReason] = useState<string>('Attending Annual Medical Symposium');

  // Affected appointments result modal
  const [conflictResult, setConflictResult] = useState<{
    affectedCount: number;
    affectedAppointments: Array<{ id: string; appointmentNumber: string; patientName: string; slotStartTime: string }>;
  } | null>(null);

  // Fetch doctors
  const { data: doctorsData } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => doctorsApi.getDoctors(),
  });

  const doctors = doctorsData?.data || [];
  const currentDoctorId = selectedDoctorId || doctors[0]?.id || '';

  // Fetch doctor leaves
  const { data: leavesData, isLoading: isLoadingLeaves } = useQuery({
    queryKey: ['doctorLeaves', currentDoctorId],
    queryFn: () => adminApi.getDoctorLeaves(currentDoctorId),
    enabled: !!currentDoctorId,
  });

  const leaves = leavesData?.data || [];

  // Create leave mutation
  const createLeaveMutation = useMutation({
    mutationFn: (data: { doctorId: string; startDate: string; endDate: string; reason: string }) =>
      adminApi.createDoctorLeave(data.doctorId, {
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
      }),
    onSuccess: (res) => {
      setConflictResult({
        affectedCount: res.data.affectedCount,
        affectedAppointments: res.data.affectedAppointments,
      });
      queryClient.invalidateQueries({ queryKey: ['doctorLeaves', currentDoctorId] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to schedule doctor leave.');
    },
  });

  // Delete leave mutation
  const deleteLeaveMutation = useMutation({
    mutationFn: (leaveId: string) => adminApi.deleteDoctorLeave(currentDoctorId, leaveId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctorLeaves', currentDoctorId] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDoctorId) return;
    createLeaveMutation.mutate({
      doctorId: currentDoctorId,
      startDate,
      endDate,
      reason,
    });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Conflict Resolution Engine</span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Doctor Leave & Conflict Manager</h1>
        <p className="text-xs text-slate-500 mt-1">
          Declare physician leave with atomic transaction guarantees, slot release, and automated patient reschedule notifications.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Schedule Leave Form (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900">Declare Doctor Absence</h2>
            <p className="text-xs text-slate-500">Conflicts are transitioned to CANCELLED_DOCTOR_LEAVE.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Physician *</label>
              <select
                value={currentDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium outline-none bg-white focus:border-teal-500"
              >
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.user?.fullName} ({doc.specialization})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date *</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">End Date *</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Absence *</label>
              <input
                type="text"
                required
                placeholder="e.g. Medical Conference, Emergency Leave, Annual Vacation"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-teal-500"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Automatic Conflict Management Strategy</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                When confirmed, any active consultations in this window will be marked as <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">CANCELLED_DOCTOR_LEAVE</code>, released for re-booking, and all affected patients will immediately receive an email with a 1-click reschedule link.
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full bg-amber-600 hover:bg-amber-700 font-bold"
              isLoading={createLeaveMutation.isPending}
            >
              Schedule Leave & Trigger Conflict Cascades
            </Button>
          </form>
        </div>

        {/* Right Column: Doctor Leave Records Table (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900">Scheduled Leaves History</h2>
            <Badge variant="warning" size="sm">{leaves.length} Leave Record(s)</Badge>
          </div>

          {isLoadingLeaves ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading leave records...</div>
          ) : leaves.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No leave records found for this doctor.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {leaves.map((l: any) => (
                <div key={l.id} className="py-4 flex items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <Calendar className="w-4 h-4 text-amber-600" />
                      <span>
                        {new Date(l.startDate).toISOString().split('T')[0]} to {new Date(l.endDate).toISOString().split('T')[0]}
                      </span>
                    </div>
                    <p className="text-slate-500 font-medium">{l.reason || 'Personal Leave'}</p>
                    {l.approvedBy && (
                      <p className="text-[10px] text-slate-400">Approved by: {l.approvedBy.fullName}</p>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-rose-600 hover:bg-rose-50 p-2"
                    onClick={() => deleteLeaveMutation.mutate(l.id)}
                    isLoading={deleteLeaveMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Conflict Cascade Summary Modal */}
      <Modal
        isOpen={!!conflictResult}
        onClose={() => setConflictResult(null)}
        title="Leave Scheduled & Conflicts Resolved"
        subtitle="Automatic Patient Notification Audit"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-2">
            <span className="font-bold text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Transaction Completed Successfully
            </span>
            <p className="text-emerald-900">
              Doctor leave has been saved. <strong>{conflictResult?.affectedCount}</strong> existing patient appointment(s) were safely transitioned and notified.
            </p>
          </div>

          {conflictResult && conflictResult.affectedAppointments.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Affected Patients Notified</h4>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {conflictResult.affectedAppointments.map((apt) => (
                  <div key={apt.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-900">{apt.patientName}</span>
                      <p className="text-[10px] font-mono text-slate-500">#{apt.appointmentNumber}</p>
                    </div>
                    <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                      Reschedule Alert Sent 📧
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 text-right">
            <Button variant="primary" size="sm" onClick={() => setConflictResult(null)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
