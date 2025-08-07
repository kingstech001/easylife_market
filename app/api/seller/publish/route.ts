import { NextResponse } from "next/server"
import { getUserFromCookies } from "@/lib/auth"
import Store from "@/models/Store"
import { connectToDB } from "@/lib/db" 

export async function PATCH(req: Request) {
  try {
    console.log("PATCH /api/seller/store/publish: Attempting to connect to DB...")
    await connectToDB()
    console.log("PATCH /api/seller/store/publish: DB connected. Checking user authentication...")

    const user = await getUserFromCookies()
    if (!user || user.role !== "seller") {
      console.log("PATCH /api/seller/store/publish: Unauthorized user or not a seller.")
      return NextResponse.json({ error: "Unauthorized. Only sellers can publish stores." }, { status: 401 })
    }
    console.log("PATCH /api/seller/store/publish: User authenticated as seller:", user.id)

    let body: { storeId?: string }
    try {
      const text = await req.text()
      console.log("PATCH /api/seller/store/publish: Raw request body text:", text)
      if (!text.trim()) {
        console.log("PATCH /api/seller/store/publish: Request body is empty.")
        return NextResponse.json({ error: "Request body cannot be empty" }, { status: 400 })
      }
      body = JSON.parse(text)
      console.log("PATCH /api/seller/store/publish: Parsed request body:", body)
    } catch (parseError) {
      console.error("PATCH /api/seller/store/publish: Invalid JSON in request body:", parseError)
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    }

    const { storeId } = body

    if (!storeId) {
      console.log("PATCH /api/seller/store/publish: Store ID is missing from request body.")
      return NextResponse.json({ error: "Store ID is required in the request body" }, { status: 400 })
    }
    console.log("PATCH /api/seller/store/publish: Received storeId:", storeId)

    // Find and update the store, ensuring it belongs to the authenticated seller
    const updatedStore = await Store.findOneAndUpdate(
      { _id: storeId, sellerId: user.id },
      { isPublished: true }, // Set isPublished to true
      { new: true }, // Return the updated document
    )

    if (!updatedStore) {
      console.log("PATCH /api/seller/store/publish: Store not found or does not belong to this seller.")
      return NextResponse.json(
        { error: "Store not found or you don't have permission to publish it." },
        { status: 404 },
      )
    }
    console.log("PATCH /api/seller/store/publish: Store published successfully:", updatedStore.name)

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
