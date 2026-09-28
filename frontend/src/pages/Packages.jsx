import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import packageApi from '../services/packageApi';
import destinationApi from '../services/destinationApi';
import PackageCard from '../components/PackageCard';
import FilterPanel from '../components/FilterPanel';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { Search, Luggage, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const TIERS = ['BUDGET', 'STANDARD', 'PREMIUM', 'LUXURY'];

export const Packages = () => {
  const [searchParams] = useSearchParams();

  const [packages, setPackages] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  const [searchQuery, setSearchQuery] = useState(searchParams.get('query') || '');
  const [selectedDestinationId, setSelectedDestinationId] = useState(searchParams.get('destinationId') || '');
  const [selectedTier, setSelectedTier] = useState(searchParams.get('tier') || '');
  const [durationDays, setDurationDays] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('price_asc');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    destinationApi.getDestinations({ size: 100 })
      .then((data) => setDestinations(data.content || []))
      .catch(() => {});
  }, []);

  const fetchPackages = async (page = 0) => {
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
      if (selectedTier) params.tier = selectedTier;
      if (durationDays) params.durationDays = durationDays;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;

      const data = await packageApi.getPackages(params);
      setPackages(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
      setCurrentPage(data.page || 0);
    } catch (err) {
      setError(err.message || 'Unable to load travel packages.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages(0);
  }, [selectedDestinationId, selectedTier, durationDays, minPrice, maxPrice, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedDestinationId('');
    setSelectedTier('');
    setDurationDays('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('price_asc');
  };

  const activeFilterCount = (selectedDestinationId ? 1 : 0) + (selectedTier ? 1 : 0) + (durationDays ? 1 : 0) + (minPrice || maxPrice ? 1 : 0) + (searchQuery ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-700 mb-1">
          <Luggage className="w-4 h-4 text-teal-600" />
          <span>Curated Itineraries</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Holiday Packages</h1>
        <p className="text-slate-500 text-sm mt-1">
          Complete vacation packages with verified accommodation, activities, and daily itineraries.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Filter Panel */}
        <div className="lg:col-span-1">
          <FilterPanel
            title="Filter Packages"
            activeFilterCount={activeFilterCount}
            onReset={handleResetFilters}
          >
            {/* Search */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Search Package</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. Goa Holiday, Golden Triangle..."
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

            {/* Tier selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Package Tier</label>
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="w-full text-xs sm:text-sm p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
              >
                <option value="">All Tiers</option>
                {TIERS.map((t) => (
                  <option key={t} value={t}>{t} Tier</option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Budget per Person (₹)</label>
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
              onClick={() => fetchPackages(0)}
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
              Showing <strong className="text-slate-900">{totalElements}</strong> packages
            </span>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-xs text-slate-500 whitespace-nowrap">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs sm:text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 outline-none"
              >
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="duration_asc">Duration: Short to Long</option>
                <option value="duration_desc">Duration: Long to Short</option>
              </select>
            </div>
          </div>

          {loading ? (
            <LoadingState count={6} />
          ) : error ? (
            <ErrorState
              title="Unable to load packages"
              message={error}
              onRetry={() => fetchPackages(0)}
            />
          ) : packages.length === 0 ? (
            <EmptyState
              icon={Luggage}
              title="No packages match your search"
              message="No holiday packages match the selected criteria. Try adjusting the destination or price range."
              actionLabel="Reset filters"
              onAction={handleResetFilters}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {packages.map((pkg) => (
                  <PackageCard key={pkg.id} travelPackage={pkg} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <button
                    onClick={() => fetchPackages(currentPage - 1)}
                    disabled={currentPage === 0}
                    className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <span className="text-xs sm:text-sm font-medium text-slate-600 px-4">
                    Page {currentPage + 1} of {totalPages}
                  </span>

                  <button
                    onClick={() => fetchPackages(currentPage + 1)}
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

export default Packages;
