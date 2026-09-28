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
  Compass,
  CreditCard,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export const PaymentSuccess = () => {
  const { id } = useParams();
  const location = useLocation();

  const [booking, setBooking] = useState(location.state?.booking || null);
  const [verification, setVerification] = useState(location.state?.verification || null);
  const [loading, setLoading] = useState(!booking);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!booking && id) {
      bookingApi.getBookingById(id)
        .then((data) => setBooking(data))
        .catch((err) => setError(err.message || 'Unable to load booking details.'))
        .finally(() => setLoading(false));
    }
  }, [id, booking]);

  if (loading) {
    return <LoadingState type="detail" />;
  }

  if (error || !booking) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Payment Verification</h2>
        <p className="text-slate-600 text-sm mb-6">{error || 'Booking details could not be found.'}</p>
        <Link
          to="/bookings"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-navy text-white text-xs font-semibold rounded-xl"
        >
          Go to My Bookings
        </Link>
      </div>
    );
  }

  const isPackage = booking.bookingType === 'PACKAGE';
  const packageItem = isPackage && booking.packageItems?.[0];
  const hotelItem = !isPackage && booking.hotelItems?.[0];
  const paymentId = verification?.paymentId || 'Verified Online';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 w-full">
      {/* Success Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden text-center p-8 sm:p-12 relative">
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-md animate-in zoom-in-90 duration-300">
          <CheckCircle2 className="w-11 h-11" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Payment Verified & Confirmed</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">
          Payment Successful!
        </h1>
        <p className="text-slate-500 text-sm max-w-md mx-auto mb-8">
          Your transaction has been cryptographically verified and your reservation is now officially confirmed.
        </p>

        {/* Verification Summary Badge */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-6 mb-8 max-w-lg mx-auto text-left grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
              Booking Reference
            </span>
            <span className="text-lg font-mono font-bold text-brand-navy block mt-0.5">
              {booking.bookingReference}
            </span>
          </div>

          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
              Payment Transaction ID
            </span>
            <span className="text-xs font-mono font-semibold text-slate-700 block truncate mt-1">
              {paymentId}
            </span>
          </div>

          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
              Amount Paid
            </span>
            <span className="text-lg font-black text-teal-900 block mt-0.5">
              {formatCurrency(booking.totalAmount)}
            </span>
          </div>

          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
              Reservation Status
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-full mt-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>CONFIRMED</span>
            </span>
          </div>
        </div>

        {/* Itinerary / Hotel Summary */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-6 text-left space-y-3 mb-8 max-w-lg mx-auto">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <div>
              <span className="text-[11px] text-slate-400 font-medium block uppercase tracking-wider">
                {isPackage ? 'Package Experience' : 'Hotel Stay'}
              </span>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {isPackage ? packageItem?.packageTitle : hotelItem?.hotelName}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                PAID
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>
                {isPackage
                  ? formatDate(packageItem?.startDate)
                  : `${formatDate(hotelItem?.checkInDate)} to ${formatDate(hotelItem?.checkOutDate)}`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>
                {isPackage
                  ? `${packageItem?.guestsCount || 1} Travelers`
                  : `${hotelItem?.roomsCount || 1} Room(s) • ${hotelItem?.guestsCount || 1} Guests`}
              </span>
            </div>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to={`/bookings/${id}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-navy hover:bg-slate-800 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-colors"
          >
            <span>View Booking Details</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/bookings"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs sm:text-sm transition-colors"
          >
            <CalendarCheck className="w-4 h-4 text-teal-600" />
            <span>My Bookings</span>
          </Link>

          <Link
            to="/destinations"
            className="inline-flex items-center gap-2 px-6 py-3 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold rounded-xl text-xs sm:text-sm transition-colors"
          >
            <Compass className="w-4 h-4 text-teal-600" />
            <span>Discover More Destinations</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
