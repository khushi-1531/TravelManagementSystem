import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Sparkles, ArrowRight, Sun } from 'lucide-react';
import { handleImageError } from '../utils/imageFallback';
import WishlistButton from './WishlistButton';

export const DestinationCard = ({ destination }) => {
  if (!destination) return null;

  const {
    id,
    name,
    state,
    country,
    description,
    heroImageUrl,
    isFeatured,
    bestTimeToVisit
  } = destination;

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col">
      {/* Image header with badges */}
      <div className="relative h-56 overflow-hidden bg-slate-100">
        <img
          src={heroImageUrl || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'}
          alt={name}
          onError={(e) => handleImageError(e, 'destination')}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20 pointer-events-none" />

        <WishlistButton
          targetType="DESTINATION"
          targetId={id}
          size="sm"
          className="absolute top-3 right-3 z-10"
        />

        {isFeatured && (
          <span className="absolute top-3 left-3 bg-amber-500/90 backdrop-blur-md text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Featured
          </span>
        )}

        <div className="absolute bottom-3 left-3 right-3 text-white">
          <div className="flex items-center gap-1 text-xs font-medium text-slate-200 mb-0.5">
            <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span className="truncate">{state ? `${state}, ${country}` : country}</span>
          </div>
          <h3 className="text-xl font-bold text-white drop-shadow-sm truncate">{name}</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <p className="text-slate-600 text-sm line-clamp-3 mb-4 leading-relaxed">
            {description || 'Discover breathtaking landscapes, vibrant cultural attractions, and unforgettable local adventures.'}
          </p>

          {bestTimeToVisit && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-lg mb-4">
              <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="truncate">Best time: <strong>{bestTimeToVisit}</strong></span>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Discover experiences</span>
          <Link
            to={`/destinations/${id}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-800 transition-colors group-hover:translate-x-0.5"
          >
            Explore
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DestinationCard;
