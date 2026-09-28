import React from 'react';

export const LoadingState = ({ count = 6, type = 'card' }) => {
  if (type === 'detail') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse space-y-8">
        <div className="h-80 bg-slate-200 rounded-3xl w-full"></div>
        <div className="space-y-4">
          <div className="h-8 bg-slate-200 rounded-lg w-1/3"></div>
          <div className="h-4 bg-slate-200 rounded w-2/3"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="h-48 bg-slate-200 rounded-2xl"></div>
          <div className="h-48 bg-slate-200 rounded-2xl"></div>
          <div className="h-48 bg-slate-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm animate-pulse"
        >
          <div className="h-52 bg-slate-200 w-full"></div>
          <div className="p-5 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-4 bg-slate-200 rounded w-1/4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/6"></div>
            </div>
            <div className="h-6 bg-slate-200 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 rounded w-full"></div>
            <div className="h-4 bg-slate-200 rounded w-2/3"></div>
            <div className="pt-4 flex justify-between items-center border-t border-slate-100">
              <div className="h-6 bg-slate-200 rounded w-1/3"></div>
              <div className="h-8 bg-slate-200 rounded-lg w-24"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LoadingState;
