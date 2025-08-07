import { NextResponse } from "next/server"
import { connectToDB } from "@/lib/db"
import Product from "@/models/Product"
import Order from "@/models/Order"
import type { IProduct, IUserRef, IOrder, IOrderItem } from "@/app/types/db" // Ensure paths are correct

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 })
    }

    await connectToDB()

    // Get user's order history with products populated
    const rawOrders = await Order.find({ userId })
      .populate("items.productId")
      .lean()

    // Map raw Mongoose documents to your IOrder type
    const userOrders: IOrder[] = rawOrders.map((order: any) => ({
      _id: order._id.toString(),
      userId: order.userId.toString(),
      subtotal: order.subtotal,
      total: order.total,
      paymentMethod: order.paymentMethod,
      status: order.status,
      items: (order.items || []).map((item: any) => ({
        _id: item._id.toString(),
        quantity: item.quantity,
        price: item.price,
        productId: item.productId, // Will be ObjectId or populated object
      })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }))

    const purchasedCategories = new Set<string>()

    userOrders.forEach((order) => {
      order.items?.forEach((item: IOrderItem) => {
        if (
          item.productId &&
          typeof item.productId !== "string" &&
          (item.productId as IProduct).category
        ) {
          purchasedCategories.add((item.productId as IProduct).category)
        }
      })
    })

    let recommendedProducts: IProduct[] = []

    if (purchasedCategories.size > 0) {
      // Recommend products from categories user has purchased before
      const rawRecommended = await Product.find({
        category: { $in: Array.from(purchasedCategories) },
        isActive: true,
        stock: { $gt: 0 },
      })
        .sort({ rating: -1, createdAt: -1 })
        .limit(8)
        .populate("sellerId", "firstName lastName")
        .lean()

      recommendedProducts = rawRecommended.map((product: any) => ({
        _id: product._id.toString(),
        name: product.name,
        price: product.price,
        images: product.images,
        category: product.category,
        description: product.description,
        rating: product.rating,
        stock: product.stock,
        salesCount: product.salesCount,
        sellerId: product.sellerId, // could be IUserRef populated
        isActive: product.isActive,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      }))
    }

    // If not enough recommendations, get popular products
    if (recommendedProducts.length < 4) {
      const rawPopular = await Product.find({
        isActive: true,
        stock: { $gt: 0 },
      })
        .sort({ rating: -1, salesCount: -1 })
        .limit(8 - recommendedProducts.length)
        .populate("sellerId", "firstName lastName")
        .lean()

      const popularProducts: IProduct[] = rawPopular.map((product: any) => ({
        _id: product._id.toString(),
        name: product.name,
        price: product.price,
        images: product.images,
        category: product.category,
        description: product.description,
        rating: product.rating,
        stock: product.stock,
        salesCount: product.salesCount,
        sellerId: product.sellerId,
        isActive: product.isActive,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      }))

      recommendedProducts = [...recommendedProducts, ...popularProducts]
    }

    // Format products for frontend
    const formattedProducts = recommendedProducts.map((product) => ({
      id: product._id.toString(),
      name: product.name,
      price: `₦${product.price.toFixed(2)}`,
      image: product.images?.[0] || "/placeholder.svg?height=100&width=100",
      rating: product.rating || 4.0,
      seller: (product.sellerId as IUserRef)?.firstName
        ? `${(product.sellerId as IUserRef).firstName} ${(product.sellerId as IUserRef).lastName}`
        : "Unknown Seller",
      category: product.category,
    }))

    return NextResponse.json({ products: formattedProducts })
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
