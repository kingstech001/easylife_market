import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/db"
import Store from "@/models/Store";

/**
 * GET /api/stores/coordinates?ids=id1,id2,id3
 * Returns store coordinates for delivery fee calculation.
 */
export async function GET(req: NextRequest) {
  try {
    const idsParam = req.nextUrl.searchParams.get("ids");
    if (!idsParam) {
      return NextResponse.json(
        { error: "Missing 'ids' query parameter" },
        { status: 400 }
      );
    }

    const storeIds = idsParam
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (storeIds.length === 0) {
      return NextResponse.json(
        { error: "No valid store IDs provided" },
        { status: 400 }
      );
    }

    await connectToDB();

    const stores = await Store.find(
      { _id: { $in: storeIds } },
      { _id: 1, name: 1, "location.coordinates": 1, "location.address": 1 }
    ).lean();

    const result = stores.map((store: any) => ({
      storeId: store._id.toString(),
      name: store.name,
      coordinates: store.location?.coordinates || null,
      address: store.location?.address || null,
    }));

    return NextResponse.json({ stores: result });
  } catch (error) {
    console.error("Error fetching store coordinates:", error);
    return NextResponse.json(
      { error: "Failed to fetch store coordinates" },
      { status: 500 }
    );
  }
}
