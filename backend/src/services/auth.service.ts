import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { userRepository, UserRepository } from '../repositories/user.repository.js';
import { AppError } from '../utils/app-error.js';
import { RegisterInput, LoginInput, UpdateProfileInput } from '../validators/auth.validator.js';
import { JwtPayload, AuthenticatedUser } from '../types/auth.types.js';
import { Role } from '@prisma/client';

export class AuthService {
  constructor(private userRepo: UserRepository = userRepository) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private generateTokens(user: { id: string; email: string; role: Role; fullName: string }) {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };

    const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as any,
    });

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const refreshToken = jwt.sign(
      { ...payload, jti: rawRefreshToken },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN as any }
    );

    return { accessToken, refreshToken, rawRefreshToken };
  }

  private sanitizeUser(user: any): AuthenticatedUser {
    const { passwordHash, ...safeUser } = user;
    return safeUser as AuthenticatedUser;
  }

  async registerPatient(input: RegisterInput) {
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) {
      throw AppError.conflict('An account with this email address already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const dob = input.dob ? new Date(input.dob) : null;

    const user = await this.userRepo.createPatient({
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      phone: input.phone,
      dob,
      gender: input.gender,
      bloodGroup: input.bloodGroup,
      emergencyContact: input.emergencyContact,
      medicalHistorySummary: input.medicalHistorySummary,
    });

    const tokens = this.generateTokens(user);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.userRepo.saveRefreshToken(
      user.id,
      this.hashToken(tokens.refreshToken),
      expiresAt
    );

    return {
      user: this.sanitizeUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async login(input: LoginInput) {
    const user = await this.userRepo.findByEmail(input.email);
    if (!user || !user.isActive) {
      throw AppError.unauthorized('Invalid email address or password');
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw AppError.unauthorized('Invalid email address or password');
    }

    const tokens = this.generateTokens(user);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.userRepo.saveRefreshToken(
      user.id,
      this.hashToken(tokens.refreshToken),
      expiresAt
    );

    return {
      user: this.sanitizeUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async refreshTokens(refreshTokenStr: string) {
    try {
      jwt.verify(refreshTokenStr, env.JWT_REFRESH_SECRET);
    } catch (err) {
      throw AppError.unauthorized('Invalid or expired refresh token');
    }

    const tokenHash = this.hashToken(refreshTokenStr);
    const savedToken = await this.userRepo.findRefreshToken(tokenHash);

    if (!savedToken || savedToken.isRevoked || savedToken.expiresAt < new Date()) {
      throw AppError.unauthorized('Refresh token is expired, revoked, or invalid');
    }

    if (!savedToken.user.isActive) {
      throw AppError.unauthorized('User account is currently deactivated');
    }

    // Revoke old token and issue fresh pair (Refresh Token Rotation)
    await this.userRepo.revokeRefreshToken(tokenHash);

    const tokens = this.generateTokens(savedToken.user);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.userRepo.saveRefreshToken(
      savedToken.user.id,
      this.hashToken(tokens.refreshToken),
      expiresAt
    );

    return {
      user: this.sanitizeUser(savedToken.user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(refreshTokenStr?: string, userId?: string) {
    if (refreshTokenStr) {
      const tokenHash = this.hashToken(refreshTokenStr);
      await this.userRepo.revokeRefreshToken(tokenHash);
    } else if (userId) {
      await this.userRepo.revokeAllUserTokens(userId);
    }
  }

  async getProfile(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw AppError.notFound('User profile not found');
    }

    const sanitized = this.sanitizeUser(user);
    return {
      ...sanitized,
      hasGoogleCalendarConnected: !!user.googleOAuthToken,
    };
  }

  async updateProfile(userId: string, role: Role, input: UpdateProfileInput) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw AppError.notFound('User profile not found');
    }

    // Update core User details if provided
    if (input.fullName || input.phone) {
      await this.userRepo.updateUser(userId, {
        fullName: input.fullName,
        phone: input.phone,
      });
    }

    // Update role specific profiles
    if (role === Role.PATIENT) {
      const dob = input.dob ? new Date(input.dob) : undefined;
      await this.userRepo.updatePatientProfile(userId, {
        dob,
        gender: input.gender,
        bloodGroup: input.bloodGroup,
        emergencyContact: input.emergencyContact,
        medicalHistorySummary: input.medicalHistorySummary,
      });
    } else if (role === Role.DOCTOR) {
      await this.userRepo.updateDoctorProfile(userId, {
        bio: input.bio,
        consultationFee: input.consultationFee,
        slotDurationMinutes: input.slotDurationMinutes,
      });
    }

    return this.getProfile(userId);
  }
}

export const authService = new AuthService();
