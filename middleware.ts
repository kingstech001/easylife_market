import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value;

  const path = req.nextUrl.pathname;

  // 🔐 Allow access to public routes if unauthenticated
  if (!token) {
    const publicPaths = ['/', '/auth/login', '/auth/signup'];
    const isPublic = publicPaths.some((p) => path === p);

    if (isPublic) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);

    // 🔐 Restrict home page access for seller
    if (path === '/' && payload.role === 'seller') {
      return NextResponse.redirect(new URL('/dashboard/seller', req.url));
    }
    if (path === '/' && payload.role === 'admin'){
    return NextResponse.redirect(new URL('/dashboard/admin', req.url))
    }

    // 🔐 Admin dashboard access
    if (path.startsWith('/dashboard/admin') && payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // 🔐 Seller dashboard access + store check
    if (path.startsWith('/dashboard/seller')) {
      if (payload.role !== 'seller') {
        return NextResponse.redirect(new URL('/', req.url));
      }

      // 🔐 Check if seller has a store
      const storeRes = await fetch(`${req.nextUrl.origin}/api/dashboard/seller/store`, {
        headers: {
          Cookie: `token=${token}`,
        },
      });

      if (storeRes.status === 404 && path !== '/create-store') {
        return NextResponse.redirect(new URL('/create-store', req.url));
      }
    }

    // 🔐 Buyer dashboard access
    if (path.startsWith('/dashboard/buyer') && payload.role !== 'buyer') {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // 🔐 checkout access
    if (path.startsWith('/checkout') && payload.role !== 'buyer') {
      return NextResponse.redirect(new URL('/', req.url));
    }

  } catch (err) {
    console.error('JWT verification failed:', err);
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/profile/:path*',
    '/orders/:path*',
    '/checkout/:path*',
  ],
};

export const runtime = 'nodejs';
