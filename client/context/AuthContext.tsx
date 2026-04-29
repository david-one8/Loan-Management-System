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

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TOKEN_KEY = 'lms_token';
const COOKIE_NAME = 'lms_token';

function setTokenCookie(token: string): void {
  // Session cookie — removed when browser closes; adjust Max-Age for persistence
  document.cookie = `${COOKIE_NAME}=${token}; path=/; SameSite=Strict`;
}

function clearTokenCookie(): void {
  document.cookie = `${COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

function tokenToUser(token: string): User | null {
  const payload = decodeJWTPayload<JWTPayload>(token);
  if (!payload) return null;

  // Check token expiry
  if (payload.exp && Date.now() / 1000 > payload.exp) return null;

  const id = payload._id ?? payload.id ?? payload.sub ?? '';
  const email = payload.email ?? '';
  const role = payload.role ?? 'borrower';

  if (!id || !email) return null;

  return { _id: id, email, role };
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Hydrate auth state from localStorage on first mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(TOKEN_KEY);
      if (stored) {
        const decoded = tokenToUser(stored);
        if (decoded) {
          setToken(stored);
          setUser(decoded);
          // Keep cookie in sync in case it was cleared
          setTokenCookie(stored);
        } else {
          // Token is invalid or expired — clean up
          localStorage.removeItem(TOKEN_KEY);
          clearTokenCookie();
        }
      }
    } catch {
      // localStorage may be blocked in certain environments
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Call after a successful login/register API response.
   * Saves token to localStorage + cookie, decodes user, updates state.
   */
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
      // Swallow storage errors
    }
    setToken(newToken);
    setUser(decoded);
  }, []);

  /**
   * Clear all auth state and redirect to /login.
   */
  const logout = useCallback(() => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      clearTokenCookie();
    } catch {
      // Swallow storage errors
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

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Access the global auth context.
 * Must be called inside a component wrapped by <AuthProvider>.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth() must be called within an <AuthProvider>.');
  }
  return ctx;
}