import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { doctorsApi } from '../../api/index.js';
import { Button } from '../../components/common/Button.js';
import { Badge } from '../../components/common/Badge.js';
import {
  Search,
  Filter,
  Stethoscope,
  Clock,
  DollarSign,
  Award,
  Calendar,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const DoctorSearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSpecialization = searchParams.get('specialization') || '';
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [minExp, setMinExp] = useState(searchParams.get('minExperience') || '');

  // Fetch specializations
  const { data: specializationsData } = useQuery({
    queryKey: ['specializations'],
    queryFn: () => doctorsApi.getSpecializations(),
  });

  // Fetch doctors list
  const { data: doctorsData, isLoading } = useQuery({
    queryKey: ['doctors', activeSpecialization, searchQuery, minExp],
    queryFn: () =>
      doctorsApi.getDoctors({
        specialization: activeSpecialization || undefined,
        search: searchQuery || undefined,
        minExperience: minExp ? parseInt(minExp, 10) : undefined,
      }),
  });

  const specializations = specializationsData?.data || [];
  const doctors = doctorsData?.data || [];

  const handleSpecialtyClick = (spec: string) => {
    if (activeSpecialization === spec) {
      searchParams.delete('specialization');
    } else {
      searchParams.set('specialization', spec);
    }
    setSearchParams(searchParams);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery) {
      searchParams.set('search', searchQuery);
    } else {
      searchParams.delete('search');
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="space-y-8">
      {/* Header & Search Bar */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Clinical Directory</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Find & Book a Specialist</h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse certified physicians, explore shift availability, and lock your slot with our 5-minute hold system.
          </p>
        </div>

        {/* Search controls */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by doctor name, specialty, or condition..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-sm outline-none transition-all"
            />
          </div>
          <div className="sm:w-48">
            <select
              value={minExp}
              onChange={(e) => {
                setMinExp(e.target.value);
                if (e.target.value) searchParams.set('minExperience', e.target.value);
                else searchParams.delete('minExperience');
                setSearchParams(searchParams);
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-sm outline-none bg-white transition-all text-slate-700"
            >
              <option value="">Any Experience</option>
              <option value="5">5+ Years Exp</option>
              <option value="10">10+ Years Exp</option>
              <option value="15">15+ Years Exp</option>
            </select>
          </div>
          <Button type="submit" variant="primary">
            Search
          </Button>
        </form>

        {/* Specialty Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Specialties:
          </span>
          <button
            type="button"
            onClick={() => {
              searchParams.delete('specialization');
              setSearchParams(searchParams);
            }}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
              !activeSpecialization
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Specialties
          </button>
          {specializations.map((spec) => (
            <button
              key={spec}
              type="button"
              onClick={() => handleSpecialtyClick(spec)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                activeSpecialization === spec
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* Doctor Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-slate-200 rounded-full"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                </div>
              </div>
              <div className="h-12 bg-slate-100 rounded"></div>
              <div className="h-10 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : doctors.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No doctors match your criteria</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query or removing specialization filters to explore our full clinical team.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setMinExp('');
              setSearchParams({});
            }}
          >
            Clear All Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {doctors.map((doctor) => (
            <div
              key={doctor.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-teal-300 hover:shadow-lg hover:shadow-teal-900/5 transition-all duration-200 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white font-extrabold text-lg flex items-center justify-center shadow-md shadow-teal-600/20">
                      {doctor.user?.fullName.charAt(3) || 'D'}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{doctor.user?.fullName}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="info" size="sm">{doctor.specialization}</Badge>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Award className="w-3 h-3 text-amber-500" /> {doctor.experienceYears}y exp
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-extrabold text-teal-700 font-mono">
                      ${Number(doctor.consultationFee).toFixed(2)}
                    </span>
                    <p className="text-[10px] text-slate-400">{doctor.slotDurationMinutes || 30} min session</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                  {doctor.bio || 'Clinical physician providing patient-centered preventive and diagnostic care.'}
                </p>

                {/* Working hours preview */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-teal-600" />
                    <span>Mon - Fri (09:00 - 17:00)</span>
                  </div>
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                    Available
                  </span>
                </div>
              </div>

              <div className="pt-5 mt-5 border-t border-slate-100 flex items-center gap-3">
                <Link to={`/book?doctorId=${doctor.id}`} className="flex-1">
                  <Button variant="primary" className="w-full font-bold">
                    <Calendar className="w-4 h-4 mr-1.5" /> Book Slot
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
