import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor to attach access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('travelsphere_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for consistent unwrapping and error messaging
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    let customMessage = error.response?.data?.message;
    if (error.response?.data?.validationErrors && Array.isArray(error.response.data.validationErrors)) {
      customMessage = error.response.data.validationErrors.map((v) => v.message).filter(Boolean).join(', ');
    } else if (error.response?.data?.errors) {
      customMessage = Object.values(error.response.data.errors).join(', ');
    }

    const friendlyError = new Error(
      customMessage ||
      (error.code === 'ECONNABORTED'
        ? 'Request timed out. Please verify backend connection.'
        : error.response?.status === 404
        ? 'The requested resource was not found.'
        : error.response?.status === 401
        ? 'Session expired or invalid credentials.'
        : error.response?.status === 403
        ? 'You do not have permission to perform this action.'
        : 'Unable to connect to TravelSphere server. Please try again.')
    );
    friendlyError.status = error.response?.status;
    friendlyError.errorCode = error.response?.data?.errorCode;
    friendlyError.original = error;
    return Promise.reject(friendlyError);
  }
);

export default api;
