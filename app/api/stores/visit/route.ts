import { NextResponse } from "next/server"
import { connectToDB } from "@/lib/db"
import Visit from "@/models/Visit"

/**
 * POST /api/stores/visit
 * Body: { storeId: string, userId?: string | null }
 * Records a visit document (storeId required). Prevents duplicate writes within a short window.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body.storeId !== "string" || !body.storeId.trim()) {
      return NextResponse.json({ error: "Missing or invalid storeId" }, { status: 400 })
    }

    await connectToDB()

    const headers = request.headers
    const ip =
      headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headers.get("x-real-ip") ||
      headers.get("cf-connecting-ip") ||
      "unknown"
    const userAgent = headers.get("user-agent") || ""

    // dedupe window in ms (configurable via env, default 5 minutes)
    const dedupeWindowMs = Number(process.env.VISIT_DEDUPE_MS) || 5 * 60 * 1000
    const cutoff = new Date(Date.now() - dedupeWindowMs)

    // build $or filter: prefer userId match if provided, otherwise match by ip
    const orClauses: any[] = []
    if (body.userId) orClauses.push({ userId: body.userId })
    orClauses.push({ ip })

    // look for an existing recent visit for same store by same user or same ip
    const recent = await Visit.findOne({
      storeId: body.storeId,
      createdAt: { $gt: cutoff },
      $or: orClauses,
    }).lean()

    if (recent) {
      // recent visit exists — skip creating duplicate
      return NextResponse.json({ success: true, skipped: true }, { status: 200 })
    }

    // create visit record
    await Visit.create({
      storeId: body.storeId,
      userId: body.userId || undefined,
      ip,
      userAgent,
    })

    return NextResponse.json({ success: true, skipped: false }, { status: 201 })
  } catch (err) {
    console.error("Error logging store visit:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}