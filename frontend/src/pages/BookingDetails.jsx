import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import bookingApi from '../services/bookingApi';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { formatCurrency, formatDate } from '../utils/formatters';
import { 
  ChevronLeft, 
  CalendarCheck, 
  Luggage, 
  Hotel, 
  Calendar, 
  Users, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  ShieldCheck, 
  Loader2,
  CreditCard 
} from 'lucide-react';

export const BookingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);

  const fetchBooking = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bookingApi.getBookingById(id);
      setBooking(data);
    } catch (err) {
      setError(err.message || 'Unable to retrieve booking details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const handleCancelBooking = async () => {
    setIsCancelling(true);
    setCancelError(null);
    try {
      const updated = await bookingApi.cancelBooking(id);
      setBooking(updated);
      setShowCancelModal(false);
    } catch (err) {
      setCancelError(err.message || 'Unable to cancel this booking.');
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading) {
    return <LoadingState type="detail" />;
  }

  if (error || !booking) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <ErrorState
          title="Booking Not Found"
          message={error || "We couldn't retrieve this booking reservation."}
          onRetry={fetchBooking}
        />
        <div className="text-center mt-6">
          <Link
            to="/bookings"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-800"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to My Bookings
          </Link>
        </div>
      </div>
    );
  }

  const isPackage = booking.bookingType === 'PACKAGE';
  const packageItem = isPackage && booking.packageItems?.[0];
  const hotelItem = !isPackage && booking.hotelItems?.[0];
  const canCancel = booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      {/* Back button */}
      <div className="mb-6">
        <Link
          to="/bookings"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-teal-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to My Bookings
        </Link>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden mb-8">
        {/* Top Reference Bar */}
        <div className="bg-brand-navy p-6 sm:p-8 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-300">
                Reservation Summary
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-xs text-slate-300">Booked on {formatDate(booking.createdAt)}</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black">{booking.bookingReference}</h1>
              <span className="bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold px-2.5 py-0.5 rounded-full">
                {booking.bookingType}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:items-end">
            <span className="text-xs text-slate-400">Current Status</span>
            <span className={`text-sm font-extrabold mt-0.5 ${
              booking.status === 'CONFIRMED' ? 'text-emerald-400' :
              booking.status === 'CANCELLED' ? 'text-rose-400' : 'text-amber-300'
            }`}>
              {booking.status}
            </span>
          </div>
        </div>

        {/* Breakdown Body */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Reservation Items Details */}
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              {isPackage ? <Luggage className="w-5 h-5 text-teal-600" /> : <Hotel className="w-5 h-5 text-teal-600" />}
              <span>{isPackage ? 'Package Tour Itinerary' : 'Hotel Stay Details'}</span>
            </h2>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {isPackage ? packageItem?.packageTitle : hotelItem?.hotelName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isPackage ? packageItem?.destinationName : `${hotelItem?.roomType} • ${hotelItem?.destinationName || ''}`}
                  </p>
                </div>
                {isPackage && packageItem?.tier && (
                  <span className="text-xs font-bold text-teal-800 bg-teal-100 px-3 py-1 rounded-full w-fit">
                    {packageItem.tier} TIER
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
                  <div>
                    <span className="text-slate-400 block">Dates</span>
                    <strong className="text-slate-800 text-sm">
                      {isPackage
                        ? `Starts ${formatDate(packageItem?.startDate)}`
                        : `${formatDate(hotelItem?.checkInDate)} to ${formatDate(hotelItem?.checkOutDate)}`}
                    </strong>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-teal-600 shrink-0" />
                  <div>
                    <span className="text-slate-400 block">Guests & Occupancy</span>
                    <strong className="text-slate-800 text-sm">
                      {isPackage
                        ? `${packageItem?.guestsCount || 1} Travelers`
                        : `${hotelItem?.roomsCount || 1} Room(s) • ${hotelItem?.guestsCount || 1} Guests`}
                    </strong>
                  </div>
                </div>
              </div>

              {booking.customerNotes && (
                <div className="pt-3 border-t border-slate-200 text-xs text-slate-600">
                  <span className="font-semibold text-slate-700 block mb-0.5">Special Requests:</span>
                  <p className="italic bg-white p-2.5 rounded-xl border border-slate-200">
                    "{booking.customerNotes}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Pricing Summary */}
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              <span>Invoice & Payment Status</span>
            </h2>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600">
                <span>
                  {isPackage 
                    ? `Rate per Person (${packageItem?.guestsCount || 1} travelers)`
                    : `Room Rate (${hotelItem?.roomsCount || 1} rooms × ${hotelItem?.totalNights || 1} nights)`}
                </span>
                <span className="font-medium text-slate-900">
                  {formatCurrency(isPackage ? packageItem?.unitPrice : hotelItem?.pricePerNight)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600">
                <span>Taxes & Administrative Fees</span>
                <span className="text-emerald-700 font-medium">Included</span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-sm sm:text-base font-bold text-slate-900">Total Confirmed Amount</span>
                <span className="text-xl sm:text-2xl font-black text-teal-800">
                  {formatCurrency(booking.totalAmount)}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500">Payment Status:</span>
                {booking.paymentStatus === 'PAID' || booking.status === 'CONFIRMED' ? (
                  <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>PAID & CONFIRMED</span>
                  </span>
                ) : (
                  <span className="font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>PAYMENT PENDING</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Link
                to="/bookings"
                className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Back to My Bookings
              </Link>

              {booking.paymentStatus !== 'PAID' && booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
                <Link
                  to={`/bookings/${booking.id}/payment`}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-teal-600/20 inline-flex items-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Proceed to Payment</span>
                </Link>
              )}
            </div>

            {canCancel && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl transition-colors"
              >
                Cancel This Booking
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Cancellation */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-slate-900">Cancel Reservation?</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Are you sure you want to cancel booking <strong>{booking.bookingReference}</strong>? This action will release the reserved inventory.
              </p>
            </div>

            {cancelError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {cancelError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
                className="px-4 py-2 border border-slate-200 text-xs font-semibold rounded-xl text-slate-700 hover:bg-slate-50"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleCancelBooking}
                disabled={isCancelling}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm disabled:opacity-60"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <span>Yes, Cancel Booking</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingDetails;
