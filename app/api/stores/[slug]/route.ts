import mongoose from "mongoose"
import { NextResponse } from "next/server"
import { connectToDB } from "@/lib/db"
import { getUserFromCookies } from "@/lib/auth"
import Store from "@/models/Store"
import StoreReview from "@/models/StoreReview"
import User from "@/models/User"

interface RouteParams {
  params: Promise<{ slug: string }>
}

interface StoreDocument {
  _id: any
  name?: string
  slug: string
  description?: string
  logo_url?: string
  banner_url?: string
  sellerId?: any
  createdAt?: Date
  updatedAt?: Date
}

function formatReview(doc: any) {
  return {
    id: doc?._id?.toString() || "",
    userId: doc?.userId?.toString() || "",
    reviewerName: doc?.reviewerName || "Anonymous",
    rating: doc?.rating || 0,
    comment: doc?.comment || "",
    createdAt: doc?.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: doc?.updatedAt?.toISOString() || new Date().toISOString(),
  }
}

async function getReviewStats(storeId: string) {
  const [stats] = await StoreReview.aggregate([
    {
      $match: {
        storeId: new mongoose.Types.ObjectId(storeId),
      },
    },
    {
      $group: {
        _id: "$storeId",
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ])

  return {
    averageRating:
      typeof stats?.averageRating === "number"
        ? Number(stats.averageRating.toFixed(1))
        : 0,
    reviewCount: stats?.reviewCount || 0,
  }
}

export async function GET(
  request: Request,
  { params }: RouteParams
) {
  try {
    // ✅ Await params (Next.js 15 requirement)
    const { slug } = await params


    // Validate slug
    if (!slug || typeof slug !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid store slug",
        },
        { status: 400 }
      )
    }

    await connectToDB()

    // Find store by slug
    const store = await Store.findOne({
      slug: slug,
      isPublished: true,
    }).lean<StoreDocument>()

    if (!store) {
      return NextResponse.json(
        {
          success: false,
          message: "Store not found",
        },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const include = searchParams.get("include")

    if (include === "reviews") {
      const reviews = await StoreReview.find({ storeId: store._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean()

      const stats = await getReviewStats(store._id.toString())

      return NextResponse.json(
        {
          success: true,
          reviews: reviews.map(formatReview),
          stats,
        },
        { status: 200 }
      )
    }

    // Transform store data
    const storeData = {
      id: store._id ? store._id.toString() : "",
      name: store.name || "Unnamed Store",
      slug: store.slug,
      description: store.description || "",
      logo_url: store.logo_url || "",
      banner_url: store.banner_url || "",
      owner_id: store.sellerId ? store.sellerId.toString() : "",
      created_at: store.createdAt ? store.createdAt.toISOString() : new Date().toISOString(),
      updated_at: store.updatedAt ? store.updatedAt.toISOString() : new Date().toISOString(),
    }

    return NextResponse.json(
      {
        success: true,
        store: storeData,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("❌ Error fetching store:", error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch store",
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: RouteParams
) {
  try {
    const user = await getUserFromCookies()

    if (!user?.id) {
      return NextResponse.json(
        { error: "Please log in to leave a review" },
        { status: 401 }
      )
    }

    const { slug } = await params
    const body = await request.json()

    if (body?.action !== "review") {
      return NextResponse.json(
        { error: "Unsupported action" },
        { status: 400 }
      )
    }

    const rating = Number(body?.rating)
    const comment = String(body?.comment || "").trim()

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Please select a rating between 1 and 5" },
        { status: 400 }
      )
    }

    if (comment.length < 10) {
      return NextResponse.json(
        { error: "Review comment must be at least 10 characters" },
        { status: 400 }
      )
    }

    if (comment.length > 500) {
      return NextResponse.json(
        { error: "Review comment must be 500 characters or less" },
        { status: 400 }
      )
    }

    await connectToDB()

    const [store, reviewer] = await Promise.all([
      Store.findOne({ slug, isPublished: true }).select("_id sellerId").lean(),
      User.findById(user.id).select("firstName lastName").lean(),
    ])

    if (!store?._id) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 })
    }

    if (store.sellerId?.toString() === user.id) {
      return NextResponse.json(
        { error: "You cannot review your own store" },
        { status: 403 }
      )
    }

    const reviewerDoc = Array.isArray(reviewer) ? reviewer[0] : reviewer
    const reviewerName = `${reviewerDoc?.firstName || ""} ${reviewerDoc?.lastName || ""}`.trim()

    if (!reviewerName) {
      return NextResponse.json(
        { error: "Unable to determine reviewer name" },
        { status: 400 }
      )
    }

    const existingReview = await StoreReview.findOne({
      storeId: store._id,
      userId: user.id,
    }).lean()

    const savedReview = await StoreReview.findOneAndUpdate(
      {
        storeId: store._id,
        userId: user.id,
      },
      {
        $set: {
          reviewerName,
          rating,
          comment,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    ).lean()

    const stats = await getReviewStats(store._id.toString())

    return NextResponse.json(
      {
        message: existingReview ? "Review updated successfully" : "Review added successfully",
        review: formatReview(savedReview),
        stats,
      },
      { status: existingReview ? 200 : 201 }
    )
  } catch (error: any) {
    console.error("❌ Error saving store review:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to save review",
      },
      { status: 500 }
    )
  }
}
