import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import hotelApi from '../services/hotelApi';
import RoomCard from '../components/RoomCard';
import HotelBookingModal from '../components/HotelBookingModal';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { handleImageError } from '../utils/imageFallback';
import { formatCurrency } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import WishlistButton from '../components/WishlistButton';
import ReviewSection from '../components/ReviewSection';
import { 
  Hotel, 
  MapPin, 
  Star, 
  Wifi, 
  Waves, 
  Car, 
  Utensils, 
  Phone, 
  Mail, 
  ChevronLeft, 
  BedDouble,
  Info
} from 'lucide-react';

export const HotelDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState(null);

  const fetchHotelData = async () => {
    setLoading(true);
    setError(null);
    try {
      const hotelData = await hotelApi.getHotelById(id);
      setHotel(hotelData);

      // Fetch rooms
      const roomsData = await hotelApi.getRoomsByHotel(id);
      setRooms(roomsData || []);
    } catch (err) {
      setError(err.message || 'Unable to retrieve hotel details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotelData();
  }, [id]);

  const handleBookRoom = (room) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
    } else {
      setSelectedRoomForBooking(room);
    }
  };

  if (loading) {
    return <LoadingState type="detail" />;
  }

  if (error || !hotel) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <ErrorState
          title="Hotel Not Found"
          message={error || "We couldn't retrieve the requested hotel information."}
          onRetry={fetchHotelData}
        />
        <div className="text-center mt-6">
          <Link
            to="/hotels"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-800"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Hotels
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Breadcrumb Navigation */}
      <div className="mb-6">
        <Link
          to="/hotels"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-teal-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Hotels Directory
        </Link>
      </div>

      {/* Hero Gallery & Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Main Hotel Image */}
        <div className="lg:col-span-2 rounded-3xl overflow-hidden bg-slate-100 h-[360px] sm:h-[420px] shadow-sm relative">
          <img
            src={hotel.heroImageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'}
            alt={hotel.name}
            onError={(e) => handleImageError(e, 'hotel')}
            className="w-full h-full object-cover object-center"
          />
          {hotel.starRating && (
            <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full text-sm font-bold text-slate-900 flex items-center gap-1.5 shadow-md">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
              <span>{Number(hotel.starRating).toFixed(1)} Star Property</span>
            </div>
          )}

          <WishlistButton
            targetType="HOTEL"
            targetId={hotel.id}
            size="md"
            className="absolute top-4 right-4"
          />
        </div>

        {/* Hotel Info Box */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 flex flex-col justify-between shadow-sm">
          <div>
            {hotel.destinationName && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 uppercase tracking-wider mb-2">
                <MapPin className="w-4 h-4 text-teal-600" />
                <span>{hotel.destinationName}</span>
              </div>
            )}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
              {hotel.name}
            </h1>

            {hotel.address && (
              <p className="text-slate-500 text-xs sm:text-sm mb-6 leading-relaxed">
                {hotel.address}
              </p>
            )}

            {/* Amenities Grid */}
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Key Amenities</h3>
              <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-700">
                {hotel.hasWifi && (
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl">
                    <Wifi className="w-4 h-4 text-teal-600" />
                    <span>Free Wi-Fi</span>
                  </div>
                )}
                {hotel.hasSwimmingPool && (
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl">
                    <Waves className="w-4 h-4 text-cyan-600" />
                    <span>Pool Facility</span>
                  </div>
                )}
                {hotel.hasRestaurant && (
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl">
                    <Utensils className="w-4 h-4 text-orange-600" />
                    <span>Fine Dining</span>
                  </div>
                )}
                {hotel.hasParking && (
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl">
                    <Car className="w-4 h-4 text-slate-600" />
                    <span>Parking Area</span>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Details */}
            {(hotel.contactPhone || hotel.contactEmail) && (
              <div className="text-xs text-slate-500 space-y-1.5 pt-4 border-t border-slate-100">
                {hotel.contactPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{hotel.contactPhone}</span>
                  </div>
                )}
                {hotel.contactEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{hotel.contactEmail}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-100 mt-6 flex items-center justify-between gap-4">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-medium">Starting from</span>
              <span className="text-2xl font-black text-slate-900">
                {formatCurrency(hotel.startingPricePerNight)}
              </span>
              <span className="text-xs text-slate-500"> / night</span>
            </div>

            <WishlistButton
              targetType="HOTEL"
              targetId={hotel.id}
              variant="button"
            />
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 mb-12 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-4">About this Property</h2>
        <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
          {hotel.description || 'Welcome to a serene retreat offering luxurious accommodations, personalized hospitality, and premium comfort for both leisure and business travelers.'}
        </p>
      </div>

      {/* Room Inventory Section */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-700 mb-1">
              <BedDouble className="w-4 h-4 text-teal-600" />
              <span>Available Configurations</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Available Rooms & Suites</h2>
          </div>
        </div>

        {rooms.length === 0 ? (
          <EmptyState
            icon={BedDouble}
            title="No rooms published"
            message="Room types for this property are currently being updated by the property manager."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <RoomCard 
                key={room.id} 
                room={room} 
                onBookRoom={handleBookRoom}
              />
            ))}
          </div>
        )}
      </div>

      {/* Hotel Reviews & Ratings Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-sm mb-12">
        <ReviewSection
          targetType="HOTEL"
          targetId={hotel.id}
          targetName={hotel.name}
        />
      </div>

      {/* Room Booking Modal */}
      {selectedRoomForBooking && (
        <HotelBookingModal
          hotel={hotel}
          room={selectedRoomForBooking}
          isOpen={!!selectedRoomForBooking}
          onClose={() => setSelectedRoomForBooking(null)}
        />
      )}
    </div>
  );
};

export default HotelDetails;
