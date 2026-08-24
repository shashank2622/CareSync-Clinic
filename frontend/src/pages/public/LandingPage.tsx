import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/common/Button.js';
import {
  Calendar,
  Sparkles,
  ShieldCheck,
  Clock,
  HeartPulse,
  Brain,
  BellRing,
  ArrowRight,
  CheckCircle2,
  Stethoscope,
  Users,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const specialties = [
    { name: 'Cardiology', icon: '❤️', desc: 'Heart care, hypertension, and cardiovascular health' },
    { name: 'Dermatology', icon: '✨', desc: 'Skin conditions, acne, eczema, and derm surgical prep' },
    { name: 'Pediatrics', icon: '🧸', desc: 'Comprehensive healthcare for infants, children & teens' },
    { name: 'General Medicine', icon: '🩺', desc: 'Primary health consultations, wellness & diagnostics' },
  ];

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white px-6 py-16 sm:px-12 sm:py-24 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(20,184,166,0.3),rgba(255,255,255,0))]"></div>
        <div className="relative max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>AI-Enriched Clinical Appointments & Follow-up</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            More than just booking.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-300">
              Complete clinical care.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Experience concurrency-safe doctor reservations, AI-generated pre-visit summaries with urgency ratings, automated medication reminders, and two-way Google Calendar synchronization.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/book" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold shadow-lg shadow-teal-500/25">
                Book Consultation Now
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Link to="/doctors" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-white border-slate-700 bg-slate-800/60 hover:bg-slate-800">
                Explore Specialists
              </Button>
            </Link>
          </div>

          {/* Trust points */}
          <div className="pt-8 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-medium text-slate-400">
            <div className="flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-400" /> Zero Double-Booking
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <Brain className="w-4 h-4 text-teal-400" /> AI Intake Summaries
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <Calendar className="w-4 h-4 text-teal-400" /> Google Calendar 2-Way
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <BellRing className="w-4 h-4 text-teal-400" /> Medication Reminders
            </div>
          </div>
        </div>
      </section>

      {/* Featured Clinical Specializations */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Medical Departments</span>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">Specialists by Clinical Area</h2>
          </div>
          <Link to="/doctors" className="text-sm font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1">
            View All Doctors <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {specialties.map((spec) => (
            <Link
              key={spec.name}
              to={`/doctors?specialization=${encodeURIComponent(spec.name)}`}
              className="group p-6 rounded-2xl bg-white border border-slate-200 hover:border-teal-400 hover:shadow-lg hover:shadow-teal-900/5 transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                {spec.icon}
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-4 group-hover:text-teal-700 transition-colors">
                {spec.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{spec.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 space-y-10">
        <div className="max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Next-Generation Clinical Engine</span>
          <h2 className="text-3xl font-extrabold mt-1">Built for Patient Trust & Clinical Productivity</h2>
          <p className="text-slate-400 text-sm mt-2">
            Every feature is engineered to prevent scheduling conflicts, save clinical time, and ensure patients never miss follow-ups.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/60 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold">5-Minute Slot Hold Guarantee</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              When you choose a slot, a 5-minute pessimistic hold locks it exclusively for you while you fill your symptoms. Zero double-booking collisions.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/60 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold">AI Clinical Intake & Urgency</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Google Gemini analyses patient symptoms to assign urgency levels (Low to Emergency) and generates targeted diagnostic questions for the doctor.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/60 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold">Google Calendar Two-Way Sync</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Connect your Google account with 1-click. Confirmed visits create calendar events automatically and update on reschedule or cancellation.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
