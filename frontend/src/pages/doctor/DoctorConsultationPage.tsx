import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi } from '../../api/index.js';
import { Button } from '../../components/common/Button.js';
import { Badge, UrgencyBadge, AppointmentStatusBadge } from '../../components/common/Badge.js';
import {
  Stethoscope,
  Brain,
  Sparkles,
  User,
  Activity,
  Heart,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCw,
  FileText,
  Pill,
} from 'lucide-react';
import { ReminderFrequency } from '../../types/index.js';

export const DoctorConsultationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch appointment & AI pre-visit summary
  const { data: appointmentData, isLoading, refetch } = useQuery({
    queryKey: ['consultationAppointment', id],
    queryFn: () => appointmentsApi.getAppointmentById(id!),
    enabled: !!id,
  });

  const appointment = appointmentData?.data;

  // Clinical form state
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [bp, setBp] = useState('120/80');
  const [hr, setHr] = useState('72');
  const [temp, setTemp] = useState('98.6');
  const [spo2, setSpo2] = useState('99');
  const [followUpInstructions, setFollowUpInstructions] = useState('');

  // Prescription items state
  const [medications, setMedications] = useState<Array<{
    name: string;
    dosage: string;
    frequency: ReminderFrequency;
    durationDays: number;
    instructions: string;
  }>>([
    { name: '', dosage: '500mg', frequency: 'TWICE_DAILY', durationDays: 5, instructions: 'Take after food' },
  ]);

  // AI Retry Mutation
  const retryAIMutation = useMutation({
    mutationFn: () => appointmentsApi.retryPreVisitSummary(id!),
    onSuccess: () => {
      refetch();
    },
  });

  // Submit Visit Notes & Prescriptions Mutation
  const submitNotesMutation = useMutation({
    mutationFn: (data: any) => appointmentsApi.submitVisitNotes(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctorAppointments'] });
      alert('Consultation completed successfully! Clinical records saved and patient AI summary generated.');
      navigate('/doctor/dashboard');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to complete consultation.');
    },
  });

  const handleAddMedication = () => {
    setMedications([
      ...medications,
      { name: '', dosage: '10mg', frequency: 'ONCE_DAILY', durationDays: 7, instructions: 'With water' },
    ]);
  };

  const handleRemoveMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleMedChange = (index: number, field: string, value: any) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    setMedications(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicalNotes.trim()) {
      alert('Please enter clinical notes and assessment findings.');
      return;
    }

    const payload = {
      clinicalNotes,
      diagnosis,
      vitalSigns: {
        bp,
        hr: Number(hr) || undefined,
        temp,
        spo2,
      },
      followUpInstructions,
      prescriptions: medications.filter((m) => m.name.trim().length > 0),
    };

    submitNotesMutation.mutate(payload);
  };

  if (isLoading || !appointment) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-medium text-slate-500">Loading consultation room...</p>
      </div>
    );
  }

  const symptoms = appointment.symptomSubmission;
  const aiSummary = appointment.preVisitSummary;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Consultation Room Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-slate-400">#{appointment.appointmentNumber}</span>
            <AppointmentStatusBadge status={appointment.status} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
            Consultation with {appointment.patient.user.fullName}
          </h1>
          <p className="text-xs text-slate-500">
            Scheduled Slot: {new Date(appointment.slotStartTime).toUTCString()}
          </p>
        </div>

        <Button variant="ghost" size="sm" onClick={() => navigate('/doctor/dashboard')}>
          Back to Queue
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Patient Intake & AI Pre-Visit Prep (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Patient Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Patient Demographics</h2>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 font-bold flex items-center justify-center text-base border border-teal-100">
                {appointment.patient.user.fullName.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">{appointment.patient.user.fullName}</h3>
                <p className="text-xs text-slate-500">{appointment.patient.user.email}</p>
                {appointment.patient.user.phone && (
                  <p className="text-xs text-slate-400">{appointment.patient.user.phone}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
              <div>
                <span className="text-slate-400">Blood Group:</span>
                <p className="font-bold text-slate-800">{appointment.patient.bloodGroup || 'Not specified'}</p>
              </div>
              <div>
                <span className="text-slate-400">Medical History:</span>
                <p className="font-medium text-slate-800 line-clamp-2">
                  {appointment.patient.medicalHistorySummary || 'None on record'}
                </p>
              </div>
            </div>
          </div>

          {/* AI Pre-Visit Prep Card */}
          <div className="bg-gradient-to-br from-teal-900 to-slate-900 text-white rounded-3xl p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-teal-400" />
                <h3 className="text-sm font-bold tracking-tight">AI Pre-Visit Clinical Analysis</h3>
              </div>
              <button
                type="button"
                onClick={() => retryAIMutation.mutate()}
                disabled={retryAIMutation.isPending}
                className="text-xs text-teal-300 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <RotateCw className={`w-3 h-3 ${retryAIMutation.isPending ? 'animate-spin' : ''}`} />
                <span>Regenerate</span>
              </button>
            </div>

            {aiSummary ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
                  <span className="text-xs text-slate-300">Urgency Assessment:</span>
                  <UrgencyBadge level={aiSummary.urgencyLevel} />
                </div>

                <div className="space-y-1.5 text-xs">
                  <span className="text-teal-300 font-bold uppercase tracking-wider text-[10px]">
                    Chief Complaint Summary
                  </span>
                  <p className="text-slate-200 leading-relaxed bg-slate-800/40 p-3 rounded-xl border border-slate-700/40">
                    {aiSummary.chiefComplaintSummary}
                  </p>
                </div>

                {aiSummary.suggestedQuestions && aiSummary.suggestedQuestions.length > 0 && (
                  <div className="space-y-2 text-xs">
                    <span className="text-teal-300 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-teal-400" /> Suggested Diagnostic Inquiries
                    </span>
                    <ul className="space-y-1.5">
                      {aiSummary.suggestedQuestions.map((q, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-slate-300 bg-slate-800/30 p-2 rounded-lg">
                          <span className="text-teal-400 font-bold font-mono">{idx + 1}.</span>
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">
                AI analysis pending symptom submission.
              </div>
            )}
          </div>

          {/* Raw Symptom Submission */}
          {symptoms && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Patient-Reported Symptoms</h3>
              <div className="space-y-2 text-xs text-slate-700">
                <p><strong className="text-slate-900">Chief Complaint:</strong> {symptoms.chiefComplaint}</p>
                <p><strong className="text-slate-900">Description:</strong> {symptoms.symptomsText}</p>
                <div className="flex gap-4 pt-1">
                  <span><strong>Duration:</strong> {symptoms.duration}</span>
                  <span><strong>Severity:</strong> {symptoms.severity}/10</span>
                </div>
                {symptoms.additionalNotes && (
                  <p className="text-slate-500"><strong>Notes:</strong> {symptoms.additionalNotes}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Clinical Note Editor & Prescription Builder (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Documentation</span>
              <h2 className="text-xl font-bold text-slate-900 mt-0.5">Clinical Examination & Prescription</h2>
            </div>

            {/* Vitals */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Patient Vital Signs</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-600 mb-0.5">Blood Pressure</label>
                  <input
                    type="text"
                    value={bp}
                    onChange={(e) => setBp(e.target.value)}
                    placeholder="120/80"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-0.5">Heart Rate (bpm)</label>
                  <input
                    type="text"
                    value={hr}
                    onChange={(e) => setHr(e.target.value)}
                    placeholder="72"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-0.5">Temp (°F)</label>
                  <input
                    type="text"
                    value={temp}
                    onChange={(e) => setTemp(e.target.value)}
                    placeholder="98.6"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-0.5">SpO2 (%)</label>
                  <input
                    type="text"
                    value={spo2}
                    onChange={(e) => setSpo2(e.target.value)}
                    placeholder="99"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono outline-none focus:border-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Diagnosis */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Diagnosis *</label>
              <input
                type="text"
                required
                placeholder="e.g. Acute Viral Bronchitis, Tension Headache, Contact Dermatitis"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            {/* Clinical Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Notes & Assessment Findings *</label>
              <textarea
                required
                rows={4}
                placeholder="Document physical exam, chest sounds, abdominal palpation, differential diagnosis..."
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              ></textarea>
            </div>

            {/* Follow Up */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Follow-up Instructions & Lifestyle Advice</label>
              <input
                type="text"
                placeholder="e.g. Hydrate well, rest for 48 hours, follow up if fever persists beyond 3 days"
                value={followUpInstructions}
                onChange={(e) => setFollowUpInstructions(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-teal-500"
              />
            </div>

            {/* Prescription Items Builder */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-teal-600" />
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Prescription Medications</label>
                </div>
                <button
                  type="button"
                  onClick={handleAddMedication}
                  className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Medication
                </button>
              </div>

              <div className="space-y-3">
                {medications.map((med, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        placeholder="Medication Name (e.g. Amoxicillin)"
                        value={med.name}
                        onChange={(e) => handleMedChange(idx, 'name', e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-teal-500 bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Dosage (500mg)"
                        value={med.dosage}
                        onChange={(e) => handleMedChange(idx, 'dosage', e.target.value)}
                        className="w-28 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium outline-none focus:border-teal-500 bg-white"
                      />
                      {medications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMedication(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <select
                        value={med.frequency}
                        onChange={(e) => handleMedChange(idx, 'frequency', e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs outline-none bg-white focus:border-teal-500"
                      >
                        <option value="ONCE_DAILY">Once Daily (08:00)</option>
                        <option value="TWICE_DAILY">Twice Daily (08:00, 20:00)</option>
                        <option value="THREE_TIMES_DAILY">3x Daily (08:00, 14:00, 20:00)</option>
                        <option value="EVERY_8_HOURS">Every 8 Hours</option>
                        <option value="EVERY_12_HOURS">Every 12 Hours</option>
                        <option value="CUSTOM">Custom Time</option>
                      </select>

                      <input
                        type="number"
                        min="1"
                        placeholder="Days (e.g. 7)"
                        value={med.durationDays}
                        onChange={(e) => handleMedChange(idx, 'durationDays', parseInt(e.target.value, 10))}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs outline-none bg-white focus:border-teal-500"
                      />

                      <input
                        type="text"
                        placeholder="Instructions (e.g. After food)"
                        value={med.instructions}
                        onChange={(e) => handleMedChange(idx, 'instructions', e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs outline-none bg-white focus:border-teal-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-bold shadow-lg shadow-teal-600/20"
              isLoading={submitNotesMutation.isPending}
            >
              <CheckCircle2 className="w-5 h-5 mr-2" /> Complete Consultation & Save Records
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
