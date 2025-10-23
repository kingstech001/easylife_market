import { NextResponse } from "next/server"
import { connectToDB } from "@/lib/db"
import Store from "@/models/Store"
import Product from "@/models/Product"
import Order from "@/models/Order"
import Visit from "@/models/Visit"
import { getUserFromCookies } from "@/lib/auth"

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  try {
    await connectToDB()

    const user = await getUserFromCookies()
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // ✅ Step 1: Check if store exists
    const store = await Store.findById(id)
    if (!store) {
      return NextResponse.json({ message: "Store not found" }, { status: 404 })
    }

    // Optional: Ensure the user is the owner of the store (if not admin)
    if (store.sellerId.toString() !== user.id && user.role !== "admin") {
      return NextResponse.json({ message: "Access denied" }, { status: 403 })
    }

    // ✅ Step 2: Delete related documents
    await Promise.all([
      Product.deleteMany({ storeId: id }),
      Order.deleteMany({ storeId: id }),
      Visit.deleteMany({ storeId: id }),
      Store.findByIdAndDelete(id),
    ])

    return NextResponse.json(
      { message: "Store and all related data deleted successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting store:", error)
    return NextResponse.json(
      { message: "Failed to delete store", error: (error as Error).message },
      { status: 500 }
    )
  }
}
