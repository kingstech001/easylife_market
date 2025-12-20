// app/api/dashboard/seller/subscription/current/route.ts

import { NextRequest, NextResponse } from "next/server"
import { connectToDB } from "@/lib/db"
import Store, { type IStore } from "@/models/Store"
import { getUserFromCookies } from "@/lib/auth"
import mongoose, { type HydratedDocument } from "mongoose"

// Product limits per plan (null = unlimited)
const PRODUCT_LIMITS: Record<string, number | null> = {
  free: 10,
  basic: 20,
  standard: 50,
  premium: null,
}

// Utility to check if a plan is expired
function isPlanExpired(endDate?: Date | null): boolean {
  if (!endDate) return false
  return new Date().getTime() > new Date(endDate).getTime()
}

// Type for the response
interface SubscriptionResponse {
  success: boolean
  storeId: string
  storeName: string
  email?: string
  plan: string
  startDate: Date | null
  endDate: Date | null
  expired: boolean
}

// GET method - more RESTful for fetching data
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromCookies()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.role !== "seller") {
      return NextResponse.json(
        { error: "Access denied. Seller role required." },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const queryStoreId = searchParams.get("storeId")

    await connectToDB()

    let store: HydratedDocument<IStore> | null = null

    if (queryStoreId === "current") {
      store = await Store.findOne({ sellerId: user.id })
    } else if (queryStoreId) {
      if (!mongoose.Types.ObjectId.isValid(queryStoreId)) {
        return NextResponse.json(
          { error: "Invalid store ID format" },
          { status: 400 }
        )
      }
      store = await Store.findOne({ _id: queryStoreId, sellerId: user.id })
    } else {
      return NextResponse.json(
        { error: "Store ID is required" },
        { status: 400 }
      )
    }

    if (!store) {
      return NextResponse.json(
        { error: "Store not found or access denied" },
        { status: 404 }
      )
    }

    const expired = isPlanExpired(store.subscriptionExpiryDate)
    let currentPlan = store.subscriptionPlan || "free"

    // ✅ Auto downgrade if plan expired
    if (expired && currentPlan !== "free") {
      console.log(`⚠️  Plan expired for store ${store._id}, downgrading to free`)

      store.subscriptionPlan = "free"
      store.subscriptionStartDate = undefined
      store.subscriptionExpiryDate = undefined
      await store.save()
      currentPlan = "free"
    }

    const response: SubscriptionResponse = {
      success: true,
      storeId: (store._id as mongoose.Types.ObjectId).toString(),
      storeName: store.name,
      email: store.email || user.email,
      plan: currentPlan,
      startDate: store.subscriptionStartDate || null,
      endDate: store.subscriptionExpiryDate || null,
      expired,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error: any) {
    console.error("Fetch subscription error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}

// POST method - for backwards compatibility
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromCookies()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.role !== "seller") {
      return NextResponse.json(
        { error: "Access denied. Seller role required." },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { storeId: bodyStoreId } = body

    await connectToDB()

    let store: HydratedDocument<IStore> | null = null

    if (bodyStoreId === "current") {
      store = await Store.findOne({ sellerId: user.id })
    } else if (bodyStoreId) {
      if (!mongoose.Types.ObjectId.isValid(bodyStoreId)) {
        return NextResponse.json(
          { error: "Invalid store ID format" },
          { status: 400 }
        )
      }
      store = await Store.findOne({ _id: bodyStoreId, sellerId: user.id })
    } else {
      return NextResponse.json(
        { error: "Store ID is required" },
        { status: 400 }
      )
    }

    if (!store) {
      return NextResponse.json(
        { error: "Store not found or access denied" },
        { status: 404 }
      )
    }

    const expired = isPlanExpired(store.subscriptionExpiryDate)
    let currentPlan = store.subscriptionPlan || "free"

    // ✅ Auto downgrade if plan expired
    if (expired && currentPlan !== "free") {
      console.log(`⚠️  Plan expired for store ${store._id}, downgrading to free`)

      store.subscriptionPlan = "free"
      store.subscriptionStartDate = undefined
      store.subscriptionExpiryDate = undefined
      await store.save()
      currentPlan = "free"
    }

    const response: SubscriptionResponse = {
      success: true,
      storeId: (store._id as mongoose.Types.ObjectId).toString(),
      storeName: store.name,
      email: store.email || user.email,
      plan: currentPlan,
      startDate: store.subscriptionStartDate || null,
      endDate: store.subscriptionExpiryDate || null,
      expired,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error: any) {
    console.error("Fetch subscription error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}