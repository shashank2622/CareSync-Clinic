import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/index.js';
import { Button } from '../../components/common/Button.js';
import {
  Users,
  Stethoscope,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Shield,
  Activity,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => adminApi.getDashboardStats(),
  });

  const stats = statsData?.data;

  const statCards = [
    { label: 'Total Registered Patients', value: stats?.totalPatients || 0, icon: Users, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Active Specialists', value: stats?.totalDoctors || 0, icon: Stethoscope, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Appointments', value: stats?.totalAppointments || 0, icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Upcoming Consultations', value: stats?.upcomingAppointments || 0, icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Completed Visits', value: stats?.completedAppointments || 0, icon: CheckCircle2, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { label: 'Cancelled Visits', value: stats?.cancelledAppointments || 0, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Administration Console</span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Clinic Analytics & Overview</h1>
        <p className="text-xs text-slate-500 mt-1">Monitor operational load, physician capacity, and appointment velocity.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">{stat.label}</p>
                <h3 className="text-3xl font-extrabold text-slate-900 font-mono mt-1">
                  {isLoading ? '...' : stat.value}
                </h3>
              </div>
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Action Navigation Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
          <Stethoscope className="w-8 h-8 text-teal-600" />
          <h3 className="font-bold text-slate-900 text-base">Doctor & Shift Management</h3>
          <p className="text-xs text-slate-500">Add physicians, configure consultation fees, and customize weekly shift hours and breaks.</p>
          <Link to="/admin/doctors" className="block pt-2">
            <Button variant="outline" size="sm" className="w-full justify-between">
              <span>Manage Doctors</span> <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
          <Calendar className="w-8 h-8 text-amber-600" />
          <h3 className="font-bold text-slate-900 text-base">Leave & Conflict Manager</h3>
          <p className="text-xs text-slate-500">Schedule doctor leaves with automatic conflicting appointment detection and patient alerts.</p>
          <Link to="/admin/leaves" className="block pt-2">
            <Button variant="outline" size="sm" className="w-full justify-between">
              <span>Schedule Leaves</span> <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
          <Users className="w-8 h-8 text-blue-600" />
          <h3 className="font-bold text-slate-900 text-base">User Directory & RBAC</h3>
          <p className="text-xs text-slate-500">Review patient and physician accounts, toggle active status, and maintain security audit compliance.</p>
          <Link to="/admin/users" className="block pt-2">
            <Button variant="outline" size="sm" className="w-full justify-between">
              <span>View Users</span> <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
