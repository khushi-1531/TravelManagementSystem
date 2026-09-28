import api from './api';

export const reviewApi = {
  /**
   * Get paginated reviews for a target catalogue item (Destination, Hotel, Package).
   */
  getReviews: async (targetType, targetId, params = {}) => {
    const response = await api.get(`/reviews/${targetType}/${targetId}`, { params });
    return response.data.data; // PageResponse<ReviewResponse>
  },

  /**
   * Get authoritative rating summary and star distribution.
   */
  getRatingSummary: async (targetType, targetId) => {
    const response = await api.get(`/reviews/${targetType}/${targetId}/summary`);
    return response.data.data; // RatingSummaryResponse
  },

  /**
   * Get caller's own review for a specific catalogue item (if exists).
   */
  getMyReview: async (targetType, targetId) => {
    const response = await api.get(`/reviews/${targetType}/${targetId}/me`);
    return response.data.data; // ReviewResponse | null
  },

  /**
   * Submit a new review for a catalogue item.
   */
  createReview: async (targetType, targetId, reviewData) => {
    const response = await api.post(`/reviews/${targetType}/${targetId}`, reviewData);
    return response.data.data; // ReviewResponse
  },

  /**
   * Update own review.
   */
  updateReview: async (reviewId, reviewData) => {
    const response = await api.put(`/reviews/${reviewId}`, reviewData);
    return response.data.data; // ReviewResponse
  },

  /**
   * Delete own review.
   */
  deleteReview: async (reviewId) => {
    const response = await api.delete(`/reviews/${reviewId}`);
    return response.data.data;
  },

  /**
   * Get all reviews created by the authenticated user.
   */
  getMyReviews: async (params = {}) => {
    const response = await api.get('/reviews/me', { params });
    return response.data.data; // PageResponse<ReviewResponse>
  }
};

export default reviewApi;
