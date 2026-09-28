import React, { useState, useEffect } from 'react';
import adminApi from '../../services/adminApi';
import {
  CalendarCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Clock,
  XCircle,
  Edit3,
  X,
  FileText
} from 'lucide-react';

const STATUS_LIST = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];

export const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Status Change Modal State
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchBookings = async (
    pageToFetch = page,
    status = statusFilter,
    query = searchQuery
  ) => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getBookings({
        status: status || undefined,
        search: query || undefined,
        page: pageToFetch,
        size: 10
      });
      setBookings(data.content || []);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      setError(err.message || 'Failed to retrieve bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(page, statusFilter, searchQuery);
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchBookings(0, statusFilter, searchQuery);
  };

  const openStatusModal = (booking) => {
    setSelectedBooking(booking);
    setNewStatus(booking.status);
    setAdminNotes(booking.notes || '');
    setModalError(null);
  };

  const handleStatusUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBooking || !newStatus) return;

    try {
      setUpdating(true);
      setModalError(null);
      const updated = await adminApi.updateBookingStatus(
        selectedBooking.id,
        newStatus,
        adminNotes
      );
      setBookings((prev) =>
        prev.map((b) => (b.id === selectedBooking.id ? { ...b, status: updated.status } : b))
      );
      setActionSuccess(`Booking "${selectedBooking.bookingReference}" status updated to ${newStatus}.`);
      setSelectedBooking(null);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setModalError(err.message || 'Failed to update booking status.');
    } finally {
      setUpdating(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> Confirmed
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <XCircle className="w-3 h-3" /> Cancelled
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <CalendarCheck className="w-6 h-6 text-teal-400" />
            <span>Bookings Administration</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track customer reservations, review travel schedules, and administrate lifecycle states.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchBookings(page, statusFilter, searchQuery)}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-teal-400" />
          </button>
        </div>
      </div>

      {/* Action Notification */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <form onSubmit={handleSearchSubmit} className="w-full sm:w-80 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reference, customer name, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </form>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs text-slate-400 font-semibold whitespace-nowrap">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:border-teal-500 outline-none"
            >
              <option value="">All Statuses</option>
              {STATUS_LIST.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-400">
          Showing <span className="text-white font-semibold">{bookings.length}</span> of{' '}
          <span className="text-white font-semibold">{totalElements}</span> system reservations
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-slate-950/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Booking Reference</th>
                <th className="py-3.5 px-4 sm:px-6">Customer</th>
                <th className="py-3.5 px-4 sm:px-6">Type & Dates</th>
                <th className="py-3.5 px-4 sm:px-6">Amount</th>
                <th className="py-3.5 px-4 sm:px-6">Status</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Admin Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    <Loader2 className="w-8 h-8 text-teal-400 animate-spin mx-auto mb-2" />
                    <span>Loading reservations from database...</span>
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    No reservations found matching the filters.
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="font-mono font-bold text-white tracking-wider">
                        {b.bookingReference}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="text-white font-semibold">
                        {b.userFullName || b.contactName || b.customerName || 'Customer'}
                      </div>
                      <div className="text-xs text-slate-400">{b.userEmail || b.contactEmail || 'N/A'}</div>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="text-white font-medium">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-teal-400 border border-slate-700">
                          {b.bookingType || 'PACKAGE'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {b.packageItems?.[0]?.travelDate
                          ? new Date(b.packageItems[0].travelDate).toLocaleDateString()
                          : b.hotelItems?.[0]?.checkInDate
                          ? `${new Date(b.hotelItems[0].checkInDate).toLocaleDateString()} – ${new Date(b.hotelItems[0].checkOutDate).toLocaleDateString()}`
                          : b.travelStartDate
                          ? new Date(b.travelStartDate).toLocaleDateString()
                          : 'Flexible Dates'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="text-white font-bold">{formatCurrency(b.totalAmount)}</div>
                      <div className="text-[11px] text-slate-400">
                        {b.numberOfTravelers || 1} traveler(s)
                      </div>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6">{getStatusBadge(b.status)}</td>

                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <button
                        onClick={() => openStatusModal(b)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-teal-400" />
                        <span>Update</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Page <span className="text-white font-semibold">{page + 1}</span> of{' '}
              <span className="text-white font-semibold">{totalPages}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || loading}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1 || loading}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Booking Status Update Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-400" />
                <span>Update Booking Status</span>
              </h2>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="mb-4 text-xs bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1 text-slate-400">
              <div>
                Booking Ref: <strong className="text-white">{selectedBooking.bookingReference}</strong>
              </div>
              <div>
                Customer: <strong className="text-white">{selectedBooking.userFullName || selectedBooking.contactName || 'Guest'}</strong>
              </div>
              <div>
                Total Amount: <strong className="text-white">{formatCurrency(selectedBooking.totalAmount)}</strong>
              </div>
            </div>

            <form onSubmit={handleStatusUpdateSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-teal-500"
                >
                  {STATUS_LIST.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Administrative Notes / Remarks
                </label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Record justification, payment receipt details, or refund notes..."
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-teal-500/20 transition-colors disabled:opacity-50"
                >
                  {updating && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Status</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBookings;
