import api from './api';

export const adminApi = {
  // 1. Dashboard Metrics & KPI
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data.data;
  },

  // 2. User Management
  getUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data.data;
  },

  updateUserStatus: async (id, status) => {
    const response = await api.put(`/admin/users/${id}/status`, { status });
    return response.data.data;
  },

  // 3. Destinations
  getDestinations: async (params = {}) => {
    const response = await api.get('/admin/destinations', { params });
    return response.data.data;
  },

  createDestination: async (destinationData) => {
    const response = await api.post('/admin/destinations', destinationData);
    return response.data.data;
  },

  updateDestination: async (id, destinationData) => {
    const response = await api.put(`/admin/destinations/${id}`, destinationData);
    return response.data.data;
  },

  toggleDestinationPublish: async (id) => {
    const response = await api.delete(`/admin/destinations/${id}`);
    return response.data.data;
  },

  // 4. Hotels
  getHotels: async (params = {}) => {
    const response = await api.get('/admin/hotels', { params });
    return response.data.data;
  },

  createHotel: async (hotelData) => {
    const response = await api.post('/admin/hotels', hotelData);
    return response.data.data;
  },

  updateHotel: async (id, hotelData) => {
    const response = await api.put(`/admin/hotels/${id}`, hotelData);
    return response.data.data;
  },

  toggleHotelActive: async (id) => {
    const response = await api.delete(`/admin/hotels/${id}`);
    return response.data.data;
  },

  // 5. Packages
  getPackages: async (params = {}) => {
    const response = await api.get('/admin/packages', { params });
    return response.data.data;
  },

  createPackage: async (packageData) => {
    const response = await api.post('/admin/packages', packageData);
    return response.data.data;
  },

  updatePackage: async (id, packageData) => {
    const response = await api.put(`/admin/packages/${id}`, packageData);
    return response.data.data;
  },

  togglePackageActive: async (id) => {
    const response = await api.delete(`/admin/packages/${id}`);
    return response.data.data;
  },

  // 6. Bookings
  getBookings: async (params = {}) => {
    const response = await api.get('/admin/bookings', { params });
    return response.data.data;
  },

  updateBookingStatus: async (id, status, adminNotes = '') => {
    const response = await api.put(`/admin/bookings/${id}/status`, { status, adminNotes });
    return response.data.data;
  },

  // 7. Payments
  getPayments: async (params = {}) => {
    const response = await api.get('/admin/payments', { params });
    return response.data.data;
  },

  // 8. Reviews
  getReviews: async (params = {}) => {
    const response = await api.get('/admin/reviews', { params });
    return response.data.data;
  },

  deleteReview: async (id) => {
    const response = await api.delete(`/admin/reviews/${id}`);
    return response.data.data;
  }
};

export default adminApi;
