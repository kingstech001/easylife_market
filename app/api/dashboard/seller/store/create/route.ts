// app/api/stores/create/route.ts

import { NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { connectToDB } from "@/lib/db";
import Store from "@/models/Store";

// Zod validation schema
const storeSchema = z.object({
  name: z.string().min(3),
  slug: z.string().min(3).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "Invalid slug format",
  }),
  description: z.string().optional(),
  logo_url: z.string().optional(),
  banner_url: z.string().optional(),
  categories: z.array(z.string()).optional(), // <-- Accept array of strings
});

export async function POST(req: Request) {
  try {
    // Connect to DB
    await connectToDB();

    // Extract user from JWT in cookie
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);

    const sellerId = payload.id as string; // ✅ Use user ID from JWT

    // Parse body
    const body = await req.json();
    const parsed = storeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, slug, description, logo_url, banner_url, categories } = parsed.data;

    // Check if slug already exists
    const existing = await Store.findOne({ slug });
    if (existing) {
      return NextResponse.json(
        { message: "Slug already in use" },
        { status: 409 }
      );
    }

    // Create store
    const store = await Store.create({
      name,
      slug,
      description,
      sellerId,
      logo_url,
      banner_url,
      categories: categories || [], // <-- Save categories
    });

    return NextResponse.json({ store }, { status: 201 });
  } catch (err) {
    console.error("Store creation error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
