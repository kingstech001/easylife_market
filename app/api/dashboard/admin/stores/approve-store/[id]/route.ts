import { NextResponse } from "next/server"
import { connectToDB } from "@/lib/db"
import Store from "@/models/Store"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await connectToDB()

    // Approve the store
    const updatedStore = await Store.findByIdAndUpdate(id, { isApproved: true }, { new: true })

    if (!updatedStore) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 })
    }

    return NextResponse.json({
      message: "Store approved successfully",
      store: updatedStore,
    })
  } catch (error) {
    console.error("Error approving store:", error)
    return NextResponse.json({ error: "Failed to approve store" }, { status: 500 })
  }
}
