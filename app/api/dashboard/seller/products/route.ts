import { NextResponse } from "next/server"
import Store from "@/models/Store"
import Product from "@/models/Product"
import { getUserFromCookies } from "@/lib/auth"
import { connectToDB } from "@/lib/db"

export async function GET(req: Request) {
  try {
    await connectToDB()

    const user = await getUserFromCookies()
    if (!user || (user.role !== "seller" && user.role !== "admin")) {
      return NextResponse.json(
        { message: "Unauthorized. Only sellers or admins can access this route." },
        { status: 401 },
      )
    }

    let store
    if (user.role === "admin") {
      // For admin: find store where admin user ID is the sellerId
      store = await Store.findOne({ sellerId: user.id })
    } else {
      // For seller: find store by sellerId (same logic as admin now)
      store = await Store.findOne({ sellerId: user.id })
    }

    if (!store) {
      return NextResponse.json({ message: "Store not found." }, { status: 404 })
    }

    const products = await Product.find({ storeId: store._id }).sort({ createdAt: -1 })

    // ✅ FIX: Convert Mongoose documents to plain objects and ensure _id is preserved
    const productsWithId = products.map(product => {
      const productObj = product.toObject()
      return {
        ...productObj,
        _id: productObj._id.toString(), // Explicitly keep _id as string
      }
    })

    return NextResponse.json({ store, products: productsWithId }, { status: 200 })
  } catch (error) {
    console.error("GET /api/seller/products error:", error)
    return NextResponse.json({ message: "Internal Server Error", error: String(error) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await connectToDB()

    const user = await getUserFromCookies()
    if (!user || (user.role !== "seller" && user.role !== "admin")) {
      return NextResponse.json({ message: "Unauthorized. Only sellers or admins can add products." }, { status: 401 })
    }

    const body = await req.json()
    const { name, description, price, compareAtPrice, category, inventoryQuantity, images, storeId } = body

    if (!name || !price || inventoryQuantity === undefined || !storeId) {
      return NextResponse.json(
        {
          message: "Missing required product fields (name, price, inventoryQuantity, storeId)",
        },
        { status: 400 },
      )
    }

    let store
    if (user.role === "admin") {
      store = await Store.findById(storeId)
    } else {
      store = await Store.findOne({ _id: storeId, sellerId: user.id })
    }

    if (!store) {
      return NextResponse.json({ message: "Store not found or does not belong to this user" }, { status: 404 })
    }

    const productCount = await Product.countDocuments({ storeId: store._id })
    if (productCount >= 10) {
      return NextResponse.json(
        { message: "You can only have 10 products for now." },
        { status: 400 }
      )
    }

    const product = await Product.create({
      name,
      description,
      price,
      compareAtPrice,
      category,
      inventoryQuantity,
      images,
      storeId: store._id,
      sellerId: user.id,
    })

    // ✅ FIX: Convert to plain object with _id preserved
    const productObj = product.toObject()
    const productWithId = {
      ...productObj,
      _id: productObj._id.toString(),
    }

    return NextResponse.json({ success: true, product: productWithId }, { status: 201 })
  } catch (error: any) {
    console.error("POST /api/seller/products error:", error)
    if (error.code === 11000) {
      return NextResponse.json({ message: "A product with this name already exists in your store." }, { status: 409 })
    }
    return NextResponse.json({ message: "Failed to create product", error: String(error) }, { status: 500 })
  }
}