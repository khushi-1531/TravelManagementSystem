import React, { useState, useEffect } from 'react';
import adminApi from '../../services/adminApi';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Receipt
} from 'lucide-react';

const PAYMENT_STATUSES = ['SUCCESS', 'PENDING', 'FAILED'];

export const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const fetchPayments = async (pageToFetch = page, status = statusFilter) => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getPayments({
        status: status || undefined,
        page: pageToFetch,
        size: 10
      });
      setPayments(data.content || []);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      setError(err.message || 'Failed to retrieve payment records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments(page, statusFilter);
  }, [page, statusFilter]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> Captured
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Clock className="w-3 h-3" /> Processing
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <XCircle className="w-3 h-3" /> Failed
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
            <CreditCard className="w-6 h-6 text-teal-400" />
            <span>Payment Gateway & Audit Trail</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Reconciliation ledger of all Razorpay transactions, gateway order IDs, and payment statuses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchPayments(page, statusFilter)}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-teal-400" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs text-slate-400 font-semibold whitespace-nowrap">
            Transaction Status:
          </label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:border-teal-500 outline-none"
          >
            <option value="">All Transactions</option>
            {PAYMENT_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-400">
          Total Recorded Attempts:{' '}
          <span className="text-white font-semibold">{totalElements}</span>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-slate-950/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Transaction Identifiers</th>
                <th className="py-3.5 px-4 sm:px-6">Associated Booking</th>
                <th className="py-3.5 px-4 sm:px-6">Method & Currency</th>
                <th className="py-3.5 px-4 sm:px-6">Captured Amount</th>
                <th className="py-3.5 px-4 sm:px-6">Status</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    <Loader2 className="w-8 h-8 text-teal-400 animate-spin mx-auto mb-2" />
                    <span>Auditing payment attempts from database...</span>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    No payment attempts found matching the selected filter.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="font-mono text-white text-xs font-semibold">
                        {p.gatewayPaymentId || p.attemptReference || p.gatewayOrderId || `TXN-${p.id}`}
                      </div>
                      {p.gatewayOrderId && (
                        <div className="font-mono text-[10px] text-slate-500">
                          Order: {p.gatewayOrderId}
                        </div>
                      )}
                      {(p.failureReason || p.errorMessage) && (
                        <div className="text-[11px] text-rose-400 mt-1 max-w-xs truncate">
                          Reason: {p.failureReason || p.errorMessage}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-1 text-slate-200 font-mono">
                        <Receipt className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                        <span>{p.bookingReference ? `${p.bookingReference}` : (p.bookingId ? `Booking #${p.bookingId}` : 'Direct')}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                        {p.paymentMethod || 'RAZORPAY'}
                      </span>
                      <div className="text-[11px] text-slate-500 mt-0.5">{p.currency || 'INR'}</div>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="text-white font-bold">{formatCurrency(p.amount)}</div>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6">{getStatusBadge(p.status)}</td>

                    <td className="py-3.5 px-4 sm:px-6 text-right text-xs text-slate-400">
                      {p.createdAt ? new Date(p.createdAt).toLocaleString() : 'N/A'}
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
    </div>
  );
};

export default AdminPayments;
