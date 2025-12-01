import { type NextRequest, NextResponse } from "next/server"
import Product from "@/models/Product"
import getUserFromCookies from "@/lib/getUserFromCookies"
import Store from "@/models/Store"
import { connectToDB } from "@/lib/db"
import mongoose from "mongoose"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  await connectToDB()
  console.log("DB connected for GET product.")

  try {
    const user = await getUserFromCookies(request as NextRequest)

    if (!user) {
      console.log("❌ GET Product: User not authenticated.")
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    console.log(`Debug: Authenticated user ID: ${user.id}`)

    const userStore = await Store.findOne({ sellerId: new mongoose.Types.ObjectId(user.id) })

    if (!userStore) {
      console.log(`❌ GET Product: Store not found for seller ID ${user.id}.`)
      return NextResponse.json(
        { success: false, message: "Forbidden: Store not found for this user" },
        { status: 403 },
      )
    }

    console.log(`✅ GET Product: Store found for seller ID ${user.id}: ${userStore.name} (${userStore._id}).`)

    const { id } = await Promise.resolve(params)

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log(`❌ GET Product: Invalid product ID format: ${id}.`)
      return NextResponse.json({ success: false, message: "Invalid product ID format" }, { status: 400 })
    }

    const product = await Product.findById(id)

    if (!product) {
      console.log(`❌ GET Product: Product with ID ${id} not found.`)
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 })
    }

    if (product.storeId.toString() !== userStore._id.toString()) {
      console.log(
        `❌ GET Product: User ${user.id} attempted to access product ${id} not owned by their store (${product.storeId}).`,
      )
      return NextResponse.json(
        { success: false, message: "Forbidden: You are not the owner of this product" },
        { status: 403 },
      )
    }

    console.log(`✅ GET Product: Product ${id} fetched successfully by store ${userStore._id}.`)
    return NextResponse.json({ success: true, product }, { status: 200 })
  } catch (error: any) {
    console.error("Error fetching product:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch product", error: error.message },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  await connectToDB()
  console.log("DB connected for PUT product.")

  try {
    const user = await getUserFromCookies(request as NextRequest)

    if (!user) {
      console.log("❌ PUT Product: User not authenticated.")
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    console.log(`Debug: Authenticated user ID: ${user.id}`)

    const userStore = await Store.findOne({ sellerId: new mongoose.Types.ObjectId(user.id) })

    if (!userStore) {
      console.log(`❌ PUT Product: Store not found for seller ID ${user.id}.`)

      const allStores = await Store.find({}, { sellerId: 1, name: 1 }).limit(5)
      console.log(
        "Sample stores in DB (sellerId field):",
        allStores.map((s) => ({ id: s._id, sellerId: s.sellerId, name: s.name })),
      )

      return NextResponse.json(
        { success: false, message: "Forbidden: Store not found for this user" },
        { status: 403 },
      )
    }

    console.log(`✅ PUT Product: Store found for seller ID ${user.id}: ${userStore.name} (${userStore._id}).`)

    const { id } = await Promise.resolve(params)

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log(`❌ PUT Product: Invalid product ID format: ${id}.`)
      return NextResponse.json({ success: false, message: "Invalid product ID format" }, { status: 400 })
    }

    const product = await Product.findById(id)

    if (!product) {
      console.log(`❌ PUT Product: Product with ID ${id} not found.`)
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 })
    }

    if (product.storeId.toString() !== userStore._id.toString()) {
      console.log(
        `❌ PUT Product: User ${user.id} attempted to update product ${id} not owned by their store (${product.storeId}).`,
      )
      return NextResponse.json(
        { success: false, message: "Forbidden: You are not the owner of this product" },
        { status: 403 },
      )
    }
    
    const updates = await request.json()

    product.name = updates.name ?? product.name
    product.description = updates.description ?? product.description
    product.price = updates.price ?? product.price
    product.compareAtPrice = updates.compareAtPrice ?? product.compareAtPrice
    product.category = updates.category ?? product.category
    product.inventoryQuantity = updates.inventoryQuantity ?? product.inventoryQuantity
    product.images = updates.images ?? product.images
    product.updatedAt = new Date()

    await product.save()

    console.log(`✅ PUT Product: Product ${id} updated successfully by store ${userStore._id}.`)

    return NextResponse.json(
      { success: true, message: "Product updated successfully", data: product },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Error updating product:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update product", error: error.message },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  await connectToDB()
  console.log("DB connected for DELETE product.")

  try {
    const user = await getUserFromCookies(request as NextRequest)

    if (!user) {
      console.log("❌ DELETE Product: User not authenticated.")
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    console.log(`Debug: Authenticated user ID: ${user.id}`)

    const userStore = await Store.findOne({ sellerId: new mongoose.Types.ObjectId(user.id) })

    if (!userStore) {
      console.log(`❌ DELETE Product: Store not found for seller ID ${user.id}.`)

      const allStores = await Store.find({}, { sellerId: 1, name: 1 }).limit(5)
      console.log(
        "Sample stores in DB (sellerId field):",
        allStores.map((s) => ({ id: s._id, sellerId: s.sellerId, name: s.name }))

      )

      return NextResponse.json(
        { success: false, message: "Forbidden: Store not found for this user" },
        { status: 403 },
      )
    }

    console.log(`✅ DELETE Product: Store found for seller ID ${user.id}: ${userStore.name} (${userStore._id}).`)

    const { id } = await Promise.resolve(params)

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log(`❌ DELETE Product: Invalid product ID format: ${id}.`)
      return NextResponse.json({ success: false, message: "Invalid product ID format" }, { status: 400 })
    }

    const product = await Product.findById(id)

    if (!product) {
      console.log(`❌ DELETE Product: Product with ID ${id} not found.`)
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 })
    }

    if (product.storeId.toString() !== userStore._id.toString()) {
      console.log(
        `❌ DELETE Product: User ${user.id} attempted to delete product ${id} not owned by their store (${product.storeId}).`,
      )
      return NextResponse.json(
        { success: false, message: "Forbidden: You are not the owner of this product" },
        { status: 403 },
      )
    }

    await Product.deleteOne({ _id: id })

    console.log(`✅ DELETE Product: Product ${id} deleted successfully by store ${userStore._id}.`)

    return NextResponse.json({ success: true, message: "Product deleted successfully" }, { status: 200 })
  } catch (error: any) {
    console.error("Error deleting product:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete product", error: error.message },
      { status: 500 },
    )
  }
}
