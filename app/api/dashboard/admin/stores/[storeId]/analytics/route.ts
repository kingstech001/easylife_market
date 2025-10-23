import { NextResponse } from 'next/server'
import { connectToDB } from '@/lib/db'
import Product from '@/models/Product'
import Order from '@/models/Order' // optional: if you have orders
import Store from '@/models/Store'

export async function GET(
  req: Request,
  context: { params: Promise<{ storeId: string }> }
) {
  try {
    await connectToDB()

    const { storeId } = await context.params
    const store = await Store.findById(storeId)

    if (!store) {
      return NextResponse.json({ message: 'Store not found' }, { status: 404 })
    }

    const products = await Product.find({ storeId })
    const totalProducts = products.length
    const activeProducts = products.filter((p) => p.isActive && !p.isDeleted)
    const deletedProducts = products.filter((p) => p.isDeleted)
    const totalActive = activeProducts.length
    const totalDeleted = deletedProducts.length
    const avgPrice =
      totalProducts > 0
        ? products.reduce((sum, p) => sum + (p.price || 0), 0) / totalProducts
        : 0

    // optional: if you have orders per product
    const orders = await Order.find({ storeId })
    const totalSales = orders.reduce(
      (sum, o) => sum + (o.totalPrice || 0),
      0
    )
    const totalOrders = orders.length

    const analytics = {
      storeName: store.name,
      totalProducts,
      totalActive,
      totalDeleted,
      avgPrice,
      totalSales,
      totalOrders,
    }

    return NextResponse.json(analytics, { status: 200 })
  } catch (error) {
    console.error('Error fetching store analytics:', error)
    return NextResponse.json(
      { message: 'Failed to fetch store analytics' },
      { status: 500 }
    )
  }
}
