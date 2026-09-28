import React from 'react';
import { Compass, RotateCcw } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = Compass,
  title = "No results found",
  message = "We couldn't find any matching records with the selected filters. Try broadening your criteria.",
  actionLabel,
  onAction
}) => {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-12 max-w-lg mx-auto my-8 text-center shadow-sm">
      <div className="w-16 h-16 bg-slate-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 text-sm mb-6 leading-relaxed max-w-sm mx-auto">
        {message}
      </p>
      {onAction && actionLabel && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl text-sm transition-colors shadow-sm"
        >
          <RotateCcw className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
