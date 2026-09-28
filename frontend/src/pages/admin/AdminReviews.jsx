import React, { useState, useEffect } from 'react';
import adminApi from '../../services/adminApi';
import {
  MessageSquare,
  Star,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  User,
  MapPin,
  Hotel,
  Luggage
} from 'lucide-react';

const TARGET_TYPES = ['DESTINATION', 'HOTEL', 'PACKAGE'];
const RATINGS = [5, 4, 3, 2, 1];

export const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [targetTypeFilter, setTargetTypeFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [deletingId, setDeletingId] = useState(null);
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchReviews = async (
    pageToFetch = page,
    targetType = targetTypeFilter,
    rating = ratingFilter
  ) => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getReviews({
        targetType: targetType || undefined,
        rating: rating ? parseInt(rating, 10) : undefined,
        page: pageToFetch,
        size: 10
      });
      setReviews(data.content || []);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      setError(err.message || 'Failed to retrieve reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(page, targetTypeFilter, ratingFilter);
  }, [page, targetTypeFilter, ratingFilter]);

  const handleDeleteReview = async (review) => {
    const title = review.headline || review.title || 'Untitled Review';
    const author = review.reviewerName || review.authorName || review.reviewerUsername || review.username || 'User';
    if (
      !window.confirm(
        `Are you sure you want to delete review "${title}" by ${author}? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setDeletingId(review.id);
      await adminApi.deleteReview(review.id);
      setReviews((prev) => prev.filter((r) => r.id !== review.id));
      setActionSuccess('Customer review removed successfully by administrator.');
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to delete review.');
    } finally {
      setDeletingId(null);
    }
  };

  const getTargetIcon = (type) => {
    switch (type) {
      case 'DESTINATION':
        return <MapPin className="w-3.5 h-3.5 text-teal-400" />;
      case 'HOTEL':
        return <Hotel className="w-3.5 h-3.5 text-blue-400" />;
      case 'PACKAGE':
        return <Luggage className="w-3.5 h-3.5 text-rose-400" />;
      default:
        return <MessageSquare className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <MessageSquare className="w-6 h-6 text-teal-400" />
            <span>Customer Reviews Moderation</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Monitor visitor testimonials, inspect star ratings, and remove inappropriate content.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchReviews(page, targetTypeFilter, ratingFilter)}
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

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 font-semibold whitespace-nowrap">Entity:</label>
            <select
              value={targetTypeFilter}
              onChange={(e) => {
                setTargetTypeFilter(e.target.value);
                setPage(0);
              }}
              className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:border-teal-500 outline-none"
            >
              <option value="">All Types</option>
              {TARGET_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 font-semibold whitespace-nowrap">Rating:</label>
            <select
              value={ratingFilter}
              onChange={(e) => {
                setRatingFilter(e.target.value);
                setPage(0);
              }}
              className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:border-teal-500 outline-none"
            >
              <option value="">All Star Ratings</option>
              {RATINGS.map((r) => (
                <option key={r} value={r}>
                  {r} Stars
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-400">
          Total Reviews: <span className="text-white font-semibold">{totalElements}</span>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-slate-950/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Entity Target</th>
                <th className="py-3.5 px-4 sm:px-6">Reviewer</th>
                <th className="py-3.5 px-4 sm:px-6">Rating</th>
                <th className="py-3.5 px-4 sm:px-6">Review Content</th>
                <th className="py-3.5 px-4 sm:px-6">Date</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    <Loader2 className="w-8 h-8 text-teal-400 animate-spin mx-auto mb-2" />
                    <span>Loading reviews...</span>
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    No customer reviews found matching the filters.
                  </td>
                </tr>
              ) : (
                reviews.map((rev) => (
                  <tr key={rev.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-1.5 font-bold text-white">
                        {getTargetIcon(rev.targetType)}
                        <span>{rev.targetType} #{rev.targetId}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-xs text-white">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-white">
                            {rev.reviewerName || rev.authorName || rev.reviewerUsername || rev.username || 'Traveler'}
                          </div>
                          <div className="text-[11px] text-slate-500">@{rev.reviewerUsername || rev.username || 'user'}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= (rev.rating || 5)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="font-semibold text-white mb-0.5">
                        {rev.headline || rev.title || 'Untitled Review'}
                      </div>
                      <div className="text-xs text-slate-400 line-clamp-2 max-w-sm">
                        {rev.reviewText || rev.content || 'No text content'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6 text-xs text-slate-400">
                      {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : 'N/A'}
                    </td>

                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <button
                        onClick={() => handleDeleteReview(rev)}
                        disabled={deletingId === rev.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/50 hover:bg-rose-900 text-rose-300 text-xs font-semibold border border-rose-800 transition-colors disabled:opacity-50"
                        title="Delete Review"
                      >
                        {deletingId === rev.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        )}
                        <span>Delete</span>
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
    </div>
  );
};

export default AdminReviews;
