import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import bookingApi from '../services/bookingApi';
import { formatCurrency, formatDuration } from '../utils/formatters';
import { 
  X, 
  Calendar, 
  Users, 
  Luggage, 
  MapPin, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  CheckCircle2 
} from 'lucide-react';

export const PackageBookingModal = ({ travelPackage, isOpen, onClose }) => {
  const navigate = useNavigate();

  // Tomorrow as default start date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateStr = tomorrow.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(minDateStr);
  const [guestsCount, setGuestsCount] = useState(2);
  const [customerNotes, setCustomerNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !travelPackage) return null;

  const unitPrice = Number(travelPackage.basePricePerPerson || 0);
  const totalAmount = unitPrice * Number(guestsCount || 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!startDate) {
      setError('Please select a travel start date.');
      return;
    }
    if (guestsCount < 1) {
      setError('Number of travelers must be at least 1.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        bookingType: 'PACKAGE',
        packageId: travelPackage.id,
        startDate: startDate,
        guestsCount: Number(guestsCount),
        customerNotes: customerNotes.trim() || undefined
      };

      const booking = await bookingApi.createBooking(payload);
      onClose();
      navigate(`/bookings/confirmation/${booking.id}`, { state: { booking } });
    } catch (err) {
      setError(err.message || 'Unable to complete package booking. Please try again.');
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
            <Luggage className="w-4 h-4" />
            <span>Book Holiday Package</span>
          </div>
          <h3 className="text-xl font-extrabold truncate pr-8">{travelPackage.title}</h3>
          
          {travelPackage.destinationName && (
            <div className="flex items-center gap-1 text-xs text-slate-300 mt-1">
              <MapPin className="w-3.5 h-3.5 text-teal-400" />
              <span>{travelPackage.destinationName}</span>
              <span className="mx-1">•</span>
              <span>{formatDuration(travelPackage.durationDays, travelPackage.durationNights)}</span>
            </div>
          )}
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Travel Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-teal-600" />
              <span>Departure / Start Date</span>
            </label>
            <input
              type="date"
              min={minDateStr}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-teal-600 transition-colors"
            />
          </div>

          {/* Travelers Count */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-teal-600" />
              <span>Number of Travelers</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="20"
                value={guestsCount}
                onChange={(e) => setGuestsCount(Math.max(1, parseInt(e.target.value) || 1))}
                required
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-teal-600 transition-colors"
              />
              <span className="text-xs text-slate-500 whitespace-nowrap">
                × {formatCurrency(unitPrice)} / person
              </span>
            </div>
          </div>

          {/* Customer Special Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Special Requests / Dietary Notes (Optional)
            </label>
            <textarea
              rows="2"
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="e.g. Vegetarian meals preferred, ground floor pickup..."
              maxLength="500"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 outline-none focus:bg-white focus:border-teal-600 transition-colors"
            />
          </div>

          {/* Price Breakdown Panel */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Base Package Fare ({guestsCount} {guestsCount === 1 ? 'traveler' : 'travelers'})</span>
              <span className="font-semibold text-slate-800">{formatCurrency(totalAmount)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Estimated Taxes & Service Fees</span>
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
              Your reservation reference will be generated immediately. Payment will be finalized in the subsequent payment integration phase.
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

export default PackageBookingModal;
