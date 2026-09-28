import React, { useState } from 'react';
import { Filter, X, RotateCcw } from 'lucide-react';

export const FilterPanel = ({
  title = "Filters",
  children,
  onReset,
  activeFilterCount = 0,
  className = ""
}) => {
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  return (
    <div className={className}>
      {/* Mobile filter toggle trigger */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsOpenMobile(!isOpenMobile)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 text-sm shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-teal-600" />
            <span>{title}</span>
            {activeFilterCount > 0 && (
              <span className="bg-teal-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
          <span className="text-xs text-teal-700 font-semibold">
            {isOpenMobile ? 'Hide Filters' : 'Show Filters'}
          </span>
        </button>
      </div>

      {/* Filter Body (Always visible on lg screens, toggled on mobile) */}
      <div
        className={`${
          isOpenMobile ? 'block' : 'hidden'
        } lg:block bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-6`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-teal-600" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">{title}</h3>
            {activeFilterCount > 0 && (
              <span className="bg-teal-100 text-teal-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>

          {onReset && activeFilterCount > 0 && (
            <button
              onClick={onReset}
              className="text-xs font-semibold text-slate-400 hover:text-rose-600 inline-flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>

        <div className="space-y-5">
          {children}
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
