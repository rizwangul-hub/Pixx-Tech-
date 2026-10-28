import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import portalApi from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Check existing session status on initial boot
  const checkAuthStatus = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('pixxtech_token') : null;
    if (!token) {
      setCurrentUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await portalApi.getMe();
      if (res && res.success && res.user) {
        setCurrentUser(res.user);
        setAuthError(null);
      } else {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('pixxtech_token');
        }
        setCurrentUser(null);
      }
    } catch {
      // Unauthenticated session or expired token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pixxtech_token');
      }
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Authenticate user via email/username and password
  const login = async (emailOrUsername, password) => {
    try {
      setAuthError(null);
      const res = await portalApi.login({ email: emailOrUsername, password });
      if (res && res.success && res.user) {
        setCurrentUser(res.user);
        return { success: true, user: res.user };
      }
      throw new Error(res.message || 'Login failed');
    } catch (err) {
      const message = err.message || 'Invalid credentials. Please verify your email and password.';
      setAuthError(message);
      return { success: false, error: message };
    }
  };

  // Terminate central portal session
  const logout = async () => {
    try {
      await portalApi.logout();
    } catch (err) {
      console.warn('Logout error:', err.message);
    } finally {
      setCurrentUser(null);
    }
  };

  // Check specific permission against current user's role permissions
  const hasPermission = (permission) => {
    if (!currentUser || !currentUser.permissions) return false;
    return currentUser.permissions.includes(permission);
  };

  const isBoss = currentUser?.role === 'Boss';
  const isAuthenticated = Boolean(currentUser);
  const isRizwan = Boolean(
    currentUser && (
      (currentUser.name || '').toLowerCase().includes('rizwan') ||
      (currentUser.email || '').toLowerCase().includes('rizwan') ||
      (currentUser.username || '').toLowerCase().includes('rizwan')
    )
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        loading,
        authError,
        isAuthenticated,
        isBoss,
        isRizwan,
        hasPermission,
        login,
        logout,
        refreshProfile: checkAuthStatus,
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
