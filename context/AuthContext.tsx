'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

interface User {
  id: string;
  email: string;
  role: 'user' | 'seller' | 'admin';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
  register: (userData: registerData) => Promise<Response>;
  login: (email: string, password: string) => Promise<Response>;
  checkSellerStore: () => Promise<boolean>;
  logout: () => Promise<void>;
}

type registerData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'user' | 'seller' | 'admin';
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/me', { credentials: 'include' });
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = await res.json();
      setUser(data?.user ?? null);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (userData: registerData) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(userData),
    });
    // Do not automatically fetch user here — backend may require email verification
    return res;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      await fetchUser();
    }
    return res;
  }, [fetchUser]);

  const checkSellerStore = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/dashboard/seller/store', {
        method: 'GET',
        credentials: 'include',
      });
      if (res.status === 200) return true;
      if (res.status === 404) return false;
      return false;
    } catch (error) {
      console.error('Error checking seller store:', error);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await fetchUser();
    })();
    return () => {
      mounted = false;
    };
  }, [fetchUser]);

  const value = useMemo(
    () => ({ user, loading, refresh: fetchUser, register, login, checkSellerStore, logout }),
    [user, loading, fetchUser, register, login, checkSellerStore, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
