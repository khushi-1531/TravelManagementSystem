import api from './api';

export const hotelApi = {
  getHotels: async (params = {}) => {
    const response = await api.get('/hotels', { params });
    return response.data.data; // PageResponse<HotelResponse>
  },

  getHotelById: async (id) => {
    const response = await api.get(`/hotels/${id}`);
    return response.data.data; // HotelResponse
  },

  getRoomsByHotel: async (hotelId) => {
    const response = await api.get(`/hotels/${hotelId}/rooms`);
    return response.data.data; // List<HotelRoomResponse>
  },

  getRoomById: async (roomId) => {
    const response = await api.get(`/hotel-rooms/${roomId}`);
    return response.data.data; // HotelRoomResponse
  }
};

export default hotelApi;
