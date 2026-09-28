import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Star, 
  MessageSquare, 
  Edit3, 
  Trash2, 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  User,
  Sparkles
} from 'lucide-react';
import StarRating from './StarRating';
import EmptyState from './EmptyState';
import { useAuth } from '../context/AuthContext';
import reviewApi from '../services/reviewApi';

export const ReviewSection = ({ targetType, targetId, targetName = 'this item' }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // State
  const [reviews, setReviews] = useState([]);
  const [ratingSummary, setRatingSummary] = useState(null);
  const [myReview, setMyReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [sortParam, setSortParam] = useState('newest');

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [formData, setFormData] = useState({
    rating: 5,
    headline: '',
    reviewText: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // Delete modal state
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Load summary and reviews
  const loadData = useCallback(async (page = 0, sort = sortParam) => {
    if (!targetType || !targetId) return;
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, reviewsPage, myRevRes] = await Promise.allSettled([
        reviewApi.getRatingSummary(targetType, targetId),
        reviewApi.getReviews(targetType, targetId, { page, size: 6, sort }),
        isAuthenticated ? reviewApi.getMyReview(targetType, targetId) : Promise.resolve(null)
      ]);

      if (summaryRes.status === 'fulfilled') {
        setRatingSummary(summaryRes.value);
      }
      if (reviewsPage.status === 'fulfilled') {
        setReviews(reviewsPage.value?.content || []);
        setCurrentPage(reviewsPage.value?.page || 0);
        setTotalPages(reviewsPage.value?.totalPages || 0);
        setTotalElements(reviewsPage.value?.totalElements || 0);
      }
      if (myRevRes.status === 'fulfilled') {
        setMyReview(myRevRes.value || null);
      }
    } catch (err) {
      setError('Unable to load reviews. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [targetType, targetId, sortParam, isAuthenticated]);

  useEffect(() => {
    loadData(0, sortParam);
  }, [loadData, sortParam]);

  // Form handlers
  const handleStartCreate = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }
    setFormData({ rating: 5, headline: '', reviewText: '' });
    setFormErrors({});
    setIsEditing(false);
    setEditingReviewId(null);
    setShowForm(true);
  };

  const handleStartEdit = (rev) => {
    setFormData({
      rating: rev.rating,
      headline: rev.headline || '',
      reviewText: rev.reviewText || ''
    });
    setFormErrors({});
    setIsEditing(true);
    setEditingReviewId(rev.id);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setIsEditing(false);
    setEditingReviewId(null);
    setFormData({ rating: 5, headline: '', reviewText: '' });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.rating || formData.rating < 1 || formData.rating > 5) {
      errors.rating = 'Please select a rating between 1 and 5 stars.';
    }
    if (formData.headline && formData.headline.length > 150) {
      errors.headline = 'Headline must be 150 characters or fewer.';
    }
    if (!formData.reviewText || formData.reviewText.trim().length < 5) {
      errors.reviewText = 'Review text must be at least 5 characters.';
    } else if (formData.reviewText.length > 2000) {
      errors.reviewText = 'Review text cannot exceed 2000 characters.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setError(null);
    setSuccessMessage('');

    try {
      if (isEditing && editingReviewId) {
        await reviewApi.updateReview(editingReviewId, formData);
        setSuccessMessage('Your review has been updated successfully.');
      } else {
        await reviewApi.createReview(targetType, targetId, formData);
        setSuccessMessage('Thank you! Your review has been submitted.');
      }

      handleCancelForm();
      await loadData(0, sortParam);
    } catch (err) {
      setError(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId) => {
    setDeletingId(reviewId);
    setError(null);
    try {
      await reviewApi.deleteReview(reviewId);
      setConfirmDeleteId(null);
      setSuccessMessage('Review removed successfully.');
      await loadData(0, sortParam);
    } catch (err) {
      setError(err.message || 'Failed to delete review.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Write Review Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-teal-600" />
            Guest Reviews & Ratings
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real feedback from verified TravelSphere community travelers
          </p>
        </div>

        {!showForm && (
          <div>
            {myReview ? (
              <button
                onClick={() => handleStartEdit(myReview)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                <Edit3 className="w-4 h-4 text-teal-600" />
                Edit Your Review
              </button>
            ) : (
              <button
                onClick={handleStartCreate}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-all hover:shadow"
              >
                <Star className="w-4 h-4 fill-white" />
                Write a Review
              </button>
            )}
          </div>
        )}
      </div>

      {/* Alert Banners */}
      {successMessage && (
        <div className="flex items-center gap-2 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Authoritative Rating Summary Card */}
      {ratingSummary && ratingSummary.totalReviews > 0 && (
        <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Overall Score */}
            <div className="text-center md:border-r md:border-slate-200 md:pr-6">
              <div className="text-5xl font-black text-slate-900 tracking-tight">
                {ratingSummary.averageRating ? ratingSummary.averageRating.toFixed(1) : '0.0'}
              </div>
              <div className="flex justify-center my-2">
                <StarRating value={ratingSummary.averageRating} readOnly size="lg" />
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Based on <strong className="text-slate-800">{ratingSummary.totalReviews}</strong> customer review{ratingSummary.totalReviews > 1 ? 's' : ''}
              </p>
            </div>

            {/* Rating Distribution Bars */}
            <div className="md:col-span-2 space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = ratingSummary.ratingDistribution?.[star] || 0;
                const percentage = ratingSummary.totalReviews > 0
                  ? Math.round((count / ratingSummary.totalReviews) * 100)
                  : 0;

                return (
                  <div key={star} className="flex items-center gap-3 text-xs text-slate-600">
                    <span className="w-12 font-medium flex items-center gap-1 justify-end">
                      {star} <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                    </span>
                    <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-10 text-right font-medium text-slate-400">{percentage}%</span>
                    <span className="w-8 text-right font-bold text-slate-700">({count})</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Write / Edit Review Form Modal/Section */}
      {showForm && (
        <div className="bg-white rounded-2xl border-2 border-teal-500/40 p-6 shadow-md animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h4 className="font-bold text-slate-900 text-base">
                {isEditing ? 'Edit Your Review' : `Reviewing ${targetName}`}
              </h4>
              <p className="text-xs text-slate-500">Share honest impressions to guide fellow travelers</p>
            </div>
            <button
              type="button"
              onClick={handleCancelForm}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Star Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Your Rating <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <StarRating
                  value={formData.rating}
                  onChange={(val) => setFormData({ ...formData, rating: val })}
                  size="lg"
                />
                <span className="text-xs font-bold text-slate-700">
                  {formData.rating} out of 5 stars
                </span>
              </div>
              {formErrors.rating && (
                <p className="text-xs text-rose-500 mt-1">{formErrors.rating}</p>
              )}
            </div>

            {/* Headline */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Headline (Optional)
              </label>
              <input
                type="text"
                value={formData.headline}
                onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                placeholder="Sum up your experience in a single phrase..."
                maxLength={150}
                className="w-full text-xs sm:text-sm p-2.5 border border-slate-200 rounded-xl outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              />
              {formErrors.headline && (
                <p className="text-xs text-rose-500 mt-1">{formErrors.headline}</p>
              )}
            </div>

            {/* Review Comment */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Detailed Review <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  {formData.reviewText.length}/2000 characters
                </span>
              </div>
              <textarea
                rows={4}
                value={formData.reviewText}
                onChange={(e) => setFormData({ ...formData, reviewText: e.target.value })}
                placeholder="What did you love? Any helpful tips for others?..."
                className="w-full text-xs sm:text-sm p-3 border border-slate-200 rounded-xl outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 resize-y"
              />
              {formErrors.reviewText && (
                <p className="text-xs text-rose-500 mt-1">{formErrors.reviewText}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleCancelForm}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {isEditing ? 'Update Review' : 'Submit Review'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* User's Own Highlighted Review Card (if exists and not in edit mode) */}
      {myReview && !showForm && (
        <div className="bg-teal-50/70 border border-teal-200 rounded-2xl p-5 relative shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-800 bg-teal-100 px-2.5 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3 text-teal-600" />
              Your Review
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleStartEdit(myReview)}
                className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-white rounded-lg transition-colors"
                title="Edit review"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setConfirmDeleteId(myReview.id)}
                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-white rounded-lg transition-colors"
                title="Delete review"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <StarRating value={myReview.rating} readOnly size="sm" />
            <span className="text-xs text-slate-400 font-medium">
              {formatDate(myReview.createdAt)}
            </span>
          </div>

          {myReview.headline && (
            <h5 className="font-bold text-slate-900 text-sm mb-1">{myReview.headline}</h5>
          )}
          <p className="text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
            {myReview.reviewText}
          </p>
        </div>
      )}

      {/* Sorting & Counter Bar */}
      {reviews.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <span className="text-xs font-semibold text-slate-500">
            Showing {reviews.length} of {totalElements} review{totalElements > 1 ? 's' : ''}
          </span>

          <div className="flex items-center gap-2 text-xs">
            <label htmlFor="review-sort" className="font-medium text-slate-600">Sort by:</label>
            <select
              id="review-sort"
              value={sortParam}
              onChange={(e) => setSortParam(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-teal-600"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
            </select>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-4 py-8">
          {[1, 2].map((n) => (
            <div key={n} className="bg-slate-50 rounded-2xl p-5 border border-slate-100 animate-pulse space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-200" />
                <div className="space-y-1">
                  <div className="w-24 h-3 bg-slate-200 rounded" />
                  <div className="w-16 h-2 bg-slate-200 rounded" />
                </div>
              </div>
              <div className="w-3/4 h-3 bg-slate-200 rounded" />
              <div className="w-full h-2 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-6">
          <EmptyState
            icon={MessageSquare}
            title="No reviews yet"
            message={`Be the first to share your thoughts on ${targetName}!`}
            actionLabel={!isAuthenticated ? 'Sign In to Review' : 'Write the First Review'}
            onAction={!isAuthenticated ? () => navigate('/login', { state: { from: location } }) : handleStartCreate}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className={`bg-white rounded-2xl border p-5 transition-all shadow-sm ${
                rev.isOwner ? 'border-teal-300 ring-1 ring-teal-200' : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-teal-700/10 text-teal-800 flex items-center justify-center text-xs font-bold shrink-0">
                    {rev.reviewerName ? rev.reviewerName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800 text-xs sm:text-sm">
                        {rev.reviewerName}
                      </span>
                      {rev.isOwner && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded">
                          You
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StarRating value={rev.rating} readOnly size="sm" />
                      <span className="text-[11px] text-slate-400">
                        {formatDate(rev.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Owner Actions */}
                {rev.isOwner && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStartEdit(rev)}
                      className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-slate-50 rounded-lg transition-colors"
                      title="Edit review"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(rev.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-lg transition-colors"
                      title="Delete review"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {rev.headline && (
                <h5 className="font-bold text-slate-900 text-sm mb-1">{rev.headline}</h5>
              )}
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                {rev.reviewText}
              </p>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
              <button
                disabled={currentPage === 0 || loading}
                onClick={() => loadData(currentPage - 1, sortParam)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </button>
              <span className="text-slate-500 font-medium">
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages - 1 || loading}
                onClick={() => loadData(currentPage + 1, sortParam)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h4 className="text-base font-bold text-slate-900">Delete Your Review?</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              This action cannot be undone. Your rating and review text will be permanently removed.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                disabled={deletingId !== null}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deletingId !== null}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors disabled:opacity-50"
              >
                {deletingId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewSection;
