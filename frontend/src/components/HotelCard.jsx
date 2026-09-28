import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, Wifi, Waves, Car, Utensils, ArrowRight } from 'lucide-react';
import { handleImageError } from '../utils/imageFallback';
import { formatCurrency } from '../utils/formatters';
import WishlistButton from './WishlistButton';

export const HotelCard = ({ hotel }) => {
  if (!hotel) return null;

  const {
    id,
    name,
    destinationName,
    starRating,
    heroImageUrl,
    description,
    startingPricePerNight,
    hasWifi,
    hasSwimmingPool,
    hasParking,
    hasRestaurant
  } = hotel;

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col">
      <div className="relative h-52 overflow-hidden bg-slate-100">
        <img
          src={heroImageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'}
          alt={name}
          onError={(e) => handleImageError(e, 'hotel')}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-black/20 pointer-events-none" />

        <WishlistButton
          targetType="HOTEL"
          targetId={id}
          size="sm"
          className="absolute top-3 right-3 z-10"
        />

        {/* Star rating pill */}
        {starRating && (
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-slate-900 flex items-center gap-1 shadow-sm">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            <span>{Number(starRating).toFixed(1)} Star</span>
          </div>
        )}

        <div className="absolute bottom-3 left-3 right-3 text-white">
          {destinationName && (
            <div className="flex items-center gap-1 text-xs font-medium text-slate-200 mb-0.5">
              <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span className="truncate">{destinationName}</span>
            </div>
          )}
          <h3 className="text-xl font-bold text-white drop-shadow-sm truncate">{name}</h3>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <p className="text-slate-600 text-sm line-clamp-2 mb-4 leading-relaxed">
            {description || 'Refined hospitality, thoughtfully designed guest rooms, and premium amenities for a restorative stay.'}
          </p>

          {/* Amenities icons */}
          <div className="flex items-center gap-3 text-xs text-slate-500 mb-4 pb-3 border-b border-slate-100">
            {hasWifi && (
              <span className="inline-flex items-center gap-1" title="Free High-Speed Wi-Fi">
                <Wifi className="w-3.5 h-3.5 text-teal-600" /> Wi-Fi
              </span>
            )}
            {hasSwimmingPool && (
              <span className="inline-flex items-center gap-1" title="Swimming Pool">
                <Waves className="w-3.5 h-3.5 text-cyan-600" /> Pool
              </span>
            )}
            {hasRestaurant && (
              <span className="inline-flex items-center gap-1" title="On-site Dining">
                <Utensils className="w-3.5 h-3.5 text-orange-600" /> Dining
              </span>
            )}
            {hasParking && (
              <span className="inline-flex items-center gap-1" title="Complimentary Parking">
                <Car className="w-3.5 h-3.5 text-slate-600" /> Parking
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-medium">Starts from</span>
            <span className="text-lg font-bold text-slate-900">
              {formatCurrency(startingPricePerNight)}
              <span className="text-xs font-normal text-slate-500"> / night</span>
            </span>
          </div>

          <Link
            to={`/hotels/${id}`}
            className="inline-flex items-center gap-1 px-4 py-2 bg-brand-navy hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
          >
            View Rooms
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HotelCard;
