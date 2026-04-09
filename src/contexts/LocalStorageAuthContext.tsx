import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LocalStorageDB } from '../utils/localStorage';

interface User {
  id: string;
  email: string;
  role: 'Admin' | 'Staff';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ error: any }>;
  signup: (email: string, password: string) => Promise<{ error: any }>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function LocalStorageAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing user session
    const currentUser = LocalStorageDB.getCurrentUser();
    const token = LocalStorageDB.getToken();

    // If we have a user but no token, clear the session to avoid 401s.
    if (currentUser && !token) {
      LocalStorageDB.logout();
      setUser(null);
      setLoading(false);
      return;
    }

    setUser(currentUser);
    setLoading(false);
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

      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || 'Login failed');
      }

      LocalStorageDB.setToken(data.token);
      LocalStorageDB.setCurrentUser(data.user);
      setUser(data.user);

      setLoading(false);
      return { error: null };
    } catch (error: any) {
      setLoading(false);
      return { error };
    }
  };

  const signup = async (email: string, password: string) => {
    setLoading(true);
    try {
      if (!email || !password) throw new Error('Invalid signup data');

      const res = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || 'Signup failed');
      }

      // Auto-login after signup
      const loginResult = await login(email, password);
      setLoading(false);
      return loginResult;
    } catch (error: any) {
      setLoading(false);
      return { error };
    }
  };

  const logout = () => {
    setUser(null);
    LocalStorageDB.logout();
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
