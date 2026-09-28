import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import bookingApi from '../services/bookingApi';
import LoadingState from '../components/LoadingState';
import { formatCurrency } from '../utils/formatters';
import {
  AlertTriangle,
  RotateCcw,
  CalendarCheck,
  ChevronLeft,
  ShieldAlert,
  HelpCircle,
  ArrowRight
} from 'lucide-react';

export const PaymentFailure = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(location.state?.booking || null);
  const [errorMessage, setErrorMessage] = useState(
    location.state?.error || 'The payment could not be completed or was cancelled.'
  );
  const [loading, setLoading] = useState(!booking);

  useEffect(() => {
    if (!booking && id) {
      bookingApi.getBookingById(id)
        .then((data) => setBooking(data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [id, booking]);

  if (loading) {
    return <LoadingState type="detail" />;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-14 w-full">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden text-center p-8 sm:p-12">
        <div className="w-20 h-20 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-6 shadow-md">
          <AlertTriangle className="w-10 h-10" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-50 text-rose-800 text-xs font-bold uppercase tracking-wider mb-3">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
          <span>Payment Not Completed</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
          Unable to Process Payment
        </h1>
        <p className="text-slate-500 text-sm max-w-md mx-auto mb-8">
          Your reservation has not been confirmed yet, but your inventory selection has been preserved. You can safely retry without re-entering your travel preferences.
        </p>

        {/* Diagnostic Card */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 mb-8 max-w-md mx-auto text-left space-y-2">
          {booking && (
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
              <span className="text-slate-400 font-semibold uppercase tracking-wider">Booking Ref</span>
              <span className="font-mono font-bold text-slate-800">{booking.bookingReference}</span>
            </div>
          )}

          {booking?.totalAmount && (
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
              <span className="text-slate-400 font-semibold uppercase tracking-wider">Amount Due</span>
              <span className="font-extrabold text-teal-900">{formatCurrency(booking.totalAmount)}</span>
            </div>
          )}

          <div className="pt-1">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold">
              Notice / Reason
            </span>
            <p className="text-xs text-rose-800 font-medium mt-0.5">
              {errorMessage}
            </p>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => navigate(`/bookings/${id}/payment`)}
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all shadow-teal-600/20 hover:shadow-lg"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retry Payment Now</span>
          </button>

          <Link
            to={`/bookings/${id}`}
            className="inline-flex items-center gap-2 px-5 py-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs sm:text-sm transition-colors"
          >
            <span>View Booking</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/bookings"
            className="inline-flex items-center gap-2 px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs sm:text-sm transition-colors"
          >
            <CalendarCheck className="w-4 h-4 text-slate-600" />
            <span>My Bookings</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailure;
