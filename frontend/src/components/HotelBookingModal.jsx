import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import bookingApi from '../services/bookingApi';
import { formatCurrency } from '../utils/formatters';
import { 
  X, 
  Calendar, 
  Users, 
  BedDouble, 
  MapPin, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  Hotel as HotelIcon 
} from 'lucide-react';

export const HotelBookingModal = ({ hotel, room, isOpen, onClose }) => {
  const navigate = useNavigate();

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [checkInDate, setCheckInDate] = useState(todayStr);
  const [checkOutDate, setCheckOutDate] = useState(tomorrowStr);
  const [roomsCount, setRoomsCount] = useState(1);
  const [guestsCount, setGuestsCount] = useState(2);
  const [customerNotes, setCustomerNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !hotel || !room) return null;

  // Compute nights
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  const diffTime = checkOut - checkIn;
  const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const pricePerNight = Number(room.pricePerNight || 0);
  const totalAmount = pricePerNight * Number(roomsCount || 1) * nights;
  const maxCapacity = (room.maxOccupancy || 2) * Number(roomsCount || 1);

  const handleCheckInChange = (e) => {
    const newCheckIn = e.target.value;
    setCheckInDate(newCheckIn);
    if (newCheckIn >= checkOutDate) {
      const nextDay = new Date(newCheckIn);
      nextDay.setDate(nextDay.getDate() + 1);
      setCheckOutDate(nextDay.toISOString().split('T')[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!checkInDate || !checkOutDate) {
      setError('Please provide check-in and check-out dates.');
      return;
    }
    if (checkOutDate <= checkInDate) {
      setError('Check-out date must be after check-in date.');
      return;
    }
    if (guestsCount > maxCapacity) {
      setError(`Selected ${roomsCount} room(s) can accommodate at most ${maxCapacity} guests.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        bookingType: 'HOTEL',
        hotelRoomId: room.id,
        checkInDate: checkInDate,
        checkOutDate: checkOutDate,
        roomsCount: Number(roomsCount),
        guestsCount: Number(guestsCount),
        customerNotes: customerNotes.trim() || undefined
      };

      const booking = await bookingApi.createBooking(payload);
      onClose();
      navigate(`/bookings/confirmation/${booking.id}`, { state: { booking } });
    } catch (err) {
      setError(err.message || 'Unable to reserve room. Please adjust dates or criteria.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-brand-navy p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-300 mb-1">
            <HotelIcon className="w-4 h-4" />
            <span>Book Hotel Accommodation</span>
          </div>
          <h3 className="text-xl font-extrabold truncate pr-8">{hotel.name}</h3>
          
          <div className="flex items-center gap-2 text-xs text-slate-300 mt-1">
            <span className="font-semibold text-white">{room.roomType}</span>
            <span>•</span>
            <span className="text-teal-300">{formatCurrency(room.pricePerNight)} / night</span>
          </div>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Dates Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-teal-600" />
                <span>Check-In Date</span>
              </label>
              <input
                type="date"
                min={todayStr}
                value={checkInDate}
                onChange={handleCheckInChange}
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-teal-600 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-teal-600" />
                <span>Check-Out Date</span>
              </label>
              <input
                type="date"
                min={checkInDate || todayStr}
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-teal-600 transition-colors"
              />
            </div>
          </div>

          {/* Rooms and Guests Counters */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <BedDouble className="w-4 h-4 text-teal-600" />
                <span>Rooms Count</span>
              </label>
              <input
                type="number"
                min="1"
                max={room.totalInventory || 10}
                value={roomsCount}
                onChange={(e) => setRoomsCount(Math.max(1, parseInt(e.target.value) || 1))}
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-teal-600" />
                <span>Total Guests</span>
              </label>
              <input
                type="number"
                min="1"
                max={maxCapacity}
                value={guestsCount}
                onChange={(e) => setGuestsCount(Math.max(1, parseInt(e.target.value) || 1))}
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-teal-600"
              />
            </div>
          </div>

          {/* Customer Special Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Special Requests (Early check-in, high floor, etc.)
            </label>
            <textarea
              rows="2"
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="e.g. Late arrival around 9 PM..."
              maxLength="500"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 outline-none focus:bg-white focus:border-teal-600 transition-colors"
            />
          </div>

          {/* Pricing Panel */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>{formatCurrency(pricePerNight)} × {roomsCount} room(s) × {nights} night(s)</span>
              <span className="font-semibold text-slate-800">{formatCurrency(totalAmount)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Taxes & Service Fees</span>
              <span className="text-emerald-700 font-medium">Included</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900">Total Booking Amount</span>
              <span className="text-xl font-extrabold text-teal-800">{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          <div className="bg-teal-50/70 border border-teal-200/60 rounded-xl p-3 flex items-start gap-2 text-[11px] text-teal-900">
            <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <span>
              Room inventory will be locked immediately for these dates. Payment settlement is reserved for the upcoming payment module.
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-navy hover:bg-slate-800 disabled:opacity-60 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Reserving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Reservation</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HotelBookingModal;
