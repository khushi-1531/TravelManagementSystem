import React from 'react';
import { Users, Wind, Coffee, Check, BedDouble } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export const RoomCard = ({ room, onBookRoom }) => {
  if (!room) return null;

  const {
    roomType,
    maxOccupancy,
    hasAc,
    isBreakfastIncluded,
    pricePerNight,
    availableInventory,
    totalInventory
  } = room;

  const isAvailable = (availableInventory ?? 1) > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:border-teal-500/40 transition-all duration-300 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <h4 className="text-lg font-bold text-slate-900">{roomType}</h4>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
            isAvailable ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}>
            {isAvailable ? `${availableInventory || 1} Available` : 'Fully Booked'}
          </span>
        </div>

        {/* Highlights */}
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-4">
          <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg">
            <Users className="w-4 h-4 text-teal-600 shrink-0" />
            <span>Up to {maxOccupancy} Guests</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg">
            <Wind className="w-4 h-4 text-teal-600 shrink-0" />
            <span>{hasAc ? 'Air Conditioned' : 'Non-AC'}</span>
          </div>

          <div className="col-span-2 flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg">
            <Coffee className="w-4 h-4 text-teal-600 shrink-0" />
            <span>{isBreakfastIncluded ? 'Complimentary Daily Breakfast' : 'Room Only (Breakfast not included)'}</span>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
        <div>
          <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-medium">Nightly Rate</span>
          <span className="text-lg sm:text-xl font-bold text-slate-900">
            {formatCurrency(pricePerNight)}
            <span className="text-xs font-normal text-slate-500"> / night</span>
          </span>
        </div>

        <div>
          {isAvailable ? (
            <button
              onClick={() => onBookRoom && onBookRoom(room)}
              className="inline-flex items-center gap-1 px-4 py-2 bg-brand-navy hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
            >
              <BedDouble className="w-3.5 h-3.5" />
              <span>Reserve Room</span>
            </button>
          ) : (
            <span className="inline-block px-3 py-1.5 bg-slate-100 text-slate-400 text-xs font-medium rounded-lg cursor-not-allowed">
              Unavailable
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomCard;
