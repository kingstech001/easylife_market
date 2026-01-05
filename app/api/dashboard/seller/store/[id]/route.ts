import { NextResponse } from "next/server"
import { connectToDB } from "@/lib/db"
import Store from "@/models/Store"
import { getUserFromCookies } from "@/lib/auth"

// GET STORE BY ID
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    await connectToDB()
    const user = await getUserFromCookies()

    if (!user || user.role !== "seller") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const store = await Store.findOne({ _id: id, sellerId: user.id })

    if (!store) {
      return new NextResponse("Store not found or not owned by user", { status: 404 })
    }

    return NextResponse.json({ store })
  } catch (error) {
    console.error("Error fetching store:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

// UPDATE STORE BY ID
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    await connectToDB()
    const user = await getUserFromCookies()

    if (!user || user.role !== "seller") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await request.json()
    const allowedFields = ["name", "slug", "description", "isPublished"]
    const updates: Record<string, any> = {}

    for (const key of allowedFields) {
      if (key in body) updates[key] = body[key]
    }

    const store = await Store.findOneAndUpdate(
      { _id: id, sellerId: user.id },
      updates,
      { new: true }
    )

    if (!store) {
      return new NextResponse("Store not found or not owned by user", { status: 404 })
    }

    return NextResponse.json({ message: "Store updated successfully", store })
  } catch (error) {
    console.error("Error updating store:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}