import { type NextRequest, NextResponse } from "next/server"
import { connectToDB } from "@/lib/db"
import Product from "@/models/Product"
import { requireApiRole } from "@/lib/apiAuth"

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ storeId: string }> },
) {
  try {
    const auth = await requireApiRole(req, ["admin"])
    if (auth.response) return auth.response

    const { storeId } = await context.params

    await connectToDB()

    const products = await Product.find({ storeId }).lean()

    return NextResponse.json(products)
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json(
      { message: "Failed to fetch products" },
      { status: 500 },
    )
  }
}
