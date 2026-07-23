import { type NextRequest, NextResponse } from "next/server"
import { connectToDB } from "@/lib/db"
import Store from "@/models/Store"
import { requireApiRole } from "@/lib/apiAuth"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireApiRole(request, ["admin"])
    if (auth.response) return auth.response

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
