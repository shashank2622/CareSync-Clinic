import React from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { Badge } from '../../components/common/Badge.js';
import { Clock, Calendar, Shield, Stethoscope } from 'lucide-react';

export const DoctorSchedulePage: React.FC = () => {
  const { user } = useAuth();
  const doctor = user?.doctorProfile;

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Clinical Shifts</span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">My Working Schedule</h1>
        <p className="text-xs text-slate-500 mt-1">Review your weekly shift hours and approved administrative leaves.</p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Weekly Shift Timings</h3>
            <p className="text-xs text-slate-500">Consultation Slot Duration: {doctor?.slotDurationMinutes || 30} minutes</p>
          </div>
          <Badge variant="info" size="sm">Active Roster</Badge>
        </div>

        <div className="divide-y divide-slate-100">
          {[1, 2, 3, 4, 5].map((dayIdx) => (
            <div key={dayIdx} className="py-3.5 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 w-28">{days[dayIdx]}</span>
              <div className="flex items-center gap-2 font-mono text-slate-700">
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                <span>09:00 - 17:00 UTC</span>
              </div>
              <div className="text-slate-500 font-mono">
                Break: 13:00 - 14:00 UTC
              </div>
              <Badge variant="success" size="sm">Working</Badge>
            </div>
          ))}
          {[0, 6].map((dayIdx) => (
            <div key={dayIdx} className="py-3.5 flex items-center justify-between text-xs opacity-50">
              <span className="font-bold text-slate-800 w-28">{days[dayIdx]}</span>
              <span className="text-slate-400 font-mono">—</span>
              <span className="text-slate-400 font-mono">—</span>
              <Badge variant="default" size="sm">Off Duty</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
