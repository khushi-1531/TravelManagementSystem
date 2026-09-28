import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, MapPin, Hotel, Luggage, Landmark, CheckCircle2, ArrowRight } from 'lucide-react';

export const About = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 w-full">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-bold uppercase tracking-wider mb-3">
          <Compass className="w-4 h-4" />
          <span>About TravelSphere</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
          Discover Places. Plan Better. Travel Smarter.
        </h1>
        <p className="text-slate-600 text-base leading-relaxed">
          TravelSphere is a modern travel discovery and management platform designed to help travelers find inspiring destinations, remarkable stays, and curated travel experiences.
        </p>
      </div>

      {/* Platform Capabilities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mb-5">
            <MapPin className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Destination Discovery</h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-4">
            Browse through curated travel regions with seasonal insights, optimal times to visit, climate summaries, and local highlights.
          </p>
          <ul className="space-y-2 text-xs text-slate-600">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>State and country geographical categorisation</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Curated travel guides and imagery</span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mb-5">
            <Landmark className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Attractions & Sights</h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-4">
            Explore heritage landmarks, scenic landscapes, sacred sites, and coastal attractions with authentic operational timings and entry requirements.
          </p>
          <ul className="space-y-2 text-xs text-slate-600">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Category filtering (Heritage, Beach, Nature, etc.)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Transparent operating hours and entry fees</span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mb-5">
            <Hotel className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Hotels & Stays</h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-4">
            Discover verified hotels and resorts with live room configurations, amenities checklists, star ratings, and transparent starting rates.
          </p>
          <ul className="space-y-2 text-xs text-slate-600">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Filtered by price, star rating, and amenities</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Detailed room inventory and occupancy options</span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center mb-5">
            <Luggage className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Holiday Packages</h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-4">
            Browse tiered vacation packages featuring day-by-day itineraries, planned sightseeing, and explicit meal inclusions.
          </p>
          <ul className="space-y-2 text-xs text-slate-600">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Budget, Standard, Premium, and Luxury tiers</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Structured day-by-day activity timelines</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Architecture Highlights */}
      <div className="bg-slate-100 rounded-3xl p-8 sm:p-10 border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-3">Modern Architecture</h2>
        <p className="text-slate-600 text-sm leading-relaxed mb-6">
          TravelSphere has been modernized from legacy monolithic software into a clean multi-tier architecture featuring a Spring Boot 3 enterprise REST backend, MySQL 8 relational schema with audit logging, and a responsive React single-page application.
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <Link
            to="/destinations"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-navy hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
          >
            <span>Explore Catalogue</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold rounded-xl transition-colors"
          >
            <span>Create Account</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default About;
