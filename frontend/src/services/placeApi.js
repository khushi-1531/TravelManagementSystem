import api from './api';

export const placeApi = {
  getPlaces: async (params = {}) => {
    const response = await api.get('/places', { params });
    return response.data.data; // PageResponse<PlaceResponse>
  },

  getPlaceById: async (id) => {
    const response = await api.get(`/places/${id}`);
    return response.data.data; // PlaceResponse
  },

  getNearbyPlaces: async (params = {}) => {
    const response = await api.get('/places/nearby', { params });
    return response.data.data; // List<NearbyPlaceResponse>
  }
};

export default placeApi;
