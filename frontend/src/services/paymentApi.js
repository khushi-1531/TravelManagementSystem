import api from './api';

export const paymentApi = {
  /**
   * Initiate a payment attempt by creating a Razorpay order on the backend for a specific booking.
   * @param {Object} data - { bookingReference, bookingId }
   * @returns {Promise<Object>} PaymentOrderResponse
   */
  createPaymentOrder: async (data) => {
    const payload = typeof data === 'string' ? { bookingReference: data } : data;
    const response = await api.post('/payments/create-order', payload);
    return response.data.data;
  },

  /**
   * Cryptographically verify Razorpay signature and capture payment.
   * @param {Object} verificationData - { attemptReference, razorpayOrderId, razorpayPaymentId, razorpaySignature }
   * @returns {Promise<Object>} PaymentVerificationResponse
   */
  verifyPayment: async (verificationData) => {
    const response = await api.post('/payments/verify', verificationData);
    return response.data.data;
  },

  /**
   * Report a failed or cancelled payment attempt.
   * @param {Object} failureData - { attemptReference, failureReason }
   * @returns {Promise<Object>} PaymentAttemptResponse
   */
  reportPaymentFailure: async (failureData) => {
    const response = await api.post('/payments/fail', failureData);
    return response.data.data;
  },

  /**
   * Get payment attempts audit history for a booking.
   * @param {string} bookingReference
   * @returns {Promise<Array>} List of PaymentAttemptResponse
   */
  getPaymentAttempts: async (bookingReference) => {
    const response = await api.get(`/payments/booking/${bookingReference}/attempts`);
    return response.data.data;
  }
};

export default paymentApi;
