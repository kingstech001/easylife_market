import { NextRequest, NextResponse } from "next/server"
import { setStorePlanAndEnforce } from "@/lib/subscriptions/enforceProductLimit"
import { connectToDB } from "@/lib/db"

/**
 * POST /api/stores/upgrade-plan
 * 
 * Updates a store's subscription plan and enforces product limits.
 * 
 * Request body: { 
 *   storeId: string, 
 *   plan: "free" | "basic" | "standard" | "premium",
 *   startDate?: string,
 *   endDate?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    await connectToDB()
    
    const body = await request.json()
    const { storeId, plan, startDate, endDate } = body

    if (!storeId || !plan) {
      return NextResponse.json(
        { error: "storeId and plan are required" },
        { status: 400 }
      )
    }

    if (!["free", "basic", "standard", "premium"].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan. Must be: free, basic, standard, or premium" },
        { status: 400 }
      )
    }


    const result = await setStorePlanAndEnforce(
      storeId,
      plan,
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    )

    return NextResponse.json(
      {
        success: true,
        message: `Store plan updated to ${plan} and product limit enforced`,
        plan,
        result,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("❌ upgrade-plan error:", error)
    return NextResponse.json(
      {
        error: "Server error",
        details: process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    )
  }
}