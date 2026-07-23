import { type NextRequest, NextResponse } from "next/server"
import { connectToDB } from "@/lib/db"
import Customer from "@/models/Customer"
import { requireApiRole } from "@/lib/apiAuth"

// ✅ GET all customers
export async function GET(req: NextRequest) {
  try {
    const auth = await requireApiRole(req, ["seller", "admin"])
    if (auth.response) return auth.response

    await connectToDB()
    const url = new URL(req.url)
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10))
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50", 10)))
    const skip = (page - 1) * limit

    const [totalCount, customers] = await Promise.all([
      Customer.countDocuments({}),
      Customer.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ])
    return NextResponse.json({
      customers,
      pagination: { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit), hasMore: skip + limit < totalCount },
    })
  } catch (error) {
    console.error("Error fetching customers:", error)
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 })
  }
}

// ✅ POST new customer
export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiRole(req, ["seller", "admin"])
    if (auth.response) return auth.response

    await connectToDB()
    const body = await req.json()
    const customer = await Customer.create(body)
    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error("Error creating customer:", error)
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 })
  }
}
