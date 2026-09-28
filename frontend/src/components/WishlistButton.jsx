import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import wishlistApi from '../services/wishlistApi';

export const WishlistButton = ({
  targetType,
  targetId,
  initialState = undefined,
  variant = 'floating',
  size = 'md',
  className = '',
  onToggle = null
}) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isWishlisted, setIsWishlisted] = useState(Boolean(initialState));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (isAuthenticated && targetType && targetId && initialState === undefined) {
      wishlistApi.checkWishlistStatus(targetType, targetId)
        .then((data) => {
          if (isMounted && data) {
            setIsWishlisted(Boolean(data.isWishlisted));
          }
        })
        .catch(() => {
          // Graceful fallback if check fails
        });
    } else if (initialState !== undefined) {
      setIsWishlisted(Boolean(initialState));
    }
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, targetType, targetId, initialState]);

  const handleToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }

    if (isLoading) return;

    const previousState = isWishlisted;
    const nextState = !previousState;
    setIsWishlisted(nextState);
    setIsLoading(true);

    try {
      if (nextState) {
        await wishlistApi.addToWishlist(targetType, targetId);
      } else {
        await wishlistApi.removeByTarget(targetType, targetId);
      }
      if (typeof onToggle === 'function') {
        onToggle(nextState);
      }
    } catch (err) {
      // Revert optimistic update
      setIsWishlisted(previousState);
    } finally {
      setIsLoading(false);
    }
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const iconSize = iconSizes[size] || iconSizes.md;

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={handleToggle}
        disabled={isLoading}
        aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
          isWishlisted
            ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
        } ${className}`}
      >
        {isLoading ? (
          <Loader2 className={`${iconSize} animate-spin text-slate-400`} />
        ) : (
          <Heart
            className={`${iconSize} transition-transform active:scale-125 ${
              isWishlisted
                ? 'fill-rose-500 text-rose-500'
                : 'fill-transparent text-slate-500 group-hover:text-rose-500'
            }`}
          />
        )}
        <span>{isWishlisted ? 'Saved' : 'Save to Wishlist'}</span>
      </button>
    );
  }

  // Floating variant (for cards and hero banners)
  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isLoading}
      aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
      className={`relative p-2 rounded-full backdrop-blur-md transition-all shadow-md active:scale-95 focus:outline-none focus:ring-2 focus:ring-rose-400 ${
        isWishlisted
          ? 'bg-white/95 text-rose-500 hover:bg-white'
          : 'bg-black/35 hover:bg-black/55 text-white'
      } ${className}`}
    >
      {isLoading ? (
        <Loader2 className={`${iconSize} animate-spin text-slate-400`} />
      ) : (
        <Heart
          className={`${iconSize} transition-transform ${
            isWishlisted ? 'fill-rose-500 text-rose-500 scale-105' : 'fill-transparent text-white'
          }`}
        />
      )}
    </button>
  );
};

export default WishlistButton;
