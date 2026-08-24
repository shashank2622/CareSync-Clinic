import request from 'supertest';
import app from '../app.js';
import { prisma } from '../config/database.js';

describe('Auth & RBAC Integration Tests', () => {
  const testPatientEmail = `test.patient.${Date.now()}@example.com`;
  let patientAccessToken: string;

  afterAll(async () => {
    try {
      await prisma.user.deleteMany({
        where: { email: { contains: 'test.patient.' } },
      });
    } catch (e) {
      // ignore
    }
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('should reject registration with a weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Test Patient',
          email: testPatientEmail,
          password: 'weak', // Missing uppercase and number
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should successfully register a new patient account', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Test Patient',
          email: testPatientEmail,
          password: 'Password@123',
          phone: '+1-555-0100',
          bloodGroup: 'O+',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testPatientEmail);
      expect(res.body.data.user.role).toBe('PATIENT');
      expect(res.body.data.accessToken).toBeDefined();

      patientAccessToken = res.body.data.accessToken;
    });

    it('should reject duplicate registration with the same email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Duplicate Patient',
          email: testPatientEmail,
          password: 'Password@123',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('EMAIL_ALREADY_EXISTS');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should reject login with an incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testPatientEmail,
          password: 'WrongPassword@999',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('INVALID_CREDENTIALS');
    });

    it('should successfully login and return access & refresh tokens', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testPatientEmail,
          password: 'Password@123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });
  });

  describe('RBAC Route Protection', () => {
    it('should return 401 UNAUTHORIZED when no token is provided', async () => {
      const res = await request(app).get('/api/users/me');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('should return 403 FORBIDDEN when a patient attempts to access admin routes', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${patientAccessToken}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });
  });
});
