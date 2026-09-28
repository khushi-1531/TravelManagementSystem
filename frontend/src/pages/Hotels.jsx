import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import hotelApi from '../services/hotelApi';
import destinationApi from '../services/destinationApi';
import HotelCard from '../components/HotelCard';
import FilterPanel from '../components/FilterPanel';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { Search, Hotel as HotelIcon, Star, ChevronLeft, ChevronRight } from 'lucide-react';

export const Hotels = () => {
  const [searchParams] = useSearchParams();

  const [hotels, setHotels] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  const [searchQuery, setSearchQuery] = useState(searchParams.get('query') || '');
  const [selectedDestinationId, setSelectedDestinationId] = useState(searchParams.get('destinationId') || '');
  const [minRating, setMinRating] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('rating_desc');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load destinations for the dropdown filter
  useEffect(() => {
    destinationApi.getDestinations({ size: 100 })
      .then((data) => setDestinations(data.content || []))
      .catch(() => {});
  }, []);

  const fetchHotels = async (page = 0) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        size: 9,
        sort: sortBy
      };
      if (searchQuery.trim()) params.query = searchQuery.trim();
      if (selectedDestinationId) params.destinationId = selectedDestinationId;
      if (minRating) params.minRating = minRating;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;

      const data = await hotelApi.getHotels(params);
      setHotels(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
      setCurrentPage(data.page || 0);
    } catch (err) {
      setError(err.message || 'Unable to load hotels.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels(0);
  }, [selectedDestinationId, minRating, minPrice, maxPrice, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedDestinationId('');
    setMinRating('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('rating_desc');
  };

  const activeFilterCount = (selectedDestinationId ? 1 : 0) + (minRating ? 1 : 0) + (minPrice || maxPrice ? 1 : 0) + (searchQuery ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-700 mb-1">
          <HotelIcon className="w-4 h-4 text-teal-600" />
          <span>Accommodations & Stays</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Hotels & Resorts</h1>
        <p className="text-slate-500 text-sm mt-1">
          Discover verified luxury hotels, coastal retreats, and boutique heritage suites.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Filter Panel */}
        <div className="lg:col-span-1">
          <FilterPanel
            title="Filter Hotels"
            activeFilterCount={activeFilterCount}
            onReset={handleResetFilters}
          >
            {/* Search */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Search by Hotel</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. Palace, Resort, Grand..."
                  className="w-full text-xs sm:text-sm pl-8 pr-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-teal-600"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Destination Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Destination</label>
              <select
                value={selectedDestinationId}
                onChange={(e) => setSelectedDestinationId(e.target.value)}
                className="w-full text-xs sm:text-sm p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
              >
                <option value="">All Destinations</option>
                {destinations.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Minimum Star Rating */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Minimum Rating</label>
              <select
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
                className="w-full text-xs sm:text-sm p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
              >
                <option value="">Any Rating</option>
                <option value="4.5">4.5+ Stars (Exceptional)</option>
                <option value="4.0">4.0+ Stars (Very Good)</option>
                <option value="3.0">3.0+ Stars (Standard)</option>
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Price per Night (₹)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded-xl outline-none"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded-xl outline-none"
                />
              </div>
            </div>

            <button
              onClick={() => fetchHotels(0)}
              className="w-full py-2.5 bg-brand-navy hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
            >
              Apply Filters
            </button>
          </FilterPanel>
        </div>

        {/* Right Content */}
        <div className="lg:col-span-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-xs sm:text-sm text-slate-500">
              Showing <strong className="text-slate-900">{totalElements}</strong> hotels
            </span>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-xs text-slate-500 whitespace-nowrap">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs sm:text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 outline-none"
              >
                <option value="rating_desc">Highest Rated</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name (A-Z)</option>
              </select>
            </div>
          </div>

          {loading ? (
            <LoadingState count={6} />
          ) : error ? (
            <ErrorState
              title="Unable to load hotels"
              message={error}
              onRetry={() => fetchHotels(0)}
            />
          ) : hotels.length === 0 ? (
            <EmptyState
              icon={HotelIcon}
              title="No hotels found"
              message="No accommodations match your filter settings. Try adjusting the price or rating criteria."
              actionLabel="Reset filters"
              onAction={handleResetFilters}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {hotels.map((hotel) => (
                  <HotelCard key={hotel.id} hotel={hotel} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <button
                    onClick={() => fetchHotels(currentPage - 1)}
                    disabled={currentPage === 0}
                    className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <span className="text-xs sm:text-sm font-medium text-slate-600 px-4">
                    Page {currentPage + 1} of {totalPages}
                  </span>

                  <button
                    onClick={() => fetchHotels(currentPage + 1)}
                    disabled={currentPage >= totalPages - 1}
                    className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Hotels;
