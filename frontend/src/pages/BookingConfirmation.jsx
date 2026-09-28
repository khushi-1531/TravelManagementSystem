import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import bookingApi from '../services/bookingApi';
import LoadingState from '../components/LoadingState';
import { formatCurrency, formatDate } from '../utils/formatters';
import { 
  CheckCircle2, 
  CalendarCheck, 
  ArrowRight, 
  Luggage, 
  Hotel, 
  Calendar, 
  Users, 
  CreditCard, 
  Compass, 
  Info 
} from 'lucide-react';

export const BookingConfirmation = () => {
  const { id } = useParams();
  const location = useLocation();

  const [booking, setBooking] = useState(location.state?.booking || null);
  const [loading, setLoading] = useState(!booking);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!booking && id) {
      bookingApi.getBookingById(id)
        .then((data) => setBooking(data))
        .catch((err) => setError(err.message || 'Unable to retrieve booking confirmation.'))
        .finally(() => setLoading(false));
    }
  }, [id, booking]);

  if (loading) {
    return <LoadingState type="detail" />;
  }

  if (error || !booking) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Booking Confirmation</h2>
        <p className="text-slate-600 text-sm mb-6">{error || 'Booking information not available.'}</p>
        <Link
          to="/bookings"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-navy text-white text-xs font-semibold rounded-xl"
        >
          View My Bookings
        </Link>
      </div>
    );
  }

  const isPackage = booking.bookingType === 'PACKAGE';
  const packageItem = isPackage && booking.packageItems?.[0];
  const hotelItem = !isPackage && booking.hotelItems?.[0];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 w-full">
      {/* Confirmation Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden text-center p-8 sm:p-10">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-5 shadow-sm">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-bold uppercase tracking-wider mb-3">
          <Compass className="w-3.5 h-3.5" />
          <span>TravelSphere Reservation Confirmed</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
          Your Booking is Registered!
        </h1>
        <p className="text-slate-500 text-sm max-w-md mx-auto mb-8">
          Thank you for choosing TravelSphere. Your reservation reference code has been generated and your inventory has been secured.
        </p>

        {/* Reference Badge */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-6 mb-8 max-w-md mx-auto text-center space-y-1">
          <span className="text-xs uppercase tracking-widest text-slate-400 font-bold block">
            Confirmation Reference
          </span>
          <span className="text-2xl sm:text-3xl font-mono font-black text-brand-navy tracking-wider block">
            {booking.bookingReference}
          </span>
          <span className="text-xs text-slate-500 block pt-1">
            Status: <strong className="text-emerald-700 font-bold">{booking.status}</strong>
          </span>
        </div>

        {/* Reservation details summary */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-6 text-left space-y-4 mb-8">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <span className="text-xs text-slate-400 font-medium block">
                {isPackage ? 'Package Itinerary' : 'Hotel Reservation'}
              </span>
              <h3 className="text-base font-bold text-slate-900">
                {isPackage ? packageItem?.packageTitle : hotelItem?.hotelName}
              </h3>
            </div>
            <span className="text-sm font-extrabold text-teal-900">
              {formatCurrency(booking.totalAmount)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
              <span>
                {isPackage
                  ? `Travel Date: ${formatDate(packageItem?.startDate)}`
                  : `${formatDate(hotelItem?.checkInDate)} to ${formatDate(hotelItem?.checkOutDate)}`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-600 shrink-0" />
              <span>
                {isPackage
                  ? `${packageItem?.guestsCount || 1} Travelers`
                  : `${hotelItem?.roomsCount || 1} Room(s) • ${hotelItem?.guestsCount || 1} Guests`}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Action or Confirmation Notice */}
        {booking.paymentStatus !== 'PAID' ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8 text-left space-y-3">
            <div className="flex items-start gap-3 text-xs sm:text-sm text-amber-900">
              <CreditCard className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block text-amber-950 mb-0.5">Payment Pending:</strong>
                <span>
                  Your reservation inventory is secured. Complete online payment now to confirm your trip and receive immediate confirmation.
                </span>
              </div>
            </div>

            <div className="pt-2 text-center sm:text-left">
              <Link
                to={`/bookings/${booking.id}/payment`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-teal-600/20 transition-all hover:shadow-lg"
              >
                <CreditCard className="w-4 h-4" />
                <span>Complete Payment Now ({formatCurrency(booking.totalAmount)})</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-left flex items-start gap-3 mb-8 text-xs text-emerald-900">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block mb-0.5">Payment Verified:</strong>
              <span>This booking is fully paid and confirmed.</span>
            </div>
          </div>
        )}

        {/* Navigation CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/bookings"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-navy hover:bg-slate-800 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-colors"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Go to My Bookings</span>
          </Link>

          <Link
            to={`/bookings/${booking.id}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs sm:text-sm transition-colors"
          >
            <span>View Full Details</span>
          </Link>

          <Link
            to="/destinations"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs sm:text-sm transition-colors"
          >
            <span>Explore More Places</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
