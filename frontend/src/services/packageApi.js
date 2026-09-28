import api from './api';

export const packageApi = {
  getPackages: async (params = {}) => {
    const response = await api.get('/packages', { params });
    return response.data.data; // PageResponse<PackageResponse>
  },

  getPackageById: async (id) => {
    const response = await api.get(`/packages/${id}`);
    return response.data.data; // PackageResponse
  },

  getPackageItems: async (packageId) => {
    const response = await api.get(`/packages/${packageId}/items`);
    return response.data.data; // List<PackageItemResponse>
  }
};

export default packageApi;
