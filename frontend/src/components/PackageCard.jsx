import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { handleImageError } from '../utils/imageFallback';
import { formatCurrency, formatDuration } from '../utils/formatters';
import WishlistButton from './WishlistButton';

const TIER_BADGES = {
  BUDGET: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  STANDARD: 'bg-blue-50 text-blue-700 border-blue-200',
  PREMIUM: 'bg-purple-50 text-purple-700 border-purple-200',
  LUXURY: 'bg-amber-50 text-amber-700 border-amber-200'
};

export const PackageCard = ({ travelPackage }) => {
  if (!travelPackage) return null;

  const {
    id,
    title,
    destinationName,
    tier,
    durationDays,
    durationNights,
    basePricePerPerson,
    heroImageUrl,
    inclusions
  } = travelPackage;

  const tierBadge = TIER_BADGES[tier?.toUpperCase()] || 'bg-slate-50 text-slate-700 border-slate-200';

  // Parse sample inclusions if comma separated or text
  const inclusionList = inclusions ? inclusions.split(/[,;\n]/).map(s => s.trim()).filter(Boolean).slice(0, 3) : [];

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col">
      <div className="relative h-52 overflow-hidden bg-slate-100">
        <img
          src={heroImageUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80'}
          alt={title}
          onError={(e) => handleImageError(e, 'package')}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-black/20 pointer-events-none" />

        <WishlistButton
          targetType="PACKAGE"
          targetId={id}
          size="sm"
          className="absolute top-3 right-3 z-10"
        />

        {tier && (
          <span className={`absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full border shadow-sm ${tierBadge}`}>
            {tier} TIER
          </span>
        )}

        <div className="absolute bottom-3 left-3 right-3 text-white">
          {destinationName && (
            <div className="flex items-center gap-1 text-xs font-medium text-slate-200 mb-0.5">
              <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span className="truncate">{destinationName}</span>
            </div>
          )}
          <h3 className="text-lg font-bold text-white drop-shadow-sm truncate">{title}</h3>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-3 bg-slate-50 px-2.5 py-1.5 rounded-lg w-fit">
            <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span>{formatDuration(durationDays, durationNights)}</span>
          </div>

          {inclusionList.length > 0 && (
            <div className="space-y-1.5 mb-4">
              {inclusionList.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span className="truncate">{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-medium">Per Person</span>
            <span className="text-lg font-bold text-teal-800">
              {formatCurrency(basePricePerPerson)}
            </span>
          </div>

          <Link
            to={`/packages/${id}`}
            className="inline-flex items-center gap-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
          >
            View Itinerary
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PackageCard;
