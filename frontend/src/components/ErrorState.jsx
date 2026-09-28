import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const ErrorState = ({
  title = "Unable to load data",
  message = "We ran into an unexpected issue while fetching the information. Please verify the backend is running and try again.",
  onRetry
}) => {
  return (
    <div className="bg-rose-50/70 border border-rose-200/70 rounded-2xl p-8 max-w-xl mx-auto my-8 text-center">
      <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 text-sm mb-6 max-w-md mx-auto leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-navy hover:bg-slate-800 text-white font-medium rounded-xl text-sm transition-colors shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorState;
