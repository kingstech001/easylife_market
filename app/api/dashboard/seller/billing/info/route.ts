import { type NextRequest, NextResponse } from "next/server"
import getUserFromCookies from "@/lib/getUserFromCookies"
import { connectToDB } from "@/lib/db"
import Store from "@/models/Store"
import mongoose from "mongoose"

export async function GET(request: Request) {
  await connectToDB()
  console.log("DB connected for GET billing info.")

  try {
    const user = await getUserFromCookies(request as NextRequest)
    if (!user) {
      console.log("❌ GET Billing Info: User not authenticated.")
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }
    console.log(`Debug: Authenticated user ID: ${user.id}`)

    const userStore = await Store.findOne({ sellerId: new mongoose.Types.ObjectId(user.id) })
    if (!userStore) {
      console.log(`❌ GET Billing Info: Store not found for seller ID ${user.id}.`)
      return NextResponse.json({ success: false, message: "Forbidden: Store not found for this user" }, { status: 403 })
    }
    console.log(`✅ GET Billing Info: Store found for seller ID ${user.id}: ${userStore.name} (${userStore._id}).`)

    // Default Free Plan for all users
    const currentPlan = {
      name: "Free Plan", // Plan name
      features: "1 store · 20 products", // Default Free Plan features
      price: 0, // Free plan price
      interval: "monthly", // You can still call it monthly for consistency
    }

    // Default: No payment method for free plan
    const paymentMethod = {
      exists: false,
      brand: null,
      last4: null,
    }

    console.log(`✅ GET Billing Info: Returning Free Plan for store ${userStore._id}.`)
    return NextResponse.json({ success: true, data: { currentPlan, paymentMethod } }, { status: 200 })
  } catch (error: any) {
    console.error("Error fetching billing info:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch billing info", error: error.message },
      { status: 500 },
    )
  }
}
