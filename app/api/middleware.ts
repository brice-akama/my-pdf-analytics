import { NextResponse } from 'next/server';
import { cookies } from 'next/headers'; // Import cookies from next/headers
import jwt from 'jsonwebtoken';

// Middleware for admin routes
export async function middleware(req: Request) {             
  const cookieStore = await cookies(); // Await the Promise to get the cookies
  const token = cookieStore.get('auth_token')?.value; // Access the value of the auth_token cookie

  if (!token) {
    return NextResponse.redirect(new URL('/admin/secure-login', req.url)); // Redirect to login if no token
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET_KEY || 'default_secret');
    return NextResponse.next(); // Continue to the next request if valid
  } catch {
    return NextResponse.redirect(new URL('/admin/login', req.url)); // Redirect if token is invalid
  }
}

// Define which paths should trigger the middleware
export const config = {
  matcher: ['/admin/*'], // Apply the middleware to all routes under /admin
};