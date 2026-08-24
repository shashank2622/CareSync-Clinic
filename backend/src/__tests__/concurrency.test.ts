import request from 'supertest';
import app from '../app.js';
import { prisma } from '../config/database.js';
import { Role } from '@prisma/client';

describe('Concurrency & Double-Booking Prevention Tests', () => {
  let patient1Token: string;
  let patient2Token: string;
  let patient1Id: string;
  let patient2Id: string;
  let doctorId: string;

  const testDate = '2026-11-15';
  const slotStartTime = new Date(`${testDate}T09:00:00.000Z`).toISOString();
  const slotEndTime = new Date(`${testDate}T09:30:00.000Z`).toISOString();

  beforeAll(async () => {
    // 1. Create Patient 1
    const p1Res = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Race Patient One',
        email: `race.p1.${Date.now()}@example.com`,
        password: 'Password@123',
      });
    patient1Token = p1Res.body.data.accessToken;
    patient1Id = p1Res.body.data.user.patientProfile.id;

    // 2. Create Patient 2
    const p2Res = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Race Patient Two',
        email: `race.p2.${Date.now()}@example.com`,
        password: 'Password@123',
      });
    patient2Token = p2Res.body.data.accessToken;
    patient2Id = p2Res.body.data.user.patientProfile.id;

    // 3. Find first active doctor
    const doctor = await prisma.doctorProfile.findFirst({
      where: { user: { isActive: true } },
    });
    if (doctor) {
      doctorId = doctor.id;
    }
  });

  afterAll(async () => {
    // Clean up created test data
    await prisma.appointment.deleteMany({
      where: {
        OR: [{ patientId: patient1Id }, { patientId: patient2Id }],
      },
    });
    await prisma.slotHold.deleteMany({
      where: {
        OR: [{ patientId: patient1Id }, { patientId: patient2Id }],
      },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'race.p' } },
    });
    await prisma.$disconnect();
  });

  it('SIMULTANEOUS HOLDS: Exactly ONE patient succeeds in holding the same slot', async () => {
    // Fire 2 concurrent hold requests for the exact same doctor and slot time
    const [res1, res2] = await Promise.all([
      request(app)
        .post('/api/appointments/hold')
        .set('Authorization', `Bearer ${patient1Token}`)
        .send({ doctorId, slotStartTime, slotEndTime }),
      request(app)
        .post('/api/appointments/hold')
        .set('Authorization', `Bearer ${patient2Token}`)
        .send({ doctorId, slotStartTime, slotEndTime }),
    ]);

    const statuses = [res1.status, res2.status].sort();

    // Exactly one must succeed (201 Created), the other must receive 409 Conflict
    expect(statuses).toEqual([201, 409]);

    const successfulRes = res1.status === 201 ? res1 : res2;
    const failedRes = res1.status === 409 ? res1 : res2;

    expect(successfulRes.body.success).toBe(true);
    expect(successfulRes.body.data.holdToken).toBeDefined();

    expect(failedRes.body.success).toBe(false);
    expect(failedRes.body.code).toBe('SLOT_ALREADY_BOOKED');
  });

  it('TRANSACTIONAL BOOKING: Converting hold to confirmed booking commits atomically', async () => {
    // Patient 1 holds a different slot
    const slot2Start = new Date(`${testDate}T10:00:00.000Z`).toISOString();
    const slot2End = new Date(`${testDate}T10:30:00.000Z`).toISOString();

    const holdRes = await request(app)
      .post('/api/appointments/hold')
      .set('Authorization', `Bearer ${patient1Token}`)
      .send({ doctorId, slotStartTime: slot2Start, slotEndTime: slot2End });

    expect(holdRes.status).toBe(201);
    const holdToken = holdRes.body.data.holdToken;

    // Confirm appointment
    const confirmRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patient1Token}`)
      .send({
        holdToken,
        chiefComplaint: 'Severe Migraine',
        duration: '3 days',
        severity: 8,
      });

    expect(confirmRes.status).toBe(201);
    expect(confirmRes.body.success).toBe(true);
    expect(confirmRes.body.data.appointmentNumber).toMatch(/^APT-\d{8}-\d{4}$/);

    // Verify slot is now marked as BOOKED in availability query
    const availRes = await request(app)
      .get(`/api/doctors/${doctorId}/availability?date=${testDate}`)
      .set('Authorization', `Bearer ${patient1Token}`);

    const slotInQuery = availRes.body.data.slots.find((s: any) => s.startTime === '10:00');
    expect(slotInQuery.isAvailable).toBe(false);
    expect(slotInQuery.status).toBe('BOOKED');
  });
});
