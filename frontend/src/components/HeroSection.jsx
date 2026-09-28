import React from 'react';
import { Link } from 'react-router-dom';
import { SearchBar } from './SearchBar';
import { Compass, Sparkles, Shield, Award } from 'lucide-react';

export const HeroSection = ({ heroImage }) => {
  const bgImage = heroImage || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1920&q=80';

  return (
    <div className="relative min-h-[580px] lg:min-h-[640px] flex items-center justify-center overflow-hidden bg-brand-navy">
      {/* Background image with gradient overlays */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105 opacity-40 mix-blend-overlay"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-brand-navy/90 via-brand-navy/70 to-slate-900/95" />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        {/* Brand Tagline Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs sm:text-sm font-semibold mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          <span>Discover places. Plan better. Travel smarter.</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight sm:leading-tight mb-6">
          Explore the world, <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-emerald-300 to-amber-200">your way</span>.
        </h1>

        {/* Supporting Copy */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 font-normal leading-relaxed mb-10">
          Discover handpicked destinations, stay in remarkable hotels, and find travel experiences carefully crafted around you.
        </p>

        {/* Prominent Search Bar */}
        <div className="mb-10">
          <SearchBar />
        </div>

        {/* Value Prop Badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm text-slate-300">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Curated Destinations</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-teal-400" />
            <span>Verified Hotel Partners</span>
          </div>
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-400" />
            <span>All-Inclusive Itineraries</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
