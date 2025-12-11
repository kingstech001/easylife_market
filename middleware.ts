import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// ===== Rate Limiting Store =====
// 5 requests per 10 seconds per IP
const RATE_LIMIT_WINDOW = 10 * 1000;
const RATE_LIMIT_MAX = 5;

const ipHits: Record<string, { count: number; time: number }> = {};

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const path = req.nextUrl.pathname;

  // ====== IP DETECTION (Correct for Next.js Middleware) ======
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = forwarded
    ? forwarded.split(",")[0].trim()
    : req.headers.get("x-real-ip");
  const ip = realIp || "unknown";

  // ====== RATE LIMITING ======
  const now = Date.now();

  if (!ipHits[ip]) {
    ipHits[ip] = { count: 1, time: now };
  } else {
    const elapsed = now - ipHits[ip].time;

    if (elapsed > RATE_LIMIT_WINDOW) {
      // Reset window
      ipHits[ip] = { count: 1, time: now };
    } else {
      // Increase request count
      ipHits[ip].count++;

      // Block if limit exceeded
      if (ipHits[ip].count > RATE_LIMIT_MAX) {
        return new NextResponse(
          JSON.stringify({ message: "Too many requests. Please slow down." }),
          {
            status: 429,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }
  }
  // ====== END RATE LIMITING ======

  // ===== PUBLIC ROUTES =====
  const publicPaths = [
    "/",
    "/auth/login",
    "/auth/signup",
    "/checkout/payment-success", // Allow Paystack callback
    "/dashboard/seller/subscriptions/success", // Allow subscription callback
  ];
  const isPublic = publicPaths.some((p) => path === p);

  if (!token) {
    if (isPublic) return NextResponse.next(); // allow home/login/signup
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);

    // Root route → redirect based on role
    if (path === "/") {
      if (payload.role === "seller")
        return NextResponse.redirect(new URL("/dashboard/seller", req.url));

      if (payload.role === "admin")
        return NextResponse.redirect(new URL("/dashboard/admin", req.url));
    }

    // Admin access rules
    if (path.startsWith("/dashboard/admin") && payload.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Seller access rules
    if (path.startsWith("/dashboard/seller")) {
      if (payload.role !== "seller")
        return NextResponse.redirect(new URL("/", req.url));

      // Ensure seller has a store
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

    // Buyer access rules
    if (path.startsWith("/dashboard/buyer") && payload.role !== "buyer") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Checkout limited to buyers
    if (path.startsWith("/checkout") && payload.role !== "buyer") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  } catch (err) {
    console.error("JWT verification failed:", err);
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  return NextResponse.next();
}

// ===== ROUTE MATCHER =====
export const config = {
  matcher: [
    "/", // home
    "/dashboard/:path*", // all dashboards
    "/profile/:path*", // profile pages
    "/orders/:path*", // orders
    "/checkout/:path*", // checkout
  ],
};
