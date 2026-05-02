'use client';
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export interface AuthUser {
  _id: string;
  name?: string;
  shopName?: string;
  ownerName?: string;
  email: string;
  role: 'customer' | 'provider' | 'admin' | 'vendor';
  avatar?: string;
  phone?: string;
  location?: string;
  skills?: string[];
  isApproved?: boolean;
  city?: string;
  description?: string;
  logo?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  signup: (
    name: string,
    email: string,
    password: string,
    role: 'customer' | 'provider' | 'vendor',
    extra?: Record<string, unknown>,
  ) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const login = async (email: string, password: string): Promise<AuthUser> => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    let data: { user?: AuthUser; error?: string };
    try { data = await res.json(); }
    catch { throw new Error('Server error — please try again.'); }
    if (!res.ok) throw new Error(data.error ?? 'Login failed');
    setUser(data.user!);
    return data.user!;
  };

  const signup = async (
    name: string,
    email: string,
    password: string,
    role: 'customer' | 'provider' | 'vendor',
    extra: Record<string, unknown> = {},
  ): Promise<AuthUser> => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role, ...extra }),
    });
    let data: { user?: AuthUser; error?: string };
    try { data = await res.json(); }
    catch { throw new Error('Server error — please try again.'); }
    if (!res.ok) throw new Error(data.error ?? 'Signup failed');
    setUser(data.user!);
    return data.user!;
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
