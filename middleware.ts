// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value;

  // If there's no token, block access and redirect
  if (!token) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Optional: verify and decode token to enforce role-based logic
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Example: block non-admins from accessing /dashboard/admin
    if (
      req.nextUrl.pathname.startsWith('/dashboard/admin') &&
      decoded.role !== 'admin'
    ) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // You can add similar checks for /dashboard/seller etc.
  } catch (err) {
    // Token is invalid or expired
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/orders/:path*',
    // Add other protected routes as needed
  ],
};
