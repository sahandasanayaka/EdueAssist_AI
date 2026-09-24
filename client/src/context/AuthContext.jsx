import { createContext, useContext, useState, useEffect, useRef } from 'react';
import authApi from '../services/authApi';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const initializeAuth = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        localStorage.removeItem('user');
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        // Fetch authoritative profile from /api/auth/me using token
        const res = await authApi.getMe();
        if (res?.success && res?.data) {
          const freshUser = {
            id: res.data.id,
            reg_number: res.data.username || res.data.reg_number,
            role: res.data.role,
            profile: res.data.profile,
            name: res.data.profile?.fullName || res.data.username || res.data.reg_number
          };
          setUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
        } else {
          throw new Error('Malformed identity response');
        }
      } catch (err) {
        // Token is invalid, expired, or rejected
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (reg_number, password) => {
    try {
      const response = await authApi.login(reg_number, password);
      const { token, user: userData } = response;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Authentication failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
