import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { UrgencyLevel, AppointmentStatus } from '../../types/index.js';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className,
}) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-teal-50 text-teal-700 border-teal-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center font-medium rounded-full border',
          variants[variant],
          sizes[size],
          className
        )
      )}
    >
      {children}
    </span>
  );
};

export const UrgencyBadge: React.FC<{ level: UrgencyLevel; className?: string }> = ({
  level,
  className,
}) => {
  const configs: Record<UrgencyLevel, { variant: 'default' | 'success' | 'warning' | 'danger'; label: string; icon: string }> = {
    LOW: { variant: 'success', label: 'Low Urgency', icon: '🟢' },
    MEDIUM: { variant: 'warning', label: 'Medium Urgency', icon: '🟡' },
    HIGH: { variant: 'danger', label: 'High Urgency', icon: '🔴' },
    EMERGENCY: { variant: 'danger', label: 'Emergency Urgency', icon: '🚨' },
  };

  const config = configs[level] || configs.LOW;

  return (
    <Badge variant={config.variant} size="md" className={twMerge('gap-1 font-semibold', className)}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </Badge>
  );
};

export const AppointmentStatusBadge: React.FC<{ status: AppointmentStatus; className?: string }> = ({
  status,
  className,
}) => {
  const configs: Record<AppointmentStatus, { variant: 'default' | 'success' | 'warning' | 'danger' | 'info'; label: string }> = {
    HOLD_ACTIVE: { variant: 'warning', label: 'Slot Held' },
    CONFIRMED: { variant: 'success', label: 'Confirmed' },
    COMPLETED: { variant: 'info', label: 'Completed' },
    CANCELLED_BY_PATIENT: { variant: 'danger', label: 'Cancelled by Patient' },
    CANCELLED_BY_DOCTOR: { variant: 'danger', label: 'Cancelled by Doctor' },
    CANCELLED_BY_ADMIN: { variant: 'danger', label: 'Cancelled by Admin' },
    CANCELLED_DOCTOR_LEAVE: { variant: 'warning', label: 'Doctor on Leave' },
    RESCHEDULED: { variant: 'default', label: 'Rescheduled' },
    NO_SHOW: { variant: 'default', label: 'No Show' },
  };

  const config = configs[status] || { variant: 'default', label: status };

  return <Badge variant={config.variant} className={className}>{config.label}</Badge>;
};
