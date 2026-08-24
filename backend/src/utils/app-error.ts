export type ErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'SLOT_ALREADY_BOOKED'
  | 'SLOT_HOLD_EXPIRED'
  | 'INVALID_SLOT_HOLD'
  | 'DOCTOR_ON_LEAVE'
  | 'OUTSIDE_WORKING_HOURS'
  | 'APPOINTMENT_ALREADY_CANCELLED'
  | 'APPOINTMENT_NOT_RESCHEDULABLE'
  | 'LLM_SERVICE_ERROR'
  | 'CALENDAR_SYNC_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_SERVER_ERROR';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: ErrorCode = 'INTERNAL_SERVER_ERROR',
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  // Factory methods for standardized errors
  static badRequest(message: string, details?: any) {
    return new AppError(message, 400, 'BAD_REQUEST', details);
  }

  static unauthorized(message: string = 'Authentication required') {
    return new AppError(message, 401, 'UNAUTHORIZED');
  }

  static forbidden(message: string = 'You do not have permission to perform this action') {
    return new AppError(message, 403, 'FORBIDDEN');
  }

  static notFound(message: string = 'Resource not found') {
    return new AppError(message, 404, 'NOT_FOUND');
  }

  static conflict(message: string, code: ErrorCode = 'CONFLICT') {
    return new AppError(message, 409, code);
  }

  static slotAlreadyBooked(message: string = 'Sorry, this slot has just been booked by another patient.') {
    return new AppError(message, 409, 'SLOT_ALREADY_BOOKED');
  }

  static slotHoldExpired(message: string = 'Your reservation on this slot has expired. Please select a slot again.') {
    return new AppError(message, 410, 'SLOT_HOLD_EXPIRED');
  }

  static validationError(message: string, details?: any) {
    return new AppError(message, 422, 'VALIDATION_ERROR', details);
  }

  static internal(message: string = 'An unexpected internal error occurred') {
    return new AppError(message, 500, 'INTERNAL_SERVER_ERROR');
  }
}
