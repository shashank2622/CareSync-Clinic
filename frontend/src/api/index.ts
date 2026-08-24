import { apiClient } from './client.js';
import {
  ApiResponse,
  User,
  DoctorProfile,
  DoctorAvailability,
  Appointment,
  PreVisitSummary,
  VisitNote,
  Prescription,
  MedicationReminder,
} from '../types/index.js';

export const authApi = {
  login: async (data: { email: string; password: string }) => {
    const res = await apiClient.post<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>('/auth/login', data);
    return res.data;
  },
  register: async (data: any) => {
    const res = await apiClient.post<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>('/auth/register', data);
    return res.data;
  },
  logout: async (refreshToken?: string) => {
    const res = await apiClient.post<ApiResponse>('/auth/logout', { refreshToken });
    return res.data;
  },
  getMe: async () => {
    const res = await apiClient.get<ApiResponse<User>>('/users/me');
    return res.data;
  },
  updateProfile: async (data: any) => {
    const res = await apiClient.patch<ApiResponse<User>>('/users/me', data);
    return res.data;
  },
};

export const doctorsApi = {
  getDoctors: async (params?: { specialization?: string; search?: string; minExperience?: number; page?: number; limit?: number }) => {
    const res = await apiClient.get<ApiResponse<DoctorProfile[]>>('/doctors', { params });
    return res.data;
  },
  getSpecializations: async () => {
    const res = await apiClient.get<ApiResponse<string[]>>('/doctors/specializations');
    return res.data;
  },
  getDoctorById: async (id: string) => {
    const res = await apiClient.get<ApiResponse<DoctorProfile>>(`/doctors/${id}`);
    return res.data;
  },
  getAvailability: async (doctorId: string, date: string) => {
    const res = await apiClient.get<ApiResponse<DoctorAvailability>>(`/doctors/${doctorId}/availability`, {
      params: { date },
    });
    return res.data;
  },
  getAvailableDates: async (doctorId: string, month: string) => {
    const res = await apiClient.get<ApiResponse<{ doctorId: string; month: string; dates: Array<{ date: string; hasSlots: boolean; dayOfWeek: number }> }>>(
      `/doctors/${doctorId}/available-dates`,
      { params: { month } }
    );
    return res.data;
  },
  setWorkingHours: async (doctorId: string, workingHours: any[]) => {
    const res = await apiClient.post<ApiResponse>(`/doctors/${doctorId}/working-hours`, { workingHours });
    return res.data;
  },
};

export const appointmentsApi = {
  createHold: async (data: { doctorId: string; slotStartTime: string; slotEndTime: string }) => {
    const res = await apiClient.post<ApiResponse<{
      holdToken: string;
      expiresAt: string;
      remainingSeconds: number;
      doctorId: string;
      slotStartTime: string;
      slotEndTime: string;
    }>>('/appointments/hold', data);
    return res.data;
  },
  releaseHold: async (holdToken: string) => {
    const res = await apiClient.delete<ApiResponse>(`/appointments/hold/${holdToken}`);
    return res.data;
  },
  confirmAppointment: async (data: {
    holdToken: string;
    chiefComplaint?: string;
    symptomsText?: string;
    duration?: string;
    severity?: number;
    additionalNotes?: string;
  }) => {
    const res = await apiClient.post<ApiResponse<Appointment>>('/appointments', data);
    return res.data;
  },
  getAppointments: async (params?: { status?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) => {
    const res = await apiClient.get<ApiResponse<Appointment[]>>('/appointments', { params });
    return res.data;
  },
  getAppointmentById: async (id: string) => {
    const res = await apiClient.get<ApiResponse<Appointment>>(`/appointments/${id}`);
    return res.data;
  },
  cancelAppointment: async (id: string, reason: string) => {
    const res = await apiClient.patch<ApiResponse<Appointment>>(`/appointments/${id}/cancel`, { reason });
    return res.data;
  },
  rescheduleAppointment: async (id: string, newHoldToken: string, reason?: string) => {
    const res = await apiClient.patch<ApiResponse<Appointment>>(`/appointments/${id}/reschedule`, { newHoldToken, reason });
    return res.data;
  },
  submitSymptoms: async (appointmentId: string, data: {
    chiefComplaint: string;
    symptomsText: string;
    duration: string;
    severity: number;
    additionalNotes?: string;
  }) => {
    const res = await apiClient.post<ApiResponse>(`/appointments/${appointmentId}/symptoms`, data);
    return res.data;
  },
  getPreVisitSummary: async (appointmentId: string) => {
    const res = await apiClient.get<ApiResponse<PreVisitSummary>>(`/appointments/${appointmentId}/previsit-summary`);
    return res.data;
  },
  retryPreVisitSummary: async (appointmentId: string) => {
    const res = await apiClient.post<ApiResponse<PreVisitSummary>>(`/appointments/${appointmentId}/previsit-summary/retry`);
    return res.data;
  },
  submitVisitNotes: async (appointmentId: string, data: any) => {
    const res = await apiClient.post<ApiResponse<Appointment>>(`/appointments/${appointmentId}/visit-notes`, data);
    return res.data;
  },
  getVisitNotes: async (appointmentId: string) => {
    const res = await apiClient.get<ApiResponse<VisitNote>>(`/appointments/${appointmentId}/visit-notes`);
    return res.data;
  },
  getPostVisitSummary: async (appointmentId: string) => {
    const res = await apiClient.get<ApiResponse<any>>(`/appointments/${appointmentId}/postvisit-summary`);
    return res.data;
  },
  retryPostVisitSummary: async (appointmentId: string) => {
    const res = await apiClient.post<ApiResponse<any>>(`/appointments/${appointmentId}/postvisit-summary/retry`);
    return res.data;
  },
};

export const prescriptionsApi = {
  getMyPrescriptions: async () => {
    const res = await apiClient.get<ApiResponse<Prescription[]>>('/prescriptions/my-prescriptions');
    return res.data;
  },
};

export const remindersApi = {
  getActiveReminders: async () => {
    const res = await apiClient.get<ApiResponse<MedicationReminder[]>>('/reminders/active');
    return res.data;
  },
  toggleReminder: async (id: string, isActive: boolean) => {
    const res = await apiClient.patch<ApiResponse<MedicationReminder>>(`/reminders/${id}/toggle`, { isActive });
    return res.data;
  },
  generateForPrescription: async (prescriptionId: string) => {
    const res = await apiClient.post<ApiResponse>(`/reminders/generate/${prescriptionId}`);
    return res.data;
  },
};

export const calendarApi = {
  getConnectUrl: async () => {
    const res = await apiClient.get<ApiResponse<{ url: string }>>('/calendar/connect');
    return res.data;
  },
  getStatus: async () => {
    const res = await apiClient.get<ApiResponse<{ isConnected: boolean; connectedAt?: string | null }>>('/calendar/status');
    return res.data;
  },
  disconnect: async () => {
    const res = await apiClient.delete<ApiResponse>('/calendar/disconnect');
    return res.data;
  },
  syncAppointment: async (appointmentId: string) => {
    const res = await apiClient.post<ApiResponse>(`/calendar/sync/${appointmentId}`);
    return res.data;
  },
};

export const adminApi = {
  getDashboardStats: async () => {
    const res = await apiClient.get<ApiResponse<{
      totalPatients: number;
      totalDoctors: number;
      totalAppointments: number;
      upcomingAppointments: number;
      completedAppointments: number;
      cancelledAppointments: number;
    }>>('/admin/dashboard');
    return res.data;
  },
  createDoctor: async (data: any) => {
    const res = await apiClient.post<ApiResponse<DoctorProfile>>('/admin/doctors', data);
    return res.data;
  },
  updateDoctor: async (id: string, data: any) => {
    const res = await apiClient.patch<ApiResponse<DoctorProfile>>(`/admin/doctors/${id}`, data);
    return res.data;
  },
  deleteDoctor: async (id: string) => {
    const res = await apiClient.delete<ApiResponse>(`/admin/doctors/${id}`);
    return res.data;
  },
  createDoctorLeave: async (doctorId: string, data: { startDate: string; endDate: string; reason: string }) => {
    const res = await apiClient.post<ApiResponse<{
      leave: any;
      affectedCount: number;
      affectedAppointments: Array<{ id: string; appointmentNumber: string; patientName: string; slotStartTime: string }>;
    }>>(`/admin/doctors/${doctorId}/leave`, data);
    return res.data;
  },
  getDoctorLeaves: async (doctorId: string) => {
    const res = await apiClient.get<ApiResponse<any[]>>(`/admin/doctors/${doctorId}/leave`);
    return res.data;
  },
  deleteDoctorLeave: async (doctorId: string, leaveId: string) => {
    const res = await apiClient.delete<ApiResponse>(`/admin/doctors/${doctorId}/leave/${leaveId}`);
    return res.data;
  },
  getUsers: async (params?: { role?: string; search?: string; page?: number; limit?: number }) => {
    const res = await apiClient.get<ApiResponse<User[]>>('/admin/users', { params });
    return res.data;
  },
  toggleUserStatus: async (userId: string, isActive: boolean) => {
    const res = await apiClient.patch<ApiResponse>(`/admin/users/${userId}/status`, { isActive });
    return res.data;
  },
};
