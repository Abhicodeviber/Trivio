import { NextRequest, NextResponse } from 'next/server';

// Middleware runs on the Edge runtime — jsonwebtoken is Node-only.
// Decode the JWT payload with plain base64 (no crypto verification needed here;
// API routes do the real cryptographic check).
function decodeJWTPayload(token: string): { role?: string } | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

const PROTECTED: { path: string; role: string }[] = [
  { path: '/dashboard/admin',    role: 'admin' },
  { path: '/dashboard/provider', role: 'provider' },
  { path: '/dashboard/customer', role: 'customer' },
  { path: '/dashboard/vendor',   role: 'vendor' },
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const rule = PROTECTED.find((p) => pathname.startsWith(p.path));
  if (!rule) return NextResponse.next();

  const token = req.cookies.get('token')?.value;
  if (!token) {
    const url = new URL('/login', req.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  const payload = decodeJWTPayload(token);
  if (!payload || payload.role !== rule.role) {
    const url = new URL('/login', req.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
