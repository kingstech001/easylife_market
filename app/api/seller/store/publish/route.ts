import { NextResponse } from "next/server"
import { getUserFromCookies } from "@/lib/auth"
import Store from "@/models/Store"
import { connectToDB } from "@/lib/db"

export async function PATCH(req: Request)     {
  try {
    await connectToDB() // Ensure database connection

    const user = await getUserFromCookies()
    if (!user || user.role !== "seller") {
      return NextResponse.json({ error: "Unauthorized. Only sellers can publish stores." }, { status: 401 })
    }

    let body: { storeId?: string }
    try {
      body = await req.json()
    } catch (parseError) {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    }

    const { storeId } = body

    if (!storeId) {
      return NextResponse.json({ error: "Store ID is required in the request body" }, { status: 400 })
    }

    // Find and update the store, ensuring it belongs to the authenticated seller
    const updatedStore = await Store.findOneAndUpdate(
      { _id: storeId, sellerId: user.id },
      { isPublished: true }, // Set isPublished to true
      { new: true }, // Return the updated document
    )

    if (!updatedStore) {
      return NextResponse.json(
        { error: "Store not found or you don't have permission to publish it." },
        { status: 404 },
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: "Store published successfully",
        store: updatedStore, // Return the actual updated store object
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("PATCH /api/seller/store/publish error:", error)
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 })
  }
}
