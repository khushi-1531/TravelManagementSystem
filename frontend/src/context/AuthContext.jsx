import React, { createContext, useContext, useState, useEffect } from 'react';
import authApi from '../services/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('travelsphere_access_token'));
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('travelsphere_refresh_token'));
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and verify authentication on app start
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('travelsphere_access_token');
      if (storedToken) {
        try {
          const userData = await authApi.getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.warn('Initial auth verification failed:', error.message);
          // If refresh token exists, try refresh
          const storedRefresh = localStorage.getItem('travelsphere_refresh_token');
          if (storedRefresh) {
            try {
              const refreshed = await authApi.refreshToken(storedRefresh);
              localStorage.setItem('travelsphere_access_token', refreshed.accessToken);
              localStorage.setItem('travelsphere_refresh_token', refreshed.refreshToken);
              setAccessToken(refreshed.accessToken);
              setRefreshToken(refreshed.refreshToken);
              setUser(refreshed.user);
            } catch {
              clearAuth();
            }
          } else {
            clearAuth();
          }
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const clearAuth = () => {
    localStorage.removeItem('travelsphere_access_token');
    localStorage.removeItem('travelsphere_refresh_token');
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  };

  const login = async (credentials) => {
    const authData = await authApi.login(credentials);
    localStorage.setItem('travelsphere_access_token', authData.accessToken);
    localStorage.setItem('travelsphere_refresh_token', authData.refreshToken);
    setAccessToken(authData.accessToken);
    setRefreshToken(authData.refreshToken);
    setUser(authData.user);
    return authData;
  };

  const register = async (userData) => {
    const registeredUser = await authApi.register(userData);
    return registeredUser;
  };

  const logout = async () => {
    const token = localStorage.getItem('travelsphere_refresh_token');
    await authApi.logout(token);
    clearAuth();
  };

  const refreshProfile = async () => {
    try {
      const userData = await authApi.getCurrentUser();
      setUser(userData);
      return userData;
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
      throw err;
    }
  };

  const isAdmin = Boolean(
    user?.roles && (user.roles.includes('ROLE_ADMIN') || user.roles.includes('ADMIN'))
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        isAuthenticated: !!accessToken && !!user,
        isAdmin,
        isLoading,
        login,
        register,
        logout,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
