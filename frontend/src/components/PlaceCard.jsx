import React from 'react';
import { MapPin, Clock, Tag, IndianRupee } from 'lucide-react';
import { handleImageError } from '../utils/imageFallback';
import { formatCurrency } from '../utils/formatters';

const CATEGORY_COLORS = {
  BEACH: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  HERITAGE: 'bg-amber-100 text-amber-800 border-amber-200',
  NATURE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  RELIGIOUS: 'bg-purple-100 text-purple-800 border-purple-200',
  ADVENTURE: 'bg-orange-100 text-orange-800 border-orange-200',
  URBAN: 'bg-slate-100 text-slate-800 border-slate-200',
  WILDLIFE: 'bg-lime-100 text-lime-800 border-lime-200',
  DEFAULT: 'bg-teal-50 text-teal-800 border-teal-200'
};

export const PlaceCard = ({ place }) => {
  if (!place) return null;

  const {
    name,
    destinationName,
    category,
    description,
    entryFee,
    openingTime,
    closingTime,
    imageUrl
  } = place;

  const categoryStyle = CATEGORY_COLORS[category?.toUpperCase()] || CATEGORY_COLORS.DEFAULT;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col">
      <div className="relative h-48 overflow-hidden bg-slate-100">
        <img
          src={imageUrl || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80'}
          alt={name}
          onError={(e) => handleImageError(e, 'place')}
          className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {category && (
          <span className={`absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full border shadow-sm ${categoryStyle}`}>
            {category}
          </span>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {destinationName && (
            <div className="flex items-center gap-1 text-xs font-medium text-teal-700 mb-1">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>{destinationName}</span>
            </div>
          )}
          <h4 className="text-lg font-bold text-slate-900 mb-2 truncate">{name}</h4>
          <p className="text-slate-600 text-sm line-clamp-3 mb-4 leading-relaxed">
            {description || 'An iconic landmark featuring rich heritage and remarkable sightseeing opportunities.'}
          </p>
        </div>

        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          {(openingTime || closingTime) ? (
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{openingTime || '09:00'} - {closingTime || '18:00'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Open Daily</span>
            </div>
          )}

          <div className="flex items-center gap-1 font-semibold text-slate-700">
            <span>Entry:</span>
            <span className="text-teal-700">
              {Number(entryFee) === 0 ? 'Free' : formatCurrency(entryFee)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceCard;
