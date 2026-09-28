import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import destinationApi from '../services/destinationApi';
import DestinationCard from '../components/DestinationCard';
import FilterPanel from '../components/FilterPanel';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { Search, MapPin, Sparkles, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';

export const Destinations = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [destinations, setDestinations] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  const [searchQuery, setSearchQuery] = useState(searchParams.get('query') || '');
  const [stateFilter, setStateFilter] = useState(searchParams.get('state') || '');
  const [countryFilter, setCountryFilter] = useState(searchParams.get('country') || '');
  const [featuredFilter, setFeaturedFilter] = useState(searchParams.get('featured') === 'true');
  const [sortBy, setSortBy] = useState('name_asc');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDestinations = async (page = 0) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        size: 9,
        sort: sortBy
      };
      if (searchQuery.trim()) params.query = searchQuery.trim();
      if (stateFilter.trim()) params.state = stateFilter.trim();
      if (countryFilter.trim()) params.country = countryFilter.trim();
      if (featuredFilter) params.featured = true;

      const data = await destinationApi.getDestinations(params);
      setDestinations(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
      setCurrentPage(data.page || 0);
    } catch (err) {
      setError(err.message || 'Failed to load destinations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDestinations(0);
  }, [stateFilter, countryFilter, featuredFilter, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDestinations(0);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStateFilter('');
    setCountryFilter('');
    setFeaturedFilter(false);
    setSortBy('name_asc');
  };

  const activeFilterCount = (stateFilter ? 1 : 0) + (countryFilter ? 1 : 0) + (featuredFilter ? 1 : 0) + (searchQuery ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-700 mb-1">
          <MapPin className="w-4 h-4 text-teal-600" />
          <span>Destination Directory</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Explore Destinations</h1>
        <p className="text-slate-500 text-sm mt-1">
          Discover handpicked cities, coastal paradises, and mountain retreats.
        </p>
      </div>

      {/* Main Grid with Sidebar Filter */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Filter Panel */}
        <div className="lg:col-span-1">
          <FilterPanel
            title="Filter Destinations"
            activeFilterCount={activeFilterCount}
            onReset={handleResetFilters}
          >
            {/* Search filter input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Keyword Search</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. Goa, Jaipur..."
                  className="w-full text-xs sm:text-sm pl-8 pr-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-teal-600"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Featured checkbox */}
            <div className="pt-2">
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={featuredFilter}
                  onChange={(e) => setFeaturedFilter(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 border-slate-300"
                />
                <span className="font-medium text-xs sm:text-sm">Featured Destinations only</span>
              </label>
            </div>

            {/* Apply Button */}
            <button
              onClick={() => fetchDestinations(0)}
              className="w-full py-2.5 bg-brand-navy hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
            >
              Apply Filters
            </button>
          </FilterPanel>
        </div>

        {/* Right Content Area */}
        <div className="lg:col-span-3">
          {/* Top Bar: Results Count & Sort */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-xs sm:text-sm text-slate-500">
              Showing <strong className="text-slate-900">{totalElements}</strong> destinations
            </span>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-xs text-slate-500 whitespace-nowrap">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs sm:text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 outline-none"
              >
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
                <option value="created_desc">Recently Added</option>
              </select>
            </div>
          </div>

          {/* Dynamic States */}
          {loading ? (
            <LoadingState count={6} />
          ) : error ? (
            <ErrorState
              title="Unable to load destinations"
              message={error}
              onRetry={() => fetchDestinations(0)}
            />
          ) : destinations.length === 0 ? (
            <EmptyState
              title="No destinations found"
              message="No destinations match your filter criteria. Try resetting your search filters."
              actionLabel="Clear all filters"
              onAction={handleResetFilters}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {destinations.map((dest) => (
                  <DestinationCard key={dest.id} destination={dest} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <button
                    onClick={() => fetchDestinations(currentPage - 1)}
                    disabled={currentPage === 0}
                    className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <span className="text-xs sm:text-sm font-medium text-slate-600 px-4">
                    Page {currentPage + 1} of {totalPages}
                  </span>

                  <button
                    onClick={() => fetchDestinations(currentPage + 1)}
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

export default Destinations;
