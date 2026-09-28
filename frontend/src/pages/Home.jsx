import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HeroSection } from '../components/HeroSection';
import { DestinationCard } from '../components/DestinationCard';
import { PlaceCard } from '../components/PlaceCard';
import { HotelCard } from '../components/HotelCard';
import { PackageCard } from '../components/PackageCard';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import destinationApi from '../services/destinationApi';
import placeApi from '../services/placeApi';
import hotelApi from '../services/hotelApi';
import packageApi from '../services/packageApi';
import { 
  Compass, 
  MapPin, 
  Hotel, 
  Luggage, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Headphones, 
  Sparkles 
} from 'lucide-react';

export const Home = () => {
  const [destinations, setDestinations] = useState([]);
  const [places, setPlaces] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [packages, setPackages] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadHomeData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [destRes, placesRes, hotelsRes, pkgRes] = await Promise.allSettled([
        destinationApi.getDestinations({ page: 0, size: 3 }),
        placeApi.getPlaces({ page: 0, size: 3 }),
        hotelApi.getHotels({ page: 0, size: 3, sort: 'rating_desc' }),
        packageApi.getPackages({ page: 0, size: 3, sort: 'price_asc' })
      ]);

      if (destRes.status === 'fulfilled' && destRes.value?.content) {
        setDestinations(destRes.value.content);
      }
      if (placesRes.status === 'fulfilled' && placesRes.value?.content) {
        setPlaces(placesRes.value.content);
      }
      if (hotelsRes.status === 'fulfilled' && hotelsRes.value?.content) {
        setHotels(hotelsRes.value.content);
      }
      if (pkgRes.status === 'fulfilled' && pkgRes.value?.content) {
        setPackages(pkgRes.value.content);
      }

      // Check if all failed
      if (
        destRes.status === 'rejected' &&
        placesRes.status === 'rejected' &&
        hotelsRes.status === 'rejected' &&
        pkgRes.status === 'rejected'
      ) {
        throw new Error('Could not connect to TravelSphere server. Please ensure the backend is running.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHomeData();
  }, []);

  const heroImage = destinations[0]?.heroImageUrl;

  return (
    <div className="flex flex-col">
      {/* 1. Hero Section & Universal Discovery */}
      <HeroSection heroImage={heroImage} />

      {/* Global Error Banner if server unreachable */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 w-full">
          <ErrorState
            title="Catalogue Service Offline"
            message={error}
            onRetry={loadHomeData}
          />
        </div>
      )}

      {/* 2. Featured Destinations */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-700 mb-2">
              <Compass className="w-4 h-4 text-teal-600" />
              <span>Trending Getaways</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Featured Destinations
            </h2>
            <p className="text-slate-500 text-sm mt-1 max-w-lg">
              Explore hand-selected cities, coastal escapes, and heritage landscapes across the subcontinent.
            </p>
          </div>
          <Link
            to="/destinations"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-800 transition-colors mt-4 md:mt-0"
          >
            <span>View all destinations</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <LoadingState count={3} />
        ) : destinations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {destinations.map((dest) => (
              <DestinationCard key={dest.id} destination={dest} />
            ))}
          </div>
        ) : (
          <p className="text-center text-slate-500 py-8 text-sm">No destinations published yet.</p>
        )}
      </section>

      {/* 3. Popular Places to Visit */}
      <section className="bg-slate-100/70 border-y border-slate-200/70 py-16 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-700 mb-2">
                <MapPin className="w-4 h-4 text-teal-600" />
                <span>Must-See Attractions</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Popular Places & Sights
              </h2>
              <p className="text-slate-500 text-sm mt-1 max-w-lg">
                Iconic forts, serene temples, scenic viewpoints, and vibrant cultural landmarks.
              </p>
            </div>
            <Link
              to="/places"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-800 transition-colors mt-4 md:mt-0"
            >
              <span>Explore all places</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <LoadingState count={3} />
          ) : places.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {places.map((place) => (
                <PlaceCard key={place.id} place={place} />
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-500 py-8 text-sm">No attractions registered yet.</p>
          )}
        </div>
      </section>

      {/* 4. Featured Hotels & Stays */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-700 mb-2">
              <Hotel className="w-4 h-4 text-teal-600" />
              <span>Hospitality & Comfort</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Top Rated Stays
            </h2>
            <p className="text-slate-500 text-sm mt-1 max-w-lg">
              Luxury retreats, boutique heritage havelis, and beachfront resorts vetted for quality.
            </p>
          </div>
          <Link
            to="/hotels"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-800 transition-colors mt-4 md:mt-0"
          >
            <span>Browse all hotels</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <LoadingState count={3} />
        ) : hotels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {hotels.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} />
            ))}
          </div>
        ) : (
          <p className="text-center text-slate-500 py-8 text-sm">No hotels registered yet.</p>
        )}
      </section>

      {/* 5. Popular Travel Packages */}
      <section className="bg-slate-900 text-white py-16 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-400 mb-2">
                <Luggage className="w-4 h-4" />
                <span>Curated Experiences</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Featured Holiday Packages
              </h2>
              <p className="text-slate-400 text-sm mt-1 max-w-lg">
                Complete travel packages including accommodation, sightseeing itineraries, and daily logistics.
              </p>
            </div>
            <Link
              to="/packages"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-400 hover:text-teal-300 transition-colors mt-4 md:mt-0"
            >
              <span>Explore all packages</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <LoadingState count={3} />
          ) : packages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {packages.map((pkg) => (
                <PackageCard key={pkg.id} travelPackage={pkg} />
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-400 py-8 text-sm">No packages available at this time.</p>
          )}
        </div>
      </section>

      {/* 6. Why TravelSphere */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-700 mb-2">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>The TravelSphere Difference</span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Why Discerning Travelers Choose Us
          </h2>
          <p className="text-slate-500 text-sm mt-2">
            Everything you need for seamless discovery, curated itineraries, and dependable stays.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow text-center sm:text-left">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-5 mx-auto sm:mx-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Verified Catalogue</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Every hotel, heritage site, and activity listed is verified for authentic pricing, amenities, and room availability.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow text-center sm:text-left">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-5 mx-auto sm:mx-0">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Real-Time Search</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Instantly filter by destination, budget, star rating, and travel tier to discover the exact experience you want.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow text-center sm:text-left">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-5 mx-auto sm:mx-0">
              <Headphones className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Expert Itineraries</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Day-by-day itineraries organized with transparent meal inclusions and sightseeing timelines.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Call-to-action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 w-full">
        <div className="bg-gradient-to-r from-brand-navy via-slate-900 to-teal-950 rounded-3xl p-8 sm:p-14 text-white text-center shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-5">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Ready to embark on your next journey?
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Join thousands of travelers planning their dream holidays with TravelSphere. Browse curated destinations and unlock personalized itineraries.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/destinations"
                className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-teal-500/20"
              >
                Start Exploring
              </Link>
              <Link
                to="/register"
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold rounded-xl text-sm transition-colors"
              >
                Create Free Account
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
