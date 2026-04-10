import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LocalStorageDB } from '../utils/localStorage';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'Admin' | 'Staff';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ error: any }>;
  signup: (email: string, password: string, name: string) => Promise<{ error: any }>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function LocalStorageAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      // Check for existing user session from localStorage
      const storedUser = localStorage.getItem('user');
      const storedToken = LocalStorageDB.getToken();

      // If we have a user but no token, clear the session
      if (storedUser && !storedToken) {
        localStorage.removeItem('user');
        setUser(null);
        setLoading(false);
        return;
      }

      if (storedUser && storedToken) {
        try {
          const parsedUser = JSON.parse(storedUser);
          
          // If user data is missing name field, fetch fresh user data
          if (!parsedUser.name) {
            console.log('User data missing name field, fetching fresh data...');
            console.log('Stored user data:', parsedUser);
            console.log('API_BASE_URL:', API_BASE_URL);
            try {
              const res = await fetch(`${API_BASE_URL}/auth/verify`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${storedToken}`,
                  'Content-Type': 'application/json',
                },
              });
              
              console.log('Verify response status:', res.status);
              
              if (res.ok) {
                const data = await res.json();
                console.log('Verify response data:', data);
                if (data.user && data.user.name) {
                  console.log('Got fresh user data with name:', data.user.name);
                  localStorage.setItem('user', JSON.stringify(data.user));
                  setUser(data.user);
                  setToken(storedToken);
                  LocalStorageDB.setToken(storedToken);
                } else {
                  console.log('Verify response missing name field');
                  setUser(parsedUser);
                  setToken(storedToken);
                  LocalStorageDB.setToken(storedToken);
                }
              } else {
                console.log('Verify request failed');
                setUser(parsedUser);
                setToken(storedToken);
                LocalStorageDB.setToken(storedToken);
              }
            } catch (error) {
              console.error('Failed to refresh user data:', error);
              setUser(parsedUser);
              setToken(storedToken);
              LocalStorageDB.setToken(storedToken);
            }
          } else {
            setUser(parsedUser);
            setToken(storedToken);
            // Migrate to the shared token key used by API wrapper
            LocalStorageDB.setToken(storedToken);
          }
        } catch (error) {
          localStorage.removeItem('user');
          LocalStorageDB.clearToken();
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const getApiBaseUrl = () => {
    if (process.env.REACT_APP_API_URL) {
      return process.env.REACT_APP_API_URL;
    }
    if (process.env.NODE_ENV === 'production') {
      return `${window.location.origin}/api`;
    }
    return 'http://localhost:5000/api';
  };

  const API_BASE_URL = getApiBaseUrl();

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      if (!email || !password) throw new Error('Invalid credentials');

      console.log('Attempting login to:', `${API_BASE_URL}/auth/login`);
      console.log('Login data:', { email });

      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      console.log('Login response status:', res.status);

      const data = await res.json().catch(() => null);
      console.log('Login response data:', data);

      if (!res.ok) {
        throw new Error(data?.message || 'Login failed');
      }

      // Store user data and token in localStorage for session persistence
      LocalStorageDB.setToken(data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setUser(data.user);
      setToken(data.token);

      setLoading(false);
      return { error: null };
    } catch (error: any) {
      console.error('Login error:', error);
      setLoading(false);
      return { error };
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      if (!email || !password || !name) throw new Error('Invalid signup data');

      console.log('Attempting signup to:', `${API_BASE_URL}/auth/signup`);
      console.log('Signup data:', { email, name });

      const res = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      console.log('Signup response status:', res.status);

      const data = await res.json().catch(() => null);
      console.log('Signup response data:', data);

      if (!res.ok) {
        throw new Error(data?.message || 'Signup failed');
      }

      // Auto-login after signup
      const loginResult = await login(email, password);
      setLoading(false);
      return loginResult;
    } catch (error: any) {
      console.error('Signup error:', error);
      setLoading(false);
      return { error };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    LocalStorageDB.clearToken();
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
