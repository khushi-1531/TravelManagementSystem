import api from './api';

export const weatherApi = {
  /**
   * Retrieves weather conditions and 5-day forecast by coordinates.
   */
  getByCoordinates: async (latitude, longitude, locationName) => {
    const response = await api.get('/weather', {
      params: { latitude, longitude, locationName }
    });
    return response.data.data; // WeatherResponse
  },

  /**
   * Retrieves live weather for a specific destination by ID.
   */
  getDestinationWeather: async (destinationId) => {
    const response = await api.get(`/destinations/${destinationId}/weather`);
    return response.data.data; // WeatherResponse
  },

  /**
   * Retrieves live weather for a specific place of interest by ID.
   */
  getPlaceWeather: async (placeId) => {
    const response = await api.get(`/weather/place/${placeId}`);
    return response.data.data; // WeatherResponse
  }
};

export default weatherApi;
