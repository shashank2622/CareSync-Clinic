import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';
import { userRepository } from '../repositories/user.repository.js';
import { JwtPayload, AuthenticatedUser } from '../types/auth.types.js';
import { Role } from '@prisma/client';

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw AppError.unauthorized('Authentication token is required');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw AppError.unauthorized('Authentication token is missing');
    }

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;

    const user = await userRepository.findById(decoded.userId);
    if (!user || !user.isActive) {
      throw AppError.unauthorized('User session is invalid or user account has been deactivated');
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      phone: user.phone,
      isActive: user.isActive,
      patientProfile: user.patientProfile,
      doctorProfile: user.doctorProfile,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        AppError.forbidden(
          `Access forbidden: required role [${allowedRoles.join(', ')}], current role [${req.user.role}]`
        )
      );
    }

    next();
  };
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
      const user = await userRepository.findById(decoded.userId);
      if (user && user.isActive) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
          phone: user.phone,
          isActive: user.isActive,
          patientProfile: user.patientProfile,
          doctorProfile: user.doctorProfile,
        };
      }
    }
  } catch {
    // Ignore error for optional authentication
  }
  next();
};
