import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const path = req.nextUrl.pathname;

  // Public paths
  const publicPaths = ["/", "/auth/login", "/auth/signup"];
  const isPublic = publicPaths.some((p) => path === p);

  // If no token → allow public routes only
  if (!token) {
    if (isPublic) return NextResponse.next();
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);

    // Redirect seller/admin away from home
    if (path === "/") {
      if (payload.role === "seller")
        return NextResponse.redirect(new URL("/dashboard/seller", req.url));

      if (payload.role === "admin")
        return NextResponse.redirect(new URL("/dashboard/admin", req.url));
    }

    // Admin routes
    if (path.startsWith("/dashboard/admin") && payload.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Seller routes
    if (path.startsWith("/dashboard/seller")) {
      if (payload.role !== "seller")
        return NextResponse.redirect(new URL("/", req.url));

      // Check if seller has a store
      const storeRes = await fetch(
        `${req.nextUrl.origin}/api/dashboard/seller/store`,
        {
          headers: { Cookie: `token=${token}` },
        }
      );

      if (storeRes.status === 404 && path !== "/create-store") {
        return NextResponse.redirect(new URL("/create-store", req.url));
      }
    }

    // Buyer routes
    if (path.startsWith("/dashboard/buyer") && payload.role !== "buyer") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Checkout access
    if (path.startsWith("/checkout") && payload.role !== "buyer") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  } catch (err) {
    console.error("JWT verification failed:", err);
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  return NextResponse.next();
}

// Match which routes use middleware
export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/profile/:path*",
    "/orders/:path*",
    "/checkout/:path*",
  ],
};
