import { NextResponse } from "next/server";
import { getUserFromCookies } from "@/lib/auth";
import Store from "@/models/Store";
import { connectToDB } from "@/lib/db";

export async function PATCH(req: Request) {
  try {
    console.log("PATCH /api/store/publish: Connecting to DB...");
    await connectToDB();

    const user = await getUserFromCookies();
    if (!user || (user.role !== "seller" && user.role !== "admin")) {
      console.log("PATCH /api/store/publish: Unauthorized user.");
      return NextResponse.json(
        { error: "Unauthorized. Only sellers or admins can publish stores." },
        { status: 401 }
      );
    }
    console.log("PATCH /api/store/publish: User authenticated:", user.id, user.role);

    // Parse request body
    let body: { storeId?: string };
    try {
      const text = await req.text();
      if (!text.trim()) {
        return NextResponse.json({ error: "Request body cannot be empty" }, { status: 400 });
      }
      body = JSON.parse(text);
    } catch (parseError) {
      console.error("Invalid JSON:", parseError);
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    const { storeId } = body;
    if (!storeId) {
      return NextResponse.json({ error: "Store ID is required in the request body" }, { status: 400 });
    }

    // Admin can publish any store, seller only their own
    const query = user.role === "admin" ? { _id: storeId } : { _id: storeId, sellerId: user.id };

    const updatedStore = await Store.findOneAndUpdate(
      query,
      { isPublished: true },
      { new: true }
    );

    if (!updatedStore) {
      return NextResponse.json(
        { error: "Store not found or you don't have permission to publish it." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Store published successfully",
        store: updatedStore,
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("PATCH /api/store/publish error:", error);
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 });
  }
}
