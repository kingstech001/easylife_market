import { NextResponse } from "next/server"
import { connectToDB } from "@/lib/db" // Ensure this path is correct
import Store from "@/models/Store"
import Product from "@/models/Product"
import { getUserFromCookies } from "@/lib/auth" // Import getUserFromCookies

export async function GET() {
  try {
    console.log("Attempting to connect to DB for products...")
    await connectToDB()
    console.log("DB connected for products. Checking for token...")

    const user = await getUserFromCookies()

    if (!user || user.role !== "seller") {
      return NextResponse.json({ message: "Unauthorized. Only sellers can view their products." }, { status: 401 })
    }

    console.log("User authenticated for products. Seller ID:", user.id)

    // Find the store associated with the seller
    console.log("Searching for store for products with sellerId:", user.id)
    const store = await Store.findOne({ sellerId: user.id })

    console.log("Store found for products:", store ? store.name : "None")

    if (!store) {
      return NextResponse.json({ message: "Store not found for this seller" }, { status: 404 })
    }

    // Find products belonging to this store
    console.log("Searching for products for storeId:", store._id)
    const products = await Product.find({ storeId: store._id }).sort({ createdAt: -1 })

    console.log("Products found:", products.length)

    return NextResponse.json({ products }, { status: 200 })
  } catch (error: any) {
    console.error("Error fetching seller products:", error)
    return NextResponse.json({ message: "Failed to fetch seller products" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await connectToDB() // Ensure database connection

    const user = await getUserFromCookies()
    if (!user || user.role !== "seller") {
      return NextResponse.json({ message: "Unauthorized. Only sellers can add products." }, { status: 401 })
    }

    const body = await req.json()
    const { name, description, price, compareAtPrice, category, inventoryQuantity, images, storeId } = body

    // Basic validation
    if (!name || !price || inventoryQuantity === undefined || !storeId) {
      return NextResponse.json(
        { message: "Missing required product fields (name, price, inventoryQuantity, storeId)" },
        { status: 400 },
      )
    }

    // Verify that the storeId provided in the body belongs to the authenticated seller
    const store = await Store.findOne({ _id: storeId, sellerId: user.id })
    if (!store) {
      return NextResponse.json({ message: "Store not found or does not belong to this seller" }, { status: 404 })
    }

    // Log the data being passed to Product.create for debugging
    console.log("Creating product with data:", {
      name,
      description,
      price,
      compareAtPrice,
      category,
      inventoryQuantity,
      images,
      storeId: store._id,
      sellerId: user.id, // Explicitly add sellerId here
    })

    const product = await Product.create({
      name,
      description,
      price,
      compareAtPrice,
      category,
      inventoryQuantity,
      images,
      storeId: store._id, // Use the validated store's ID
      sellerId: user.id, // Add sellerId here to satisfy potential schema requirement
    })

    return NextResponse.json({ success: true, product }, { status: 201 })
  } catch (error: any) {
    console.error("Error creating product:", error)
    // Handle duplicate name error if product name is unique (though not currently enforced in schema)
    if (error.code === 11000) {
      return NextResponse.json({ message: "A product with this name already exists in your store." }, { status: 409 })
    }
    return NextResponse.json({ message: "Failed to create product", error: String(error) }, { status: 500 })
  }
}
