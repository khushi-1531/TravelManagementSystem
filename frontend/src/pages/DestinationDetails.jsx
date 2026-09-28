import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import destinationApi from '../services/destinationApi';
import PlaceCard from '../components/PlaceCard';
import HotelCard from '../components/HotelCard';
import PackageCard from '../components/PackageCard';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import DestinationWeatherCard from '../components/DestinationWeatherCard';
import WishlistButton from '../components/WishlistButton';
import ReviewSection from '../components/ReviewSection';
import { handleImageError } from '../utils/imageFallback';
import { 
  MapPin, 
  Sun, 
  CloudSun, 
  Landmark, 
  Hotel, 
  Luggage, 
  ChevronLeft, 
  Sparkles,
  Compass,
  MessageSquare
} from 'lucide-react';

export const DestinationDetails = () => {
  const { id } = useParams();

  const [destination, setDestination] = useState(null);
  const [places, setPlaces] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [packages, setPackages] = useState([]);

  const [activeTab, setActiveTab] = useState('places');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDestinationData = async () => {
    setLoading(true);
    setError(null);
    try {
      const destData = await destinationApi.getDestinationById(id);
      setDestination(destData);

      // Load associated places, hotels, and packages
      const [placesRes, hotelsRes, pkgRes] = await Promise.allSettled([
        destinationApi.getPlacesByDestination(id),
        destinationApi.getHotelsByDestination(id),
        destinationApi.getPackagesByDestination(id)
      ]);

      if (placesRes.status === 'fulfilled') setPlaces(placesRes.value || []);
      if (hotelsRes.status === 'fulfilled') setHotels(hotelsRes.value || []);
      if (pkgRes.status === 'fulfilled') setPackages(pkgRes.value || []);
    } catch (err) {
      setError(err.message || 'Unable to load destination details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDestinationData();
  }, [id]);

  if (loading) {
    return <LoadingState type="detail" />;
  }

  if (error || !destination) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <ErrorState
          title="Destination Not Found"
          message={error || "We couldn't retrieve the requested destination details."}
          onRetry={fetchDestinationData}
        />
        <div className="text-center mt-6">
          <Link
            to="/destinations"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-800"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to All Destinations
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      {/* 1. Hero Banner */}
      <div className="relative h-[380px] sm:h-[450px] bg-slate-900 overflow-hidden">
        <img
          src={destination.heroImageUrl || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80'}
          alt={destination.name}
          onError={(e) => handleImageError(e, 'destination')}
          className="w-full h-full object-cover object-center brightness-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-black/30" />

        <div className="absolute inset-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-between py-6 sm:py-8">
          {/* Back Navigation & Wishlist Action */}
          <div className="flex items-center justify-between">
            <Link
              to="/destinations"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-white/90 hover:text-white bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl transition-colors w-fit"
            >
              <ChevronLeft className="w-4 h-4" />
              All Destinations
            </Link>

            <WishlistButton
              targetType="DESTINATION"
              targetId={destination.id}
              size="md"
            />
          </div>

          {/* Title & Metadata */}
          <div className="text-white space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-teal-300 bg-teal-900/60 backdrop-blur-md px-2.5 py-1 rounded-lg">
                <MapPin className="w-3.5 h-3.5" />
                {destination.state ? `${destination.state}, ${destination.country}` : destination.country}
              </span>
              {destination.isFeatured && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-300 bg-amber-900/60 backdrop-blur-md px-2.5 py-1 rounded-lg">
                  <Sparkles className="w-3.5 h-3.5" /> Featured
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight">{destination.name}</h1>
          </div>
        </div>
      </div>

      {/* 2. Destination Highlights Bar */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-sm">
            <div className="lg:col-span-2 space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 mb-2">About {destination.name}</h2>
                <p className="text-slate-600 leading-relaxed text-sm">
                  {destination.description || 'Experience the vibrant atmosphere, rich cultural sights, and scenic landscapes in this premier destination.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {destination.climate && (
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center gap-2.5 text-xs text-slate-700">
                    <CloudSun className="w-4 h-4 text-teal-600 shrink-0" />
                    <div>
                      <span className="text-slate-400 block font-medium">Regional Climate:</span>
                      <strong className="text-slate-800">{destination.climate}</strong>
                    </div>
                  </div>
                )}

                {destination.bestTimeToVisit && (
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center gap-2.5 text-xs text-slate-700">
                    <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                    <div>
                      <span className="text-slate-400 block font-medium">Recommended Season:</span>
                      <strong className="text-slate-800">{destination.bestTimeToVisit}</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-1">
              <DestinationWeatherCard
                destinationId={destination.id}
                destinationName={destination.name}
                latitude={destination.latitude}
                longitude={destination.longitude}
                climateFallback={destination.climate}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Section Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('places')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-colors ${
              activeTab === 'places'
                ? 'bg-brand-navy text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Landmark className="w-4 h-4" />
            Places to Visit ({places.length})
          </button>

          <button
            onClick={() => setActiveTab('hotels')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-colors ${
              activeTab === 'hotels'
                ? 'bg-brand-navy text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Hotel className="w-4 h-4" />
            Hotels & Stays ({hotels.length})
          </button>

          <button
            onClick={() => setActiveTab('packages')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-colors ${
              activeTab === 'packages'
                ? 'bg-brand-navy text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Luggage className="w-4 h-4" />
            Holiday Packages ({packages.length})
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-colors ${
              activeTab === 'reviews'
                ? 'bg-brand-navy text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Reviews & Ratings
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'places' && (
          <div>
            {places.length === 0 ? (
              <EmptyState
                icon={Landmark}
                title="No attractions listed"
                message={`No specific places or monuments are registered under ${destination.name} yet.`}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {places.map((place) => (
                  <PlaceCard key={place.id} place={place} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'hotels' && (
          <div>
            {hotels.length === 0 ? (
              <EmptyState
                icon={Hotel}
                title="No hotels listed"
                message={`No hotels are currently affiliated with ${destination.name}.`}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hotels.map((hotel) => (
                  <HotelCard key={hotel.id} hotel={hotel} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'packages' && (
          <div>
            {packages.length === 0 ? (
              <EmptyState
                icon={Luggage}
                title="No packages available"
                message={`No holiday packages are configured for ${destination.name} right now.`}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {packages.map((pkg) => (
                  <PackageCard key={pkg.id} travelPackage={pkg} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="max-w-4xl mx-auto">
            <ReviewSection
              targetType="DESTINATION"
              targetId={destination.id}
              targetName={destination.name}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DestinationDetails;
