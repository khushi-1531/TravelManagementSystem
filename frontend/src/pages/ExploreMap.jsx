import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Compass, 
  MapPin, 
  Search, 
  Locate, 
  Filter, 
  SlidersHorizontal, 
  Navigation, 
  Hotel, 
  Landmark, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink, 
  Sparkles,
  Layers,
  ArrowRight,
  RefreshCw,
  X,
  CloudSun
} from 'lucide-react';
import TravelSphereMap from '../components/TravelSphereMap';
import DestinationWeatherCard from '../components/DestinationWeatherCard';
import mapApi from '../services/mapApi';

const CATEGORIES = [
  { label: 'All', value: 'ALL', icon: Compass },
  { label: 'Destinations', value: 'DESTINATION', icon: MapPin },
  { label: 'Heritage', value: 'HERITAGE', icon: Landmark },
  { label: 'Nature', value: 'NATURE', icon: Sparkles },
  { label: 'Beach', value: 'BEACH', icon: Navigation },
  { label: 'Adventure', value: 'ADVENTURE', icon: Compass },
  { label: 'Religious', value: 'RELIGIOUS', icon: Landmark },
  { label: 'Hotels', value: 'HOTEL', icon: Hotel },
];

const RADIUS_OPTIONS = [
  { label: '15 km', value: 15 },
  { label: '25 km', value: 25 },
  { label: '50 km', value: 50 },
  { label: '100 km', value: 100 },
  { label: '250 km', value: 250 },
  { label: '500 km', value: 500 },
];

export const ExploreMap = () => {
  // State
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedRadius, setSelectedRadius] = useState(50);
  const [nearbyOnly, setNearbyOnly] = useState(false);

  // Geolocation state
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState(null); // 'granted' | 'denied' | 'unavailable' | null
  const [dismissedLocationBanner, setDismissedLocationBanner] = useState(false);

  // External search results
  const [externalResults, setExternalResults] = useState([]);

  // Mobile layout switch: 'map' or 'list'
  const [mobileView, setMobileView] = useState('map');

  // Quick weather modal item
  const [weatherModalItem, setWeatherModalItem] = useState(null);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load Map Items
  const loadMapData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let fetchedItems = [];

      if (nearbyOnly && userLocation) {
        // Query nearby items based on geolocation
        const categoryParam = activeCategory === 'ALL' || activeCategory === 'DESTINATION' || activeCategory === 'HOTEL' ? null : activeCategory;
        const typeParam = activeCategory === 'DESTINATION' || activeCategory === 'HOTEL' ? activeCategory : (activeCategory === 'ALL' ? null : 'PLACE');

        fetchedItems = await mapApi.getNearby({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          radiusKm: selectedRadius,
          type: typeParam,
          category: categoryParam,
          limit: 50
        });
      } else {
        // Standard catalogue exploration
        const categoryParam = activeCategory === 'ALL' || activeCategory === 'DESTINATION' || activeCategory === 'HOTEL' ? null : activeCategory;
        const typeParam = activeCategory === 'DESTINATION' || activeCategory === 'HOTEL' ? activeCategory : (activeCategory === 'ALL' ? null : 'PLACE');

        fetchedItems = await mapApi.getItems({
          type: typeParam,
          category: categoryParam,
          query: debouncedQuery.trim() || undefined
        });

        // Also if user searched a text query, optionally query external geocoded spots
        if (debouncedQuery.trim().length >= 2) {
          try {
            const searchData = await mapApi.search(debouncedQuery.trim(), 5);
            setExternalResults(searchData.externalItems || []);
          } catch (searchEx) {
            setExternalResults([]);
          }
        } else {
          setExternalResults([]);
        }
      }

      setItems(fetchedItems);
      if (fetchedItems.length > 0 && !selectedItem) {
        setSelectedItem(fetchedItems[0]);
      }
    } catch (err) {
      console.error('Failed to load map points:', err);
      setError(err.message || 'Unable to load interactive map discovery. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [activeCategory, debouncedQuery, nearbyOnly, userLocation, selectedRadius]);

  useEffect(() => {
    loadMapData();
  }, [loadMapData]);

  // Browser Geolocation handler
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('unavailable');
      return;
    }

    setIsLocating(true);
    setLocationStatus(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        setUserLocation(coords);
        setLocationStatus('granted');
        setNearbyOnly(true);
        setIsLocating(false);
      },
      (geoError) => {
        setIsLocating(false);
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setLocationStatus('denied');
        } else {
          setLocationStatus('unavailable');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const handleClearLocation = () => {
    setUserLocation(null);
    setNearbyOnly(false);
    setLocationStatus(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Banner / Header */}
      <div className="bg-slate-900/90 border-b border-slate-800/90 px-4 sm:px-6 lg:px-8 py-4 backdrop-blur-md sticky top-16 sm:top-20 z-30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
                <Compass className="w-4 h-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Interactive <span className="text-teal-400">Map Discovery</span>
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Explore destinations, heritage wonders, and stays across India with live coordinates and nearby discovery.
            </p>
          </div>

          {/* Quick Search and Geolocation Actions */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Search Box */}
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search place or city..."
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-9 pr-8 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search text"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Geolocation Button */}
            <button
              onClick={userLocation ? handleClearLocation : handleRequestLocation}
              disabled={isLocating}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border shadow-sm ${
                userLocation
                  ? 'bg-teal-600 text-white border-teal-400 hover:bg-teal-500'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:border-slate-600'
              }`}
            >
              <Locate className={`w-4 h-4 ${isLocating ? 'animate-spin text-teal-400' : ''}`} />
              <span>{userLocation ? 'Near You (Active)' : 'Find Near Me'}</span>
            </button>
          </div>
        </div>

        {/* Location Notice / Permission Status Alert */}
        {locationStatus === 'denied' && !dismissedLocationBanner && (
          <div className="max-w-7xl mx-auto mt-3 bg-amber-950/40 border border-amber-800/60 rounded-xl px-4 py-2 flex items-center justify-between text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Location access was denied. You can continue exploring all TravelSphere destinations and places manually.
              </span>
            </div>
            <button
              onClick={() => setDismissedLocationBanner(true)}
              aria-label="Dismiss location message"
              className="text-amber-400 hover:text-amber-200 ml-4 font-bold"
            >
              &times;
            </button>
          </div>
        )}

        {/* Filters Row */}
        <div className="max-w-7xl mx-auto mt-3 flex items-center justify-between gap-3 flex-wrap">
          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                    isActive
                      ? 'bg-teal-500/20 text-teal-300 border-teal-500/50 shadow-sm'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Radius selector (shown when nearby mode is active) */}
          {userLocation && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Radius:</span>
              <div className="flex items-center gap-1">
                {RADIUS_OPTIONS.map((rad) => (
                  <button
                    key={rad.value}
                    onClick={() => setSelectedRadius(rad.value)}
                    className={`px-2 py-1 rounded text-[11px] font-bold border transition-colors ${
                      selectedRadius === rad.value
                        ? 'bg-teal-600 text-white border-teal-400'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    {rad.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mobile View Toggle */}
          <div className="md:hidden flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
            <button
              onClick={() => setMobileView('map')}
              className={`px-2.5 py-1 rounded font-medium ${mobileView === 'map' ? 'bg-teal-600 text-white' : 'text-slate-400'}`}
            >
              Map
            </button>
            <button
              onClick={() => setMobileView('list')}
              className={`px-2.5 py-1 rounded font-medium ${mobileView === 'list' ? 'bg-teal-600 text-white' : 'text-slate-400'}`}
            >
              List ({items.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex-1 w-full flex flex-col md:flex-row gap-5">
        {/* Left / Center Map Viewport */}
        <div className={`w-full md:w-3/5 lg:w-2/3 h-[500px] md:h-[calc(100vh-220px)] sticky top-44 ${mobileView === 'list' ? 'hidden md:block' : 'block'}`}>
          <TravelSphereMap
            items={items}
            selectedItem={selectedItem}
            userLocation={userLocation}
            onSelectItem={(item) => setSelectedItem(item)}
            onRequestLocation={handleRequestLocation}
            isLocating={isLocating}
            className="w-full h-full"
          />
        </div>

        {/* Right Discovery Sidebar / Card List */}
        <div className={`w-full md:w-2/5 lg:w-1/3 flex flex-col gap-4 overflow-y-auto ${mobileView === 'map' ? 'hidden md:flex' : 'flex'}`}>
          {/* Summary Header */}
          <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-xs font-bold text-slate-300">
              {loading ? 'Finding spots...' : `${items.length} ${items.length === 1 ? 'place' : 'places'} discovered`}
            </span>
            <button
              onClick={loadMapData}
              title="Refresh catalogue points"
              aria-label="Refresh catalogue points"
              className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 font-semibold"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-rose-950/50 border border-rose-800/80 rounded-xl p-4 text-xs text-rose-200">
              <p className="font-semibold">{error}</p>
              <button
                onClick={loadMapData}
                className="mt-2 text-teal-400 underline font-bold"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 animate-pulse flex gap-3">
                  <div className="w-20 h-20 bg-slate-800 rounded-lg shrink-0"></div>
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3 bg-slate-800 rounded w-1/3"></div>
                    <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-800 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && items.length === 0 && (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-3">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">No places match your criteria</h3>
              <p className="text-xs text-slate-400 mb-4">
                {nearbyOnly
                  ? `No spots found within ${selectedRadius} km of your location. Try selecting a larger search radius.`
                  : 'Try adjusting your search query or selecting a different category filter.'}
              </p>
              {nearbyOnly && (
                <button
                  onClick={() => setSelectedRadius(250)}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md"
                >
                  Expand Radius to 250 km
                </button>
              )}
            </div>
          )}

          {/* Item Cards */}
          {!loading && items.map((item) => {
            const isSelected = selectedItem && selectedItem.id === item.id;
            return (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedItem(item);
                  if (mobileView === 'list') setMobileView('map');
                }}
                className={`group cursor-pointer rounded-2xl p-3.5 border transition-all duration-200 ${
                  isSelected
                    ? 'bg-slate-800/90 border-teal-500/80 shadow-lg shadow-teal-500/10 ring-1 ring-teal-500/50'
                    : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                }`}
              >
                <div className="flex gap-3">
                  {/* Thumbnail */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-800 shrink-0 relative">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">
                        <MapPin className="w-6 h-6" />
                      </div>
                    )}
                    {item.rating && (
                      <div className="absolute bottom-1 right-1 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-bold text-amber-400">
                        ★ {item.rating}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                          {item.badgeText || item.type}
                        </span>
                        {item.distanceKm != null && (
                          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 px-1.5 py-0.5 rounded">
                            {item.distanceKm.toFixed(1)} km away
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-white truncate group-hover:text-teal-400 transition-colors">
                        {item.name}
                      </h4>
                      {item.destinationName && item.type !== 'DESTINATION' && (
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          {item.destinationName}
                        </p>
                      )}
                    </div>

                    {/* Footer / Actions */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60">
                      <span className="text-xs font-bold text-slate-200">
                        {item.price != null
                          ? (item.type === 'HOTEL' ? `₹${item.price.toLocaleString('en-IN')}/night` : (item.price > 0 ? `Fee: ₹${item.price}` : 'Free Entry'))
                          : 'Explore Hub'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setWeatherModalItem(item);
                          }}
                          title="Check Live Weather"
                          aria-label="Check live weather"
                          className="text-[11px] font-semibold text-amber-300 hover:text-amber-200 flex items-center gap-1 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/50 px-2 py-0.5 rounded-lg transition-colors"
                        >
                          <CloudSun className="w-3 h-3" /> Weather
                        </button>
                        {item.detailUrl && (
                          <Link
                            to={item.detailUrl}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1"
                          >
                            Details <ArrowRight className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* External Geocoded Results (clearly demarcated) */}
          {externalResults.length > 0 && (
            <div className="mt-4 border-t border-slate-800 pt-4">
              <div className="flex items-center gap-1.5 mb-2.5">
                <Navigation className="w-3.5 h-3.5 text-sky-400" />
                <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                  OpenStreetMap Places & Geographic Results
                </h4>
              </div>
              <div className="space-y-2">
                {externalResults.map((ext) => (
                  <div
                    key={ext.placeId}
                    className="bg-slate-900/40 border border-slate-800 p-2.5 rounded-xl text-xs flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">{ext.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{ext.displayName}</p>
                    </div>
                    <span className="text-[10px] text-slate-500 uppercase shrink-0 border border-slate-700 px-1.5 py-0.5 rounded">
                      {ext.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Weather Modal Drawer */}
      {weatherModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <CloudSun className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">{weatherModalItem.name}</h3>
                  <p className="text-xs text-slate-400">Live Weather & 5-Day Forecast</p>
                </div>
              </div>
              <button
                onClick={() => setWeatherModalItem(null)}
                aria-label="Close weather modal"
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <DestinationWeatherCard
              destinationId={weatherModalItem.type === 'DESTINATION' ? weatherModalItem.itemId : null}
              destinationName={weatherModalItem.name}
              latitude={weatherModalItem.latitude ? parseFloat(weatherModalItem.latitude) : null}
              longitude={weatherModalItem.longitude ? parseFloat(weatherModalItem.longitude) : null}
              climateFallback={weatherModalItem.metadata?.climate}
            />

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setWeatherModalItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExploreMap;
