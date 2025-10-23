import { NextResponse } from "next/server"
import { connectToDB } from "@/lib/db"
import Customer from "@/models/Customer"

// ✅ GET all customers
export async function GET() {
  try {
    await connectToDB()
    const customers = await Customer.find().sort({ createdAt: -1 })
    return NextResponse.json(customers)
  } catch (error) {
    console.error("Error fetching customers:", error)
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 })
  }
}

// ✅ POST new customer
export async function POST(req: Request) {
  try {
    await connectToDB()
    const body = await req.json()
    const customer = await Customer.create(body)
    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error("Error creating customer:", error)
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 })
  }
}
