import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { logoutUser, fetchMe } from '../api/auth';
import { setCsrfToken, clearCsrfToken, startTokenRefresh, stopTokenRefresh } from '../api/apiClient';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // Load user from localStorage on mount
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(true);

  // Verify session on mount
  useEffect(() => {
    const verifySession = async () => {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          // Verify the session is still valid
          const result = await fetchMe();
          if (result.success) {
            setUser(result.data);
            localStorage.setItem('user', JSON.stringify(result.data));
          } else {
            // Session expired
            setUser(null);
            localStorage.removeItem('user');
          }
        } catch (error) {
          console.error('Session verification failed:', error);
          setUser(null);
          localStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };

    verifySession();
  }, []);

  // Save user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
      stopTokenRefresh();
    }
  }, [user]);

  // Listen for token expiration events
  useEffect(() => {
    const handleAuthExpired = () => {
      setUser(null);
      clearCsrfToken();
      stopTokenRefresh();
    };
    
    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, []);

  const login = useCallback((userData) => {
    // Handle both formats: { user, csrfToken, expiresIn } or just user object
    const userInfo = userData.user || userData;
    setUser(userInfo);
    
    // Store CSRF token in memory
    if (userData.csrfToken) {
      setCsrfToken(userData.csrfToken);
    }
    
    // Start token refresh timer
    startTokenRefresh();
  }, []);

  const logout = useCallback(async () => {
    // Call backend to clear httpOnly cookies
    await logoutUser();
    setUser(null);
  }, []);

  const isAuthenticated = useCallback(() => {
    return user !== null;
  }, [user]);

  const value = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
