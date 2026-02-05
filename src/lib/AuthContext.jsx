import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { authAPI } from '@/api/apiClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  // Check for existing token on mount
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);
      
      const token = localStorage.getItem('cratey_access_token');
      
      if (!token) {
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
        return;
      }

      // Verify token and get user data
      const response = await authAPI.me();
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Auth check failed:', error);
      
      // Clear invalid token
      if (error.response?.status === 401) {
        localStorage.removeItem('cratey_access_token');
        setAuthError({
          type: 'auth_required',
          message: 'Session expired. Please log in again.'
        });
      } else {
        setAuthError({
          type: 'unknown',
          message: error.message || 'Failed to verify authentication'
        });
      }
      
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoadingAuth(false);
      setIsLoadingPublicSettings(false);
    }
  };

  const login = async (credentials) => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);
      
      const response = await authAPI.login(credentials);
      const { token, user: userData } = response.data;
      
      localStorage.setItem('cratey_access_token', token);
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Login failed';
      setAuthError({
        type: 'login_failed',
        message: errorMessage
      });
      return { success: false, error: errorMessage };
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const register = async (data) => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);
      
      const response = await authAPI.register(data);
      const { token, user: userData } = response.data;
      
      localStorage.setItem('cratey_access_token', token);
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      console.error('Registration failed:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Registration failed';
      setAuthError({
        type: 'register_failed',
        message: errorMessage
      });
      return { success: false, error: errorMessage };
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = useCallback((shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('cratey_access_token');
    
    if (shouldRedirect) {
      window.location.href = '/login';
    }
  }, []);

  const navigateToLogin = useCallback(() => {
    window.location.href = '/login';
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const value = {
    user,
    isAuthenticated,
    isLoadingAuth,
    isLoadingPublicSettings,
    authError,
    appPublicSettings,
    login,
    register,
    logout,
    navigateToLogin,
    checkAuthState,
    updateUser,
    clearAuthError,
  };

  return (
    <AuthContext.Provider value={value}>
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
