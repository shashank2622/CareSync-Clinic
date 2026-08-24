import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { prescriptionsApi, remindersApi } from '../../api/index.js';
import { Button } from '../../components/common/Button.js';
import { Badge } from '../../components/common/Badge.js';
import {
  Pill,
  Clock,
  Calendar,
  Sparkles,
  Bell,
  BellOff,
  CheckCircle2,
  AlertCircle,
  FileText,
  Stethoscope,
} from 'lucide-react';

export const PrescriptionsPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Fetch prescriptions
  const { data: prescriptionsData, isLoading: isLoadingPrescriptions } = useQuery({
    queryKey: ['myPrescriptions'],
    queryFn: () => prescriptionsApi.getMyPrescriptions(),
  });

  // Fetch active medication reminders
  const { data: remindersData, isLoading: isLoadingReminders } = useQuery({
    queryKey: ['activeReminders'],
    queryFn: () => remindersApi.getActiveReminders(),
  });

  // Reminder toggle mutation
  const toggleMutation = useMutation({
    mutationFn: (data: { id: string; isActive: boolean }) => remindersApi.toggleReminder(data.id, data.isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeReminders'] });
    },
  });

  const prescriptions = prescriptionsData?.data || [];
  const reminders = remindersData?.data || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Medication & Care Center</span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Prescriptions & Reminders</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review physician prescriptions, dosage schedules, and manage automated daily dosage reminders.
        </p>
      </div>

      {/* Active Daily Reminders Widget */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Automated Daily Medication Reminders</h2>
              <p className="text-xs text-slate-500">Managed in the background by BullMQ & Redis queues</p>
            </div>
          </div>
          <Badge variant="info" size="sm">
            {reminders.filter((r) => r.isActive).length} Active Schedule(s)
          </Badge>
        </div>

        {isLoadingReminders ? (
          <div className="h-20 bg-slate-100 rounded-xl animate-pulse"></div>
        ) : reminders.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
            No active medication reminders. When a doctor issues a prescription, your daily reminder schedule will appear here automatically.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className={`p-4 rounded-2xl border transition-all ${
                  reminder.isActive
                    ? 'bg-teal-50/40 border-teal-200'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Pill className="w-4 h-4 text-teal-600" />
                    <span className="font-bold text-sm text-slate-900">{reminder.medication.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleMutation.mutate({ id: reminder.id, isActive: !reminder.isActive })}
                    className={`p-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      reminder.isActive
                        ? 'bg-teal-600 text-white hover:bg-teal-700'
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                  >
                    {reminder.isActive ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <p className="text-xs text-slate-600 mt-1">Dosage: {reminder.medication.dosage}</p>

                <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-mono font-bold text-teal-800">⏰ {reminder.scheduledTime}</span>
                  <Badge variant="default" size="sm">{reminder.frequency}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prescriptions History */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Clinical Prescriptions History</h2>

        {isLoadingPrescriptions ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="h-40 bg-white rounded-2xl border border-slate-200"></div>
            ))}
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
            <Pill className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No prescriptions on record</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Prescriptions issued after your doctor consultations will be saved and formatted here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {prescriptions.map((rx) => (
              <div
                key={rx.id}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
                      Rx
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">
                        Prescription - {new Date(rx.createdAt).toLocaleDateString()}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Prescribed by {rx.appointment?.doctor?.user?.fullName || 'Physician'}
                      </p>
                    </div>
                  </div>
                  {rx.patientSummary && (
                    <Badge variant="info" size="sm" className="gap-1">
                      <Sparkles className="w-3 h-3 text-teal-600" /> AI Patient Summary Attached
                    </Badge>
                  )}
                </div>

                {/* Medications Table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Prescribed Medications</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 uppercase font-bold">
                          <th className="py-2">Medication</th>
                          <th className="py-2">Dosage</th>
                          <th className="py-2">Frequency</th>
                          <th className="py-2">Duration</th>
                          <th className="py-2">Special Instructions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rx.medications.map((med) => (
                          <tr key={med.id} className="text-slate-800">
                            <td className="py-2.5 font-bold text-slate-900">{med.name}</td>
                            <td className="py-2.5 font-medium">{med.dosage}</td>
                            <td className="py-2.5 font-mono text-teal-700">{med.frequency}</td>
                            <td className="py-2.5">{med.durationDays} Days</td>
                            <td className="py-2.5 text-slate-500">{med.instructions || 'As directed'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* AI Patient Summary Card */}
                {rx.patientSummary && (
                  <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-xs space-y-1.5">
                    <span className="font-bold text-teal-800 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-teal-600" /> Plain-Language Patient Summary
                    </span>
                    <p className="text-teal-900 leading-relaxed whitespace-pre-line">{rx.patientSummary}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
