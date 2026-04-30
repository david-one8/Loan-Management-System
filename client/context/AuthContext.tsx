'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/types';
import { decodeJWTPayload } from '@/lib/utils';

interface JWTPayload {
  _id?: string;
  id?: string;
  sub?: string;
  email?: string;
  role?: User['role'];
  exp?: number;
  iat?: number;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'lms_token';
const COOKIE_NAME = 'lms_token';

function setTokenCookie(token: string): void {
  document.cookie = `${COOKIE_NAME}=${token}; path=/; SameSite=Strict`;
}

function clearTokenCookie(): void {
  document.cookie = `${COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

function tokenToUser(token: string): User | null {
  const payload = decodeJWTPayload<JWTPayload>(token);
  if (!payload) return null;

  if (payload.exp && Date.now() / 1000 > payload.exp) return null;

  const id = payload._id ?? payload.id ?? payload.sub ?? '';
  const email = payload.email ?? '';
  const role = payload.role ?? 'borrower';

  if (!id || !email) return null;

  return { _id: id, email, role };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try {
        const stored = localStorage.getItem(TOKEN_KEY);
        if (stored) {
          const decoded = tokenToUser(stored);
          if (decoded) {
            setToken(stored);
            setUser(decoded);
            setTokenCookie(stored);
          } else {
            localStorage.removeItem(TOKEN_KEY);
            clearTokenCookie();
          }
        }
      } catch {
        // localStorage may be blocked in certain environments.
      } finally {
        setIsLoading(false);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const login = useCallback((newToken: string) => {
    const decoded = tokenToUser(newToken);
    if (!decoded) {
      console.error('[AuthContext] login() received an invalid or expired token');
      return;
    }

    try {
      localStorage.setItem(TOKEN_KEY, newToken);
      setTokenCookie(newToken);
    } catch {
      // Storage errors should not prevent in-memory auth state.
    }

    setToken(newToken);
    setUser(decoded);
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      clearTokenCookie();
    } catch {
      // Storage errors should not block logout.
    }

    setToken(null);
    setUser(null);
    router.push('/login');
  }, [router]);

  const value: AuthContextValue = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth() must be called within an <AuthProvider>.');
  }
  return ctx;
}
