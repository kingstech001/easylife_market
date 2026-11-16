import { NextRequest, NextResponse } from "next/server";
import { discoveryDay, getDiscoveryBatch } from "@/lib/discovery-products";

export async function GET(request: NextRequest) {
  const page = Number(request.nextUrl.searchParams.get("page") || "1");
  const today = discoveryDay();
  const day = request.nextUrl.searchParams.get("day") || today;
  // Let a scrolling session finish across midnight without switching its daily seed.
  const yesterday = discoveryDay(Date.now() - 24 * 60 * 60 * 1000);
  if (!Number.isSafeInteger(page) || page < 1 || page > 10000 || ![today, yesterday].includes(day)) {
    return NextResponse.json({ success: false, message: "Invalid discovery page or day. Please refresh the page." }, { status: 400 });
  }
  try {
    return NextResponse.json({ success: true, ...await getDiscoveryBatch(page, day) });
  } catch (error) {
    console.error("Error fetching discovery picks:", error);
    return NextResponse.json({ success: false, message: "Unable to load picks. Please try again." }, { status: 500 });
  }
}
