import api from './api';

export const destinationApi = {
  getDestinations: async (params = {}) => {
    const response = await api.get('/destinations', { params });
    return response.data.data; // PageResponse<DestinationResponse>
  },

  getDestinationById: async (id) => {
    const response = await api.get(`/destinations/${id}`);
    return response.data.data; // DestinationResponse
  },

  getDestinationBySlug: async (slug) => {
    const response = await api.get(`/destinations/slug/${slug}`);
    return response.data.data;
  },

  getPlacesByDestination: async (destinationId) => {
    const response = await api.get(`/destinations/${destinationId}/places`);
    return response.data.data; // List<PlaceResponse>
  },

  getHotelsByDestination: async (destinationId) => {
    const response = await api.get(`/destinations/${destinationId}/hotels`);
    return response.data.data; // List<HotelResponse>
  },

  getPackagesByDestination: async (destinationId) => {
    const response = await api.get(`/destinations/${destinationId}/packages`);
    return response.data.data; // List<PackageResponse>
  },

  getNearbyDestinations: async (params = {}) => {
    const response = await api.get('/destinations/nearby', { params });
    return response.data.data; // List<NearbyDestinationResponse>
  }
};

export default destinationApi;
