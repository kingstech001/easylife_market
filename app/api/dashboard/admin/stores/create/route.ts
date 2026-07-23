import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { connectToDB } from "@/lib/db"
import Store from "@/models/Store"
import { requireApiRole } from "@/lib/apiAuth"

const storeSchema = z.object({
  name: z.string().min(3),
  slug: z.string().min(3).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "Invalid slug format",
  }),
  description: z.string().optional(),
  logo_url: z.string().optional(),
  banner_url: z.string().optional(),
  categories: z.array(z.string()).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiRole(req, ["admin"])
    if (auth.response) return auth.response

    await connectToDB()

    const body = await req.json()
    const parsed = storeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { name, slug, description, logo_url, banner_url, categories } = parsed.data

    const existing = await Store.findOne({ slug })
    if (existing) {
      return NextResponse.json({ message: "Slug already in use" }, { status: 409 })
    }

    const store = await Store.create({
      name,
      slug,
      description,
      sellerId: auth.user!.id,
      logo_url,
      banner_url,
      categories: categories || [],
    })

    return NextResponse.json({ store }, { status: 201 })
  } catch (err) {
    console.error("Store creation error:", err)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
