import React from 'react';
import { Calendar, UtensilsCrossed } from 'lucide-react';

export const ItineraryTimeline = ({ items = [] }) => {
  if (!items || items.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-slate-500 text-sm">
        Detailed day-by-day itinerary will be provided upon package inquiry.
      </div>
    );
  }

  // Sort by day number
  const sortedItems = [...items].sort((a, b) => (a.dayNumber || 0) - (b.dayNumber || 0));

  return (
    <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-teal-200">
      {sortedItems.map((item, index) => (
        <div key={item.id || index} className="relative group">
          {/* Timeline node */}
          <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-teal-600 border-4 border-white shadow-md flex items-center justify-center text-white text-[11px] font-bold">
            {item.dayNumber || index + 1}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold tracking-wider text-teal-700 uppercase">
                Day {item.dayNumber || index + 1}
              </span>
              {item.isMealsIncluded && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  <UtensilsCrossed className="w-3 h-3" />
                  Meals Included
                </span>
              )}
            </div>

            <h4 className="text-base font-bold text-slate-900 mb-2">
              {item.activityTitle || `Day ${item.dayNumber} Exploration`}
            </h4>

            <p className="text-slate-600 text-sm leading-relaxed">
              {item.activityDescription || 'Experience guided sightseeing, local attractions, and planned leisure activities.'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ItineraryTimeline;
