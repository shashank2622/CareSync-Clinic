import { Request, Response, NextFunction } from 'express';
import { doctorService, DoctorService } from '../services/doctor.service.js';
import { prisma } from '../config/database.js';

export class AdminController {
  constructor(private docService: DoctorService = doctorService) {}

  createDoctor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const doctor = await this.docService.createDoctor(req.body);
      res.status(201).json({
        success: true,
        message: 'Doctor created successfully with default working hours',
        data: doctor,
      });
    } catch (error) {
      next(error);
    }
  };

  updateDoctor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const updated = await this.docService.updateDoctor(id, req.body);
      res.status(200).json({
        success: true,
        message: 'Doctor profile updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteDoctor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = await this.docService.deleteDoctor(id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { role, search, page = '1', limit = '10' } = req.query;
      const skip = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);
      const take = parseInt(limit as string, 10);

      const where: any = {};
      if (role) where.role = role;
      if (search) {
        where.OR = [
          { fullName: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const [total, users] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({
          where,
          skip,
          take,
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            phone: true,
            isActive: true,
            createdAt: true,
            patientProfile: true,
            doctorProfile: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      res.status(200).json({
        success: true,
        data: users,
        meta: {
          pagination: {
            total,
            page: parseInt(page as string, 10),
            limit: take,
            totalPages: Math.ceil(total / take),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  toggleUserStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { isActive } = req.body;

      const updated = await prisma.user.update({
        where: { id },
        data: { isActive },
        select: {
          id: true,
          email: true,
          fullName: true,
          isActive: true,
        },
      });

      res.status(200).json({
        success: true,
        message: `User account has been ${isActive ? 'activated' : 'deactivated'}`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  getDashboardStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [
        totalPatients,
        totalDoctors,
        totalAppointments,
        upcomingAppointments,
        completedAppointments,
        cancelledAppointments,
      ] = await Promise.all([
        prisma.patientProfile.count(),
        prisma.doctorProfile.count({ where: { user: { isActive: true } } }),
        prisma.appointment.count(),
        prisma.appointment.count({
          where: {
            status: 'CONFIRMED',
            slotStartTime: { gte: new Date() },
          },
        }),
        prisma.appointment.count({ where: { status: 'COMPLETED' } }),
        prisma.appointment.count({
          where: {
            status: { in: ['CANCELLED_BY_PATIENT', 'CANCELLED_BY_DOCTOR', 'CANCELLED_BY_ADMIN', 'CANCELLED_DOCTOR_LEAVE'] },
          },
        }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          totalPatients,
          totalDoctors,
          totalAppointments,
          upcomingAppointments,
          completedAppointments,
          cancelledAppointments,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const adminController = new AdminController();
