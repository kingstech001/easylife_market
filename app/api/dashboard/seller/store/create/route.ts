// app/api/dashboard/seller/store/create/route.ts

import { NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { connectToDB } from "@/lib/db";
import Store from "@/models/Store";

// Zod validation schema
const storeSchema = z.object({
  name: z.string().min(3, { message: "Store name must be at least 3 characters" }),
  slug: z.string().min(3).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "Invalid slug format",
  }),
  description: z.string().optional(),
  logo_url: z.string().optional(),
  banner_url: z.string().optional(),
  categories: z.array(z.string()).optional(),
  location: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    // Connect to DB
    await connectToDB();

    // Extract user from JWT in cookie
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    
    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized. Please log in to create a store." },
        { status: 401 }
      );
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    const sellerId = payload.id as string;

    console.log("📦 Store creation request from user:", sellerId);

    // Parse and validate body
    const body = await req.json();
    const parsed = storeSchema.safeParse(body);
    
    if (!parsed.success) {
      console.log("❌ Validation failed:", parsed.error.flatten().fieldErrors);
      return NextResponse.json(
        { 
          message: "Invalid input data", 
          errors: parsed.error.flatten().fieldErrors 
        },
        { status: 400 }
      );
    }

    const { name, slug, description, logo_url, banner_url, categories, location } = parsed.data;

    // Check if user already has a store
    const existingUserStore = await Store.findOne({ sellerId });
    if (existingUserStore) {
      return NextResponse.json(
        { message: "You already have a store. Each seller can only create one store." },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingSlugStore = await Store.findOne({ slug });
    if (existingSlugStore) {
      return NextResponse.json(
        { message: "This store URL is already taken. Please choose a different name." },
        { status: 409 }
      );
    }

    // Prepare store data
    const storeData: any = {
      name: name.trim(),
      slug,
      description: description?.trim() || "",
      sellerId,
      logo_url: logo_url || "",
      banner_url: banner_url || "",
      categories: categories || [],
    };

    // Only add location if address is provided
    if (location && location.trim().length > 0) {
      storeData.location = {
        type: "Point",
        coordinates: [0, 0], // Will be geocoded in pre-save hook
        address: location.trim(),
      };
      console.log("📍 Location provided:", location.trim());
    }

    console.log("💾 Creating store:", {
      name: storeData.name,
      slug: storeData.slug,
      hasLocation: !!storeData.location,
      categoriesCount: storeData.categories.length,
    });

    // Create store
    const store = await Store.create(storeData);

    console.log("✅ Store created successfully:", {
      id: store._id,
      name: store.name,
      slug: store.slug,
    });

    return NextResponse.json(
      {
        message: "Store created successfully!",
        store: {
          _id: store._id,
          name: store.name,
          slug: store.slug,
          description: store.description,
          logo_url: store.logo_url,
          banner_url: store.banner_url,
          categories: store.categories,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("❌ Store creation error:", err);

    // Handle duplicate key error
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0];
      return NextResponse.json(
        { message: `A store with this ${field || "value"} already exists.` },
        { status: 400 }
      );
    }

    // Handle validation errors
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e: any) => e.message);
      console.error("Validation errors:", errors);
      return NextResponse.json(
        {
          message: "Validation failed",
          errors,
        },
        { status: 400 }
      );
    }

    // Generic error
    return NextResponse.json(
      { message: "Failed to create store. Please try again." },
      { status: 500 }
    );
  }
}