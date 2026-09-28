import api from './api';

export const mapApi = {
  /**
   * Retrieves all catalogue map markers with optional filters (type, category, destinationId, query, featuredOnly).
   */
  getItems: async (params = {}) => {
    const response = await api.get('/map/items', { params });
    return response.data.data; // List<MapItemResponse>
  },

  /**
   * Retrieves nearby places, destinations, and hotels within radiusKm of provided coordinates.
   */
  getNearby: async (params = {}) => {
    const response = await api.get('/map/nearby', { params });
    return response.data.data; // List<MapItemResponse>
  },

  /**
   * Performs unified search querying both catalogue places and external geocoded spots.
   */
  search: async (query, limit = 10) => {
    const response = await api.get('/map/search', { params: { query, limit } });
    return response.data.data; // { query, catalogueItems, externalItems, ... }
  },

  /**
   * Specifically queries nearby places of interest.
   */
  getNearbyPlaces: async (params = {}) => {
    const response = await api.get('/places/nearby', { params });
    return response.data.data; // List<NearbyPlaceResponse>
  },

  /**
   * Specifically queries nearby destinations.
   */
  getNearbyDestinations: async (params = {}) => {
    const response = await api.get('/destinations/nearby', { params });
    return response.data.data; // List<NearbyDestinationResponse>
  }
};

export default mapApi;
