import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doctorsApi, appointmentsApi } from '../../api/index.js';
import { useAuth } from '../../context/AuthContext.js';
import { Button } from '../../components/common/Button.js';
import { Badge } from '../../components/common/Badge.js';
import { CountdownTimer } from '../../components/common/CountdownTimer.js';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Activity,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CalendarCheck,
  Stethoscope,
  Sparkles,
} from 'lucide-react';
import { DoctorProfile, GeneratedSlot } from '../../types/index.js';

export const BookAppointmentFlow: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialDoctorId = searchParams.get('doctorId') || '';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Wizard Steps: 1: Doctor, 2: Date & Slot, 3: Symptoms & Intake, 4: Review & Confirm, 5: Success
  const [step, setStep] = useState<number>(initialDoctorId ? 2 : 1);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(initialDoctorId);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [selectedSlot, setSelectedSlot] = useState<GeneratedSlot | null>(null);

  // Hold State
  const [holdToken, setHoldToken] = useState<string | null>(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null);
  const [holdError, setHoldError] = useState<string | null>(null);

  // Symptom Form State
  const [symptoms, setSymptoms] = useState({
    chiefComplaint: '',
    symptomsText: '',
    duration: '2-3 days',
    severity: 5,
    additionalNotes: '',
  });

  // Confirmed Appointment State
  const [confirmedAppointment, setConfirmedAppointment] = useState<any>(null);

  // Fetch doctors
  const { data: doctorsData } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => doctorsApi.getDoctors(),
  });
  const doctors = doctorsData?.data || [];
  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);

  // Fetch real-time availability for selected doctor and date
  const { data: availabilityData, isLoading: isLoadingSlots, refetch: refetchSlots } = useQuery({
    queryKey: ['availability', selectedDoctorId, selectedDate],
    queryFn: () => doctorsApi.getAvailability(selectedDoctorId, selectedDate),
    enabled: !!selectedDoctorId && !!selectedDate && step === 2,
  });
  const availability = availabilityData?.data;

  // Hold creation mutation
  const holdMutation = useMutation({
    mutationFn: appointmentsApi.createHold,
    onSuccess: (res) => {
      if (res.success && res.data) {
        setHoldToken(res.data.holdToken);
        setHoldExpiresAt(res.data.expiresAt);
        setHoldError(null);
        setStep(3); // Advance to Symptoms Form
      }
    },
    onError: (err: any) => {
      setHoldError(err.response?.data?.message || 'Could not hold this slot. It might have just been reserved.');
      refetchSlots();
    },
  });

  // Booking confirmation mutation
  const confirmMutation = useMutation({
    mutationFn: appointmentsApi.confirmAppointment,
    onSuccess: (res) => {
      if (res.success && res.data) {
        setConfirmedAppointment(res.data);
        setStep(5); // Success Screen
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
      }
    },
    onError: (err: any) => {
      setHoldError(err.response?.data?.message || 'Booking confirmation failed.');
    },
  });

  // Handle slot selection & initiate 5-minute pessimistic hold
  const handleSlotSelect = (slot: GeneratedSlot) => {
    if (!slot.isAvailable && !slot.isHeldByYou) return;
    setSelectedSlot(slot);
    setHoldError(null);

    // Call Hold API
    holdMutation.mutate({
      doctorId: selectedDoctorId,
      slotStartTime: slot.slotStartTime,
      slotEndTime: slot.slotEndTime,
    });
  };

  const handleHoldExpired = () => {
    setHoldToken(null);
    setHoldExpiresAt(null);
    setHoldError('Your 5-minute slot reservation has expired. Please select a slot again.');
    setStep(2);
    refetchSlots();
  };

  const handleConfirmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!holdToken) return;

    confirmMutation.mutate({
      holdToken,
      chiefComplaint: symptoms.chiefComplaint,
      symptomsText: symptoms.symptomsText || symptoms.chiefComplaint,
      duration: symptoms.duration,
      severity: symptoms.severity,
      additionalNotes: symptoms.additionalNotes,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Wizard Progress Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between">
          {[
            { num: 1, label: 'Doctor' },
            { num: 2, label: 'Date & Slot' },
            { num: 3, label: 'Symptoms' },
            { num: 4, label: 'Review' },
          ].map((s, idx) => (
            <React.Fragment key={s.num}>
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                    step === s.num
                      ? 'bg-teal-600 text-white ring-4 ring-teal-100'
                      : step > s.num
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                </div>
                <span
                  className={`hidden sm:inline text-xs font-semibold ${
                    step >= s.num ? 'text-slate-900' : 'text-slate-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {idx < 3 && (
                <div
                  className={`flex-1 h-0.5 mx-2 sm:mx-4 transition-colors ${
                    step > s.num ? 'bg-emerald-400' : 'bg-slate-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* STEP 1: Select Doctor */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Step 1: Choose Your Specialist</h2>
            <p className="text-xs text-slate-500 mt-1">Select a doctor to view their schedule and consultation fees.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {doctors.map((doc) => (
              <div
                key={doc.id}
                onClick={() => {
                  setSelectedDoctorId(doc.id);
                  setStep(2);
                }}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                  selectedDoctorId === doc.id
                    ? 'border-teal-500 bg-teal-50/40 ring-2 ring-teal-500/20'
                    : 'border-slate-200 bg-white hover:border-teal-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-600 text-white font-bold flex items-center justify-center text-sm">
                      {doc.user?.fullName.charAt(3) || 'D'}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{doc.user?.fullName}</h4>
                      <p className="text-xs text-teal-700 font-semibold">{doc.specialization}</p>
                    </div>
                  </div>
                  <span className="text-sm font-extrabold text-teal-700 font-mono">
                    ${Number(doc.consultationFee).toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-3 line-clamp-2">{doc.bio}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: Select Date & Available Slot */}
      {step === 2 && selectedDoctor && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Selected Physician</span>
              <h3 className="text-lg font-bold text-slate-900">{selectedDoctor.user?.fullName}</h3>
              <p className="text-xs text-slate-500">{selectedDoctor.specialization} • ${Number(selectedDoctor.consultationFee).toFixed(2)} / consultation</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
              Change Doctor
            </Button>
          </div>

          {holdError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{holdError}</span>
            </div>
          )}

          {/* Date Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Select Consultation Date</label>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
            />
          </div>

          {/* Slot Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">Available Time Slots for {selectedDate}</label>
              {availability?.isAvailable && (
                <span className="text-xs font-bold text-emerald-600">
                  {availability.availableSlotsCount} slot(s) open
                </span>
              )}
            </div>

            {isLoadingSlots ? (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 animate-pulse">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-11 bg-slate-100 rounded-xl"></div>
                ))}
              </div>
            ) : !availability?.isAvailable ? (
              <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-2">
                <AlertCircle className="w-6 h-6 text-amber-600 mx-auto" />
                <h4 className="text-sm font-bold text-amber-900">{availability?.message || 'No slots available on this date'}</h4>
                <p className="text-xs text-amber-700">Please choose another calendar date above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {availability.slots.map((slot) => {
                  const isAvailable = slot.isAvailable || slot.isHeldByYou;
                  return (
                    <button
                      key={slot.startTime}
                      type="button"
                      disabled={!isAvailable || holdMutation.isPending}
                      onClick={() => handleSlotSelect(slot)}
                      className={`p-3 rounded-xl text-center border font-mono text-xs font-semibold transition-all cursor-pointer ${
                        slot.isHeldByYou
                          ? 'bg-teal-600 text-white border-teal-700 ring-2 ring-teal-300'
                          : isAvailable
                          ? 'bg-slate-50 hover:bg-teal-50 hover:border-teal-400 text-slate-800 border-slate-200'
                          : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <span>{slot.startTime}</span>
                      <span className="block text-[9px] uppercase font-sans tracking-tight mt-0.5">
                        {slot.status === 'BREAK' ? 'Break' : slot.status === 'BOOKED' ? 'Booked' : slot.status === 'HELD' && !slot.isHeldByYou ? 'Held' : 'Open'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: Symptoms Intake Form with Hold Countdown */}
      {step === 3 && selectedSlot && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          {/* Active Slot Hold Timer Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-teal-50/80 border border-teal-200">
            <div>
              <span className="text-xs font-bold text-teal-800">
                Holding Slot for {selectedDoctor?.user?.fullName} on {selectedDate} ({selectedSlot.startTime} - {selectedSlot.endTime} UTC)
              </span>
              <p className="text-[11px] text-teal-600">Please complete your symptoms intake to confirm your visit.</p>
            </div>
            {holdExpiresAt && (
              <CountdownTimer expiresAt={holdExpiresAt} onExpire={handleHoldExpired} />
            )}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); setStep(4); }} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Primary Reason for Visit / Chief Complaint *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Chest tightness, sudden rash on arm, throbbing headache"
                value={symptoms.chiefComplaint}
                onChange={(e) => setSymptoms({ ...symptoms, chiefComplaint: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Detailed Symptoms & Physical Sensations *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Describe when it happens, triggers, pain type (sharp, dull, throbbing)..."
                value={symptoms.symptomsText}
                onChange={(e) => setSymptoms({ ...symptoms, symptomsText: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
              ></textarea>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">How long have you had this? *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 3 days, 2 weeks, 1 month"
                  value={symptoms.duration}
                  onChange={(e) => setSymptoms({ ...symptoms, duration: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:border-teal-500 outline-none"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-700">Severity Rating (1 to 10):</label>
                  <span className="text-xs font-bold text-teal-700">{symptoms.severity}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={symptoms.severity}
                  onChange={(e) => setSymptoms({ ...symptoms, severity: parseInt(e.target.value, 10) })}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Additional Notes / Medications Tried</label>
              <input
                type="text"
                placeholder="e.g. Took ibuprofen with no relief, no known allergies"
                value={symptoms.additionalNotes}
                onChange={(e) => setSymptoms({ ...symptoms, additionalNotes: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:border-teal-500 outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Button type="button" variant="ghost" size="sm" onClick={() => setStep(2)}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Slots
              </Button>
              <Button type="submit" variant="primary" className="font-bold">
                Review & Confirm Booking <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 4: Review & Transactional Confirmation */}
      {step === 4 && selectedDoctor && selectedSlot && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Step 4</span>
              <h3 className="text-xl font-bold text-slate-900">Review & Confirm Consultation</h3>
            </div>
            {holdExpiresAt && (
              <CountdownTimer expiresAt={holdExpiresAt} onExpire={handleHoldExpired} />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Consultation Details</h4>
              <div className="space-y-1.5 text-sm">
                <p className="font-bold text-slate-900">{selectedDoctor.user?.fullName}</p>
                <p className="text-teal-700 font-semibold">{selectedDoctor.specialization}</p>
                <p className="text-slate-600">
                  📅 {selectedDate} at {selectedSlot.startTime} - {selectedSlot.endTime} UTC
                </p>
                <p className="text-slate-900 font-bold font-mono pt-2 border-t border-slate-200">
                  Total Fee: ${Number(selectedDoctor.consultationFee).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Clinical Intake Summary</h4>
              <div className="space-y-1.5 text-xs">
                <p><strong className="text-slate-700">Complaint:</strong> {symptoms.chiefComplaint}</p>
                <p><strong className="text-slate-700">Duration:</strong> {symptoms.duration}</p>
                <p><strong className="text-slate-700">Severity:</strong> {symptoms.severity}/10</p>
                {symptoms.additionalNotes && (
                  <p><strong className="text-slate-700">Notes:</strong> {symptoms.additionalNotes}</p>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-600 flex-shrink-0" />
            <span>
              Upon confirmation, our Google Gemini AI engine will automatically analyze your symptoms for the doctor, and an email receipt with calendar sync will be dispatched.
            </span>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" size="sm" onClick={() => setStep(3)}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Edit Symptoms
            </Button>
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="font-bold shadow-lg shadow-teal-600/20"
              isLoading={confirmMutation.isPending}
              onClick={handleConfirmSubmit}
            >
              Confirm & Book Appointment
            </Button>
          </div>
        </div>
      )}

      {/* STEP 5: Success Screen */}
      {step === 5 && confirmedAppointment && (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 text-center space-y-6 shadow-xl shadow-slate-900/5">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/10">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Booking Confirmed!</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Appointment #{confirmedAppointment.appointmentNumber}
            </h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Your consultation has been reserved successfully in PostgreSQL and confirmation emails have been dispatched.
            </p>
          </div>

          <div className="max-w-md mx-auto p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-slate-500">Doctor:</span>
              <span className="font-bold text-slate-900">{confirmedAppointment.doctor?.user?.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Specialization:</span>
              <span className="font-semibold text-teal-700">{confirmedAppointment.doctor?.specialization}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Scheduled Time:</span>
              <span className="font-mono font-bold text-slate-900">
                {new Date(confirmedAppointment.slotStartTime).toUTCString()}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link to="/my-appointments" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full sm:w-auto font-bold">
                View in My Appointments
              </Button>
            </Link>
            <Link to="/doctors" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Explore More Doctors
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
