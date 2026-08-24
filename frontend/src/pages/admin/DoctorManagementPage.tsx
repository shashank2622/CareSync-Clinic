import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doctorsApi, adminApi } from '../../api/index.js';
import { Button } from '../../components/common/Button.js';
import { Badge } from '../../components/common/Badge.js';
import { Modal } from '../../components/common/Modal.js';
import {
  Stethoscope,
  Plus,
  Edit2,
  Clock,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Award,
} from 'lucide-react';
import { DoctorProfile } from '../../types/index.js';

export const DoctorManagementPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<DoctorProfile | null>(null);
  const [editingHoursDoctor, setEditingHoursDoctor] = useState<DoctorProfile | null>(null);

  // New Doctor Form State
  const [newDoctor, setNewDoctor] = useState({
    fullName: '',
    email: '',
    password: 'Doctor@123',
    phone: '',
    specialization: 'Cardiology',
    licenseNumber: `LIC-MED-${Math.floor(10000 + Math.random() * 90000)}`,
    experienceYears: 5,
    consultationFee: 120,
    slotDurationMinutes: 30,
    bio: '',
  });

  // Working Hours State
  const [workingHours, setWorkingHours] = useState([
    { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isAvailable: true, breakStartTime: '13:00', breakEndTime: '14:00' },
    { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', isAvailable: true, breakStartTime: '13:00', breakEndTime: '14:00' },
    { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', isAvailable: true, breakStartTime: '13:00', breakEndTime: '14:00' },
    { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', isAvailable: true, breakStartTime: '13:00', breakEndTime: '14:00' },
    { dayOfWeek: 5, startTime: '09:00', endTime: '17:00', isAvailable: true, breakStartTime: '13:00', breakEndTime: '14:00' },
    { dayOfWeek: 6, startTime: '09:00', endTime: '13:00', isAvailable: false, breakStartTime: null, breakEndTime: null },
    { dayOfWeek: 0, startTime: '09:00', endTime: '13:00', isAvailable: false, breakStartTime: null, breakEndTime: null },
  ]);

  // Fetch doctors
  const { data: doctorsData, isLoading } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => doctorsApi.getDoctors(),
  });

  const doctors = doctorsData?.data || [];

  // Create Doctor Mutation
  const createMutation = useMutation({
    mutationFn: adminApi.createDoctor,
    onSuccess: () => {
      setIsAddModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      alert('Doctor created successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to create doctor.');
    },
  });

  // Update Working Hours Mutation
  const hoursMutation = useMutation({
    mutationFn: (data: { doctorId: string; hours: any[] }) => doctorsApi.setWorkingHours(data.doctorId, data.hours),
    onSuccess: () => {
      setEditingHoursDoctor(null);
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      alert('Working hours and break intervals updated successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to update working hours.');
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(newDoctor);
  };

  const handleHoursSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHoursDoctor) return;
    hoursMutation.mutate({ doctorId: editingHoursDoctor.id, hours: workingHours });
  };

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Administration</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Doctor & Shift Management</h1>
          <p className="text-xs text-slate-500 mt-1">Add specialists, set consultation rates, and configure shift schedules.</p>
        </div>
        <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Add New Specialist
        </Button>
      </div>

      {/* Doctors Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                <th className="py-4 px-6">Doctor</th>
                <th className="py-4 px-6">Specialization</th>
                <th className="py-4 px-6">License #</th>
                <th className="py-4 px-6">Fee ($)</th>
                <th className="py-4 px-6">Experience</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Loading doctors...</td>
                </tr>
              ) : doctors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">No doctors registered yet.</td>
                </tr>
              ) : (
                doctors.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 font-bold flex items-center justify-center border border-teal-100">
                          {doc.user?.fullName.charAt(3) || 'D'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{doc.user?.fullName}</p>
                          <p className="text-[11px] text-slate-400">{doc.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant="info">{doc.specialization}</Badge>
                    </td>
                    <td className="py-4 px-6 font-mono text-slate-600">{doc.licenseNumber}</td>
                    <td className="py-4 px-6 font-mono font-bold text-slate-900">
                      ${Number(doc.consultationFee).toFixed(2)}
                    </td>
                    <td className="py-4 px-6">{doc.experienceYears} Years</td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingHoursDoctor(doc);
                        }}
                      >
                        <Clock className="w-3.5 h-3.5 mr-1" /> Shifts & Breaks
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Doctor Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Clinical Specialist"
        subtitle="Create user credentials and physician profile with default shifts"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name (with Dr. prefix) *</label>
              <input
                type="text"
                required
                placeholder="Dr. Emily Watson"
                value={newDoctor.fullName}
                onChange={(e) => setNewDoctor({ ...newDoctor, fullName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                placeholder="emily@clinic.com"
                value={newDoctor.email}
                onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Specialization *</label>
              <input
                type="text"
                required
                placeholder="e.g. Neurology, Cardiology, Orthopedics"
                value={newDoctor.specialization}
                onChange={(e) => setNewDoctor({ ...newDoctor, specialization: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">License Number *</label>
              <input
                type="text"
                required
                value={newDoctor.licenseNumber}
                onChange={(e) => setNewDoctor({ ...newDoctor, licenseNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Experience (Years)</label>
              <input
                type="number"
                min="0"
                value={newDoctor.experienceYears}
                onChange={(e) => setNewDoctor({ ...newDoctor, experienceYears: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Fee ($ USD)</label>
              <input
                type="number"
                min="0"
                value={newDoctor.consultationFee}
                onChange={(e) => setNewDoctor({ ...newDoctor, consultationFee: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Slot Duration (Min)</label>
              <input
                type="number"
                value={newDoctor.slotDurationMinutes}
                onChange={(e) => setNewDoctor({ ...newDoctor, slotDurationMinutes: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Physician Bio & Background</label>
            <textarea
              rows={2}
              placeholder="Clinical interests, fellowships, certifications..."
              value={newDoctor.bio}
              onChange={(e) => setNewDoctor({ ...newDoctor, bio: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-teal-500"
            ></textarea>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={createMutation.isPending}>
              Create Doctor Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Shifts & Breaks Config Modal */}
      <Modal
        isOpen={!!editingHoursDoctor}
        onClose={() => setEditingHoursDoctor(null)}
        title="Configure Shifts & Breaks"
        subtitle={`Physician: ${editingHoursDoctor?.user?.fullName}`}
        maxWidth="xl"
      >
        <form onSubmit={handleHoursSubmit} className="space-y-4">
          <div className="space-y-2">
            {workingHours.map((wh, idx) => (
              <div key={wh.dayOfWeek} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 w-28">
                  <input
                    type="checkbox"
                    checked={wh.isAvailable}
                    onChange={(e) => {
                      const updated = [...workingHours];
                      updated[idx].isAvailable = e.target.checked;
                      setWorkingHours(updated);
                    }}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span className="font-bold text-slate-800">{days[wh.dayOfWeek]}</span>
                </div>

                {wh.isAvailable ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-slate-500">Shift:</span>
                    <input
                      type="text"
                      value={wh.startTime}
                      onChange={(e) => {
                        const updated = [...workingHours];
                        updated[idx].startTime = e.target.value;
                        setWorkingHours(updated);
                      }}
                      className="w-16 px-2 py-1 bg-white border border-slate-200 rounded font-mono text-center"
                    />
                    <span>to</span>
                    <input
                      type="text"
                      value={wh.endTime}
                      onChange={(e) => {
                        const updated = [...workingHours];
                        updated[idx].endTime = e.target.value;
                        setWorkingHours(updated);
                      }}
                      className="w-16 px-2 py-1 bg-white border border-slate-200 rounded font-mono text-center"
                    />

                    <span className="text-slate-500 ml-2">Break:</span>
                    <input
                      type="text"
                      value={wh.breakStartTime || ''}
                      placeholder="13:00"
                      onChange={(e) => {
                        const updated = [...workingHours];
                        updated[idx].breakStartTime = e.target.value;
                        setWorkingHours(updated);
                      }}
                      className="w-16 px-2 py-1 bg-white border border-slate-200 rounded font-mono text-center"
                    />
                    <span>to</span>
                    <input
                      type="text"
                      value={wh.breakEndTime || ''}
                      placeholder="14:00"
                      onChange={(e) => {
                        const updated = [...workingHours];
                        updated[idx].breakEndTime = e.target.value;
                        setWorkingHours(updated);
                      }}
                      className="w-16 px-2 py-1 bg-white border border-slate-200 rounded font-mono text-center"
                    />
                  </div>
                ) : (
                  <span className="text-slate-400 italic">Day Off (No slots generated)</span>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditingHoursDoctor(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={hoursMutation.isPending}>
              Save Shift Schedule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
