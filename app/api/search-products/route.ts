// app/api/search-products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { searchProducts, SEARCH_PAGE_SIZE } from "@/lib/search-products";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  const q = (sp.get("search") || sp.get("q") || "").trim().slice(0, 100);
  const categories = sp.getAll("category").slice(0, 40);
  const page = Math.min(Math.max(1, Number(sp.get("page")) || 1), 200);

  try {
    const data = await searchProducts({
      q,
      categories,
      page,
      limit: SEARCH_PAGE_SIZE,
    });

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("[search-products] error:", error);
    return NextResponse.json(
      { message: "Failed to load products" },
      { status: 500 },
    );
  }
}