import React from 'react';
import { Activity, ShieldCheck, Cpu, Calendar, CheckCircle2 } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2.5 font-extrabold text-lg text-teal-700">
              <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white">
                <Activity className="w-4 h-4" />
              </div>
              <span>CareSync<span className="text-slate-900 font-medium">Clinic</span></span>
            </div>
            <p className="mt-3 text-sm text-slate-500 max-w-sm">
              Enterprise healthcare appointment management platform featuring concurrency-safe bookings, AI clinical intake analysis, automated medication schedules, and Google Calendar sync.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg w-fit border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>All Systems Operational & Database Synchronized</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">System Architecture</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> PostgreSQL 16 + Row Locking</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> 5-Min Pessimistic Slot Holds</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> Google Gemini 1.5 LLM Layer</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> Google Calendar OAuth 2.0</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Security & RBAC</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li>Patient Portal (Intake & Rx)</li>
              <li>Doctor Portal (Clinical Prep & Notes)</li>
              <li>Admin Portal (Leaves & Shifts)</li>
              <li>AES-256-GCM Token Encryption</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 gap-2">
          <p>© {new Date().getFullYear()} CareSync Healthcare Management. All rights reserved.</p>
          <p>Assignment Deliverable • Full-Stack Production Build</p>
        </div>
      </div>
    </footer>
  );
};
