import { NextResponse } from "next/server"
import { connectToDB } from "@/lib/db"
import Store from "@/models/Store"

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params

    console.log("API: Fetching store with slug:", slug)

    await connectToDB()

    const store = await Store.findOne({
      slug: slug,
      isPublished: true,
    })

    console.log("API: Found store:", store ? store.name : "Not found")

    if (!store) {
      console.log("API: Store not found for slug:", slug)
      return NextResponse.json(
        {
          success: false,
          message: "Store not found",
        },
        { status: 404 },
      )
    }

    console.log("API: Returning store:", store.name)
    return NextResponse.json(
      {
        success: true,
        store: {
          id: store._id.toString(),
          name: store.name,
          slug: store.slug,
          description: store.description,
          logo_url: store.logo_url,
          banner_url: store.banner_url,
          owner_id: store.owner_id?.toString(),
          created_at: store.createdAt,
          updated_at: store.updatedAt,
        },
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("API Error fetching store:", error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch store",
      },
      { status: 500 },
    )
  }
}
