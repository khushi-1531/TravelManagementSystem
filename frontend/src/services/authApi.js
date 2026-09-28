import api from './api';

export const authApi = {
  login: async (credentials) => {
    // Backend supports 'identifier' (username or email)
    const payload = {
      identifier: credentials.identifier || credentials.usernameOrEmail || credentials.email,
      password: credentials.password
    };
    const response = await api.post('/auth/login', payload);
    return response.data.data; // AuthResponse
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data.data; // UserResponse
  },

  logout: async (refreshToken) => {
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch (err) {
      // Even if network fails, client logout proceeds
      console.warn('Backend logout encountered error:', err);
    }
  },

  refreshToken: async (refreshToken) => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data.data; // AuthResponse
  },

  getCurrentUser: async () => {
    const response = await api.get('/users/me');
    return response.data.data; // UserResponse
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/users/me', profileData);
    return response.data.data; // UserResponse
  }
};

export default authApi;
