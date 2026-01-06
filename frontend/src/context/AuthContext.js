import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AuthContext = createContext(null);

// Configure axios to prevent caching
axios.defaults.headers.common['Cache-Control'] = 'no-cache, no-store, must-revalidate';
axios.defaults.headers.common['Pragma'] = 'no-cache';
axios.defaults.headers.common['Expires'] = '0';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const fetchUser = useCallback(async (forceRefresh = false) => {
    try {
      // Add cache-busting parameter
      const cacheBuster = forceRefresh ? `?_t=${Date.now()}` : '';
      const response = await axios.get(`${API}/auth/me${cacheBuster}`);
      setUser(response.data);
      // Store last refresh timestamp
      localStorage.setItem('lastUserRefresh', Date.now().toString());
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('lastUserRefresh');
      setToken(null);
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser(true); // Force refresh on mount
    } else {
      setLoading(false);
    }
  }, [token, fetchUser]);

  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password });
    const { token: newToken, user: userData } = response.data;
    localStorage.setItem('token', newToken);
    localStorage.setItem('lastUserRefresh', Date.now().toString());
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(userData);
    setLastRefresh(Date.now());
    return userData;
  };

  const register = async (userData) => {
    const response = await axios.post(`${API}/auth/register`, userData);
    const { token: newToken, user: newUser } = response.data;
    localStorage.setItem('token', newToken);
    localStorage.setItem('lastUserRefresh', Date.now().toString());
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(newUser);
    setLastRefresh(Date.now());
    return newUser;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('lastUserRefresh');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  const refreshUser = useCallback(async () => {
    if (token) {
      await fetchUser(true);
      setLastRefresh(Date.now());
    }
  }, [token, fetchUser]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, token }}>
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
