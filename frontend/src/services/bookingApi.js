import api from './api';

export const bookingApi = {
  createBooking: async (bookingData) => {
    const response = await api.post('/bookings', bookingData);
    return response.data.data; // BookingResponse
  },

  getMyBookings: async (params = {}) => {
    const response = await api.get('/bookings', { params });
    return response.data.data; // PageResponse<BookingResponse>
  },

  getBookingById: async (id) => {
    const response = await api.get(`/bookings/${id}`);
    return response.data.data; // BookingResponse
  },

  cancelBooking: async (id) => {
    const response = await api.post(`/bookings/${id}/cancel`);
    return response.data.data; // BookingResponse
  }
};

export default bookingApi;
