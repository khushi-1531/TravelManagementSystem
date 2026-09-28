import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  MapPin, 
  Compass, 
  Hotel, 
  Luggage, 
  Trash2, 
  ArrowRight, 
  ExternalLink,
  Sparkles
} from 'lucide-react';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import wishlistApi from '../services/wishlistApi';
import { formatCurrency } from '../utils/formatters';
import { handleImageError } from '../utils/imageFallback';

export const Wishlist = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'DESTINATION' | 'HOTEL' | 'PACKAGE'
  const [removingId, setRemovingId] = useState(null);

  const fetchWishlist = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await wishlistApi.getWishlist();
      setItems(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load your wishlist.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const handleRemove = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    setRemovingId(id);
    try {
      await wishlistApi.removeFromWishlist(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      // Fallback
    } finally {
      setRemovingId(null);
    }
  };

  const filteredItems = items.filter((item) => {
    if (activeFilter === 'ALL') return true;
    return item.targetType === activeFilter;
  });

  const getCounts = () => {
    const dest = items.filter((i) => i.targetType === 'DESTINATION').length;
    const hot = items.filter((i) => i.targetType === 'HOTEL').length;
    const pkg = items.filter((i) => i.targetType === 'PACKAGE').length;
    return { all: items.length, dest, hot, pkg };
  };

  const counts = getCounts();

  const typeBadges = {
    DESTINATION: {
      label: 'Destination',
      icon: Compass,
      style: 'bg-teal-50 text-teal-700 border-teal-200'
    },
    HOTEL: {
      label: 'Hotel & Stay',
      icon: Hotel,
      style: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    PACKAGE: {
      label: 'Holiday Package',
      icon: Luggage,
      style: 'bg-purple-50 text-purple-700 border-purple-200'
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <LoadingState type="card" count={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <ErrorState
          title="Unable to load wishlist"
          message={error}
          onRetry={fetchWishlist}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-100 mb-2">
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
            Your Travel Saved Collection
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            My Wishlist & Favorites
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Curate your dream journeys, luxury stays, and upcoming escapes in one place
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              activeFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({counts.all})
          </button>
          <button
            onClick={() => setActiveFilter('DESTINATION')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              activeFilter === 'DESTINATION'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Destinations ({counts.dest})
          </button>
          <button
            onClick={() => setActiveFilter('HOTEL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              activeFilter === 'HOTEL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Hotels ({counts.hot})
          </button>
          <button
            onClick={() => setActiveFilter('PACKAGE')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              activeFilter === 'PACKAGE'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Packages ({counts.pkg})
          </button>
        </div>
      </div>

      {/* Grid of Wishlist Items */}
      {filteredItems.length === 0 ? (
        <div className="py-12">
          <EmptyState
            icon={Heart}
            title={items.length === 0 ? 'Your wishlist is empty' : 'No saved items in this category'}
            message={
              items.length === 0
                ? 'Explore our curated destinations, hotels, and holiday packages, and click the heart icon to save your favorites.'
                : 'You have not added any items under this category yet.'
            }
            actionLabel="Discover Destinations"
            actionLink="/destinations"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const badge = typeBadges[item.targetType] || typeBadges.DESTINATION;
            const BadgeIcon = badge.icon;

            return (
              <div
                key={item.id}
                className="group bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
              >
                <div>
                  {/* Image container */}
                  <div className="relative h-48 sm:h-52 overflow-hidden bg-slate-100">
                    <img
                      src={item.imageUrl || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'}
                      alt={item.title}
                      onError={(e) => handleImageError(e, item.targetType.toLowerCase())}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20 pointer-events-none" />

                    {/* Target Type Pill */}
                    <span className={`absolute top-3 left-3 inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border shadow-xs backdrop-blur-md bg-white/95 ${badge.style}`}>
                      <BadgeIcon className="w-3 h-3" />
                      {badge.label}
                    </span>

                    {/* Remove Action Button */}
                    <button
                      type="button"
                      onClick={(e) => handleRemove(e, item.id)}
                      disabled={removingId === item.id}
                      aria-label="Remove from wishlist"
                      className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-rose-50 text-slate-500 hover:text-rose-600 shadow-sm backdrop-blur-md transition-all focus:outline-none focus:ring-2 focus:ring-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Bottom Metadata */}
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      {item.location && (
                        <div className="flex items-center gap-1 text-xs text-slate-200 mb-0.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                          <span className="truncate">{item.location}</span>
                        </div>
                      )}
                      <h3 className="text-lg font-bold text-white drop-shadow-sm truncate">
                        {item.title}
                      </h3>
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <span>Saved to collection</span>
                      <span className="font-medium text-slate-400">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                      </span>
                    </div>

                    {item.price && (
                      <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                        <span className="text-xs text-slate-500">Starting from</span>
                        <div className="text-right">
                          <span className="text-lg font-black text-slate-900">
                            {formatCurrency(item.price)}
                          </span>
                          <span className="text-[11px] text-slate-500 ml-1">
                            {item.targetType === 'HOTEL' ? '/ night' : '/ person'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Link */}
                <div className="p-4 pt-0">
                  <Link
                    to={item.linkUrl}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-slate-900 hover:bg-teal-700 text-white shadow-sm transition-colors"
                  >
                    View Details
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
