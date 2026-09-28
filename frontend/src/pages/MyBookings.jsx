import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import bookingApi from '../services/bookingApi';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { formatCurrency, formatDate } from '../utils/formatters';
import { 
  CalendarCheck, 
  Luggage, 
  Hotel, 
  MapPin, 
  Calendar, 
  Users, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  CreditCard 
} from 'lucide-react';

const STATUS_TABS = [
  { label: 'All Bookings', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Cancelled', value: 'CANCELLED' }
];

export const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBookings = async (page = 0) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, size: 10 };
      if (selectedStatus) params.status = selectedStatus;

      const data = await bookingApi.getMyBookings(params);
      setBookings(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
      setCurrentPage(data.page || 0);
    } catch (err) {
      setError(err.message || 'Unable to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(0);
  }, [selectedStatus]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
            <XCircle className="w-3.5 h-3.5" /> Cancelled
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 border border-slate-300 px-2.5 py-0.5 rounded-full">
            Completed
          </span>
        );
      case 'PENDING':
      case 'PAYMENT_PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
            <Clock className="w-3.5 h-3.5" /> Pending Payment
          </span>
        );
    }
  };

  const getPaymentBadge = (paymentStatus) => {
    if (paymentStatus === 'PAID' || paymentStatus === 'SUCCESS') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> PAID
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
        <Clock className="w-3 h-3 text-amber-600" /> UNPAID
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-700 mb-1">
          <CalendarCheck className="w-4 h-4 text-teal-600" />
          <span>Customer Dashboard</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Bookings</h1>
        <p className="text-slate-500 text-sm mt-1">
          Track, manage, and inspect your reservations and travel itineraries.
        </p>
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-8 overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSelectedStatus(tab.value)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-colors ${
              selectedStatus === tab.value
                ? 'bg-brand-navy text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* State views */}
      {loading ? (
        <LoadingState count={3} />
      ) : error ? (
        <ErrorState
          title="Unable to load your bookings"
          message={error}
          onRetry={() => fetchBookings(0)}
        />
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No bookings recorded"
          message={
            selectedStatus 
              ? `You do not have any ${selectedStatus.toLowerCase()} bookings.`
              : "You haven't reserved any holiday packages or hotel rooms yet. Discover your next adventure today."
          }
          actionLabel="Explore Packages"
          onAction={() => window.location.href = '/packages'}
        />
      ) : (
        <div className="space-y-5">
          {bookings.map((booking) => {
            const isPackage = booking.bookingType === 'PACKAGE';
            const packageItem = isPackage && booking.packageItems?.[0];
            const hotelItem = !isPackage && booking.hotelItems?.[0];

            return (
              <div
                key={booking.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                {/* Left side details */}
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                      {booking.bookingReference}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                      {isPackage ? <Luggage className="w-3 h-3" /> : <Hotel className="w-3 h-3" />}
                      {booking.bookingType}
                    </span>
                    {getStatusBadge(booking.status)}
                    {getPaymentBadge(booking.paymentStatus)}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {isPackage 
                        ? packageItem?.packageTitle || 'Holiday Package Tour'
                        : hotelItem?.hotelName || 'Hotel Room Stay'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isPackage
                        ? packageItem?.destinationName ? `Destination: ${packageItem.destinationName}` : ''
                        : `${hotelItem?.roomType || 'Room'} • ${hotelItem?.destinationName || ''}`}
                    </p>
                  </div>

                  {/* Date & Guests details */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-teal-600" />
                      <span>
                        {isPackage 
                          ? `Starts: ${formatDate(packageItem?.startDate)}`
                          : `${formatDate(hotelItem?.checkInDate)} to ${formatDate(hotelItem?.checkOutDate)}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-teal-600" />
                      <span>
                        {isPackage
                          ? `${packageItem?.guestsCount || 1} Travelers`
                          : `${hotelItem?.roomsCount || 1} Room(s), ${hotelItem?.guestsCount || 1} Guests`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right side pricing & action */}
                <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                  <div className="text-left md:text-right">
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-medium">Total Amount</span>
                    <span className="text-xl font-black text-slate-900">
                      {formatCurrency(booking.totalAmount)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    {booking.paymentStatus !== 'PAID' && booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
                      <Link
                        to={`/bookings/${booking.id}/payment`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-teal-600/20"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Pay Now</span>
                      </Link>
                    )}
                    <Link
                      to={`/bookings/${booking.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                    >
                      <span>Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
