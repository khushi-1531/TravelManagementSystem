import React, { useState } from 'react';
import { Star } from 'lucide-react';

export const StarRating = ({
  value = 0,
  onChange = null,
  readOnly = false,
  size = 'md',
  showLabel = false,
  labelPrefix = '',
  className = ''
}) => {
  const [hoverValue, setHoverValue] = useState(0);

  const isInteractive = !readOnly && typeof onChange === 'function';

  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-7 h-7'
  };

  const starSize = sizeClasses[size] || sizeClasses.md;

  const activeValue = hoverValue > 0 ? hoverValue : value;

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div 
        className="flex items-center gap-1"
        role={isInteractive ? 'radiogroup' : 'img'}
        aria-label={`Rating: ${value} out of 5 stars`}
        onMouseLeave={() => isInteractive && setHoverValue(0)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= activeValue;

          if (isInteractive) {
            return (
              <button
                key={star}
                type="button"
                role="radio"
                aria-checked={star === value}
                aria-label={`${star} star${star > 1 ? 's' : ''}`}
                onClick={() => onChange(star)}
                onMouseEnter={() => setHoverValue(star)}
                onFocus={() => setHoverValue(star)}
                onBlur={() => setHoverValue(0)}
                className="p-0.5 rounded focus:outline-none focus:ring-2 focus:ring-teal-500 transition-transform hover:scale-110"
              >
                <Star
                  className={`${starSize} transition-colors ${
                    isFilled
                      ? 'fill-amber-400 text-amber-500'
                      : 'fill-transparent text-slate-300 hover:text-slate-400'
                  }`}
                />
              </button>
            );
          }

          return (
            <Star
              key={star}
              className={`${starSize} ${
                isFilled
                  ? 'fill-amber-400 text-amber-500'
                  : 'fill-transparent text-slate-300'
              }`}
            />
          );
        })}
      </div>

      {showLabel && (
        <span className="text-xs font-semibold text-slate-700">
          {labelPrefix}{value ? Number(value).toFixed(1) : '0.0'}
        </span>
      )}
    </div>
  );
};

export default StarRating;
