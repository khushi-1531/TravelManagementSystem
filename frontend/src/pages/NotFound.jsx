import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home, ArrowLeft } from 'lucide-react';

export const NotFound = () => {
  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center px-4 py-16">
      <div className="text-center max-w-md mx-auto space-y-6">
        <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
          <Compass className="w-10 h-10 animate-spin-slow" />
        </div>
        
        <div className="space-y-2">
          <span className="text-sm font-bold uppercase tracking-widest text-teal-600">404 Error</span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Off the Map
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            The page you're searching for doesn't exist or has moved to a new coordinate.
          </p>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-navy hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
          >
            <Home className="w-4 h-4" />
            <span>Return to Homepage</span>
          </Link>
          <Link
            to="/destinations"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Browse Destinations</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
