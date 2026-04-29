import { NextRequest, NextResponse } from 'next/server';

// ─── Types ────────────────────────────────────────────────────────────────────

type Role =
  | 'admin'
  | 'sales'
  | 'sanction'
  | 'disbursement'
  | 'collection'
  | 'borrower';

interface JWTPayload {
  _id?: string;
  id?: string;
  sub?: string;
  email?: string;
  role?: Role;
  exp?: number;
}

// ─── JWT Decode (Edge-compatible) ─────────────────────────────────────────────

function decodeToken(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // base64url → base64
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    // Pad to multiple of 4
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);

    const json = atob(padded);
    return JSON.parse(json) as JWTPayload;
  } catch {
    return null;
  }
}

function isExpired(payload: JWTPayload): boolean {
  if (!payload.exp) return false;
  return Date.now() / 1000 > payload.exp;
}

// ─── Route Matchers ───────────────────────────────────────────────────────────

function isApplyRoute(pathname: string): boolean {
  return pathname.startsWith('/apply');
}

function isDashboardRoute(pathname: string): boolean {
  return pathname.startsWith('/dashboard');
}

function isAuthRoute(pathname: string): boolean {
  return pathname === '/login' || pathname === '/register';
}

function getHomeForRole(role: Role): string {
  return role === 'borrower' ? '/apply/personal' : '/dashboard';
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read token from the cookie (localStorage is not available on edge)
  const rawToken = request.cookies.get('lms_token')?.value ?? null;

  let payload: JWTPayload | null = null;

  if (rawToken) {
    payload = decodeToken(rawToken);
    // Treat expired tokens as absent
    if (payload && isExpired(payload)) {
      payload = null;
    }
  }

  const role = payload?.role ?? null;
  const isLoggedIn = !!payload && !!role;

  // ── Redirect already-authenticated users away from auth pages ────────────
  if (isAuthRoute(pathname)) {
    if (isLoggedIn && role) {
      const home = getHomeForRole(role);
      return NextResponse.redirect(new URL(home, request.url));
    }
    return NextResponse.next();
  }

  // ── Protect /apply/* → borrower only ─────────────────────────────────────
  if (isApplyRoute(pathname)) {
    if (!isLoggedIn) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (role !== 'borrower') {
      // Non-borrowers should go to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // ── Protect /dashboard/* → non-borrower roles only ───────────────────────
  if (isDashboardRoute(pathname)) {
    if (!isLoggedIn) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (role === 'borrower') {
      // Borrowers should go to their apply flow
      return NextResponse.redirect(new URL('/apply/personal', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

// ─── Config ───────────────────────────────────────────────────────────────────

export const config = {
  matcher: [
    '/login',
    '/register',
    '/apply/:path*',
    '/dashboard/:path*',
  ],
};