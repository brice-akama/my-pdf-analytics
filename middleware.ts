import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ========================================
  // ADMIN ROUTES PROTECTION
  // ========================================
  if (pathname.startsWith('/admin')) {
    const adminToken = request.cookies.get('auth_token')?.value;

    if (!adminToken) {
      return NextResponse.redirect(new URL('/admin/secure-login', request.url));
    }

    try {
      jwt.verify(adminToken, process.env.JWT_SECRET_KEY || 'default_secret');
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // ========================================
  // USER ROUTES PROTECTION & TOKEN REFRESH
  // ========================================
  const userToken = request.cookies.get('token')?.value;

  // ✅ FIX: Allow /dashboard to render even without token initially
  // The page itself will handle redirects if needed
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    if (!userToken) {
      // Only redirect if this is NOT a fresh navigation (has referrer)
      const referer = request.headers.get('referer');
      const isFromSignup = referer?.includes('/signup') || referer?.includes('/login');
      
      // If coming from signup/login, let it through - the page will check auth
      if (isFromSignup) {
        return NextResponse.next();
      }
      
      // Otherwise redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // No user token for other routes
  if (!userToken) {
    return NextResponse.next();
  }

  // User token exists - check if it needs refresh
  try {
    const decoded = jwt.decode(userToken) as { exp: number; userId: string; email: string } | null;
    
    if (decoded?.exp) {
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = decoded.exp - now;
      
      // If token expires in less than 1 day, refresh it silently
      if (timeUntilExpiry < 86400 && timeUntilExpiry > 0) {
        const newToken = jwt.sign(
          { userId: decoded.userId, email: decoded.email },
          process.env.JWT_SECRET!,
          { expiresIn: '7d' }
        );

        const response = NextResponse.next();
        response.cookies.set('token', newToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 60 * 24 * 7,
          path: '/'
        });

        return response;
      }

      // Token expired
      if (timeUntilExpiry <= 0) {
        if (pathname.startsWith('/dashboard')) {
          return NextResponse.redirect(new URL('/login', request.url));
        }
      }
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    // If token is invalid and trying to access dashboard, redirect to login
    if (pathname.startsWith('/dashboard')) {
      const referer = request.headers.get('referer');
      const isFromSignup = referer?.includes('/signup') || referer?.includes('/login');
      
      if (!isFromSignup) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/api/:path*'
  ]
};