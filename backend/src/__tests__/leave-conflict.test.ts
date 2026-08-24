import request from 'supertest';
import app from '../app.js';
import { prisma } from '../config/database.js';
import { AppointmentStatus, Role } from '@prisma/client';

describe('Doctor Leave Conflict Strategy Tests', () => {
  let adminToken: string;
  let patientToken: string;
  let doctorId: string;
  let appointmentId: string;

  const leaveDate = '2026-12-20';
  const slotStartTime = new Date(`${leaveDate}T11:00:00.000Z`).toISOString();
  const slotEndTime = new Date(`${leaveDate}T11:30:00.000Z`).toISOString();

  beforeAll(async () => {
    // 1. Login as Admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@clinic.com', password: 'Admin@123' });
    adminToken = adminLogin.body.data.accessToken;

    // 2. Register Patient & Book on leaveDate
    const patRes = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Leave Impact Patient',
        email: `leave.patient.${Date.now()}@example.com`,
        password: 'Password@123',
      });
    patientToken = patRes.body.data.accessToken;

    const doctor = await prisma.doctorProfile.findFirst({
      where: { user: { isActive: true } },
    });
    doctorId = doctor!.id;

    // Create Slot Hold & Confirm Appointment
    const holdRes = await request(app)
      .post('/api/appointments/hold')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ doctorId, slotStartTime, slotEndTime });

    const confirmRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        holdToken: holdRes.body.data.holdToken,
        chiefComplaint: 'Pre-existing appointment before leave',
      });

    appointmentId = confirmRes.body.data.id;
    expect(confirmRes.body.data.status).toBe(AppointmentStatus.CONFIRMED);
  });

  afterAll(async () => {
    await prisma.doctorLeave.deleteMany({
      where: { doctorId, startDate: new Date('2026-12-20T00:00:00.000Z') },
    });
    await prisma.appointment.deleteMany({
      where: { id: appointmentId },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'leave.patient.' } },
    });
    await prisma.$disconnect();
  });

  it('LEAVE CONFLICT RESOLUTION: Admin scheduling leave cascades to CANCELLED_DOCTOR_LEAVE', async () => {
    const leaveRes = await request(app)
      .post(`/api/admin/doctors/${doctorId}/leave`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        startDate: leaveDate,
        endDate: leaveDate,
        reason: 'Emergency Dental Surgery',
      });

    expect(leaveRes.status).toBe(201);
    expect(leaveRes.body.success).toBe(true);
    expect(leaveRes.body.data.affectedCount).toBeGreaterThanOrEqual(1);

    // Verify appointment status in DB transitioned to CANCELLED_DOCTOR_LEAVE
    const updatedApt = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    expect(updatedApt?.status).toBe(AppointmentStatus.CANCELLED_DOCTOR_LEAVE);
    expect(updatedApt?.cancellationReason).toContain('Doctor marked on leave: Emergency Dental Surgery');
  });

  it('AVAILABILITY SHIELD: Doctor availability query returns isAvailable: false for leave date', async () => {
    const availRes = await request(app)
      .get(`/api/doctors/${doctorId}/availability?date=${leaveDate}`)
      .set('Authorization', `Bearer ${patientToken}`);

    expect(availRes.status).toBe(200);
    expect(availRes.body.data.isAvailable).toBe(false);
    expect(availRes.body.data.reason).toBe('DOCTOR_ON_LEAVE');
  });
});
