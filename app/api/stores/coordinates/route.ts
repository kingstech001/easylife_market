import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/db"
import Store from "@/models/Store";
import Product from "@/models/Product";
import mongoose from "mongoose";

/**
 * GET /api/stores/coordinates?ids=id1,id2,id3&productIds=id1,id2
 * Returns store coordinates for delivery fee calculation.
 */
export async function GET(req: NextRequest) {
  try {
    const idsParam = req.nextUrl.searchParams.get("ids");
    const productIdsParam = req.nextUrl.searchParams.get("productIds");
    if (!idsParam && !productIdsParam) {
      return NextResponse.json(
        { error: "Missing 'ids' or 'productIds' query parameter" },
        { status: 400 }
      );
    }

    const submittedStoreIds = (idsParam || "")
      .split(",")
      .map((id) => id.trim())
      .filter((id) => mongoose.Types.ObjectId.isValid(id));

    const productIds = (productIdsParam || "")
      .split(",")
      .map((id) => id.trim())
      .filter((id) => mongoose.Types.ObjectId.isValid(id));

    await connectToDB();

    const products = productIds.length
      ? await Product.find(
          { _id: { $in: productIds } },
          { storeId: 1 }
        ).lean()
      : [];

    const storeIds = Array.from(
      new Set([
        ...submittedStoreIds,
        ...products
          .map((product: any) => product.storeId?.toString())
          .filter(Boolean),
      ])
    );

    if (storeIds.length === 0) {
      return NextResponse.json({ stores: [] });
    }

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
