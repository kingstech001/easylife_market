import { type NextRequest, NextResponse } from "next/server"
import { connectToDB } from "@/lib/db"
import Store from "@/models/Store"
import Order from "@/models/Order"
import MainOrder from "@/models/MainOrder"
import Product from "@/models/Product"
import mongoose from "mongoose"
import { PaymentLogger } from "@/lib/paymentLogger"

// Rate limiting store (in production, use Redis)
const verificationAttempts = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(reference: string): boolean {
  const now = Date.now()
  const attempt = verificationAttempts.get(reference)
  
  if (!attempt || now > attempt.resetTime) {
    verificationAttempts.set(reference, { count: 1, resetTime: now + 60000 }) // 1 minute window
    return true
  }
  
  if (attempt.count >= 5) { // Max 5 attempts per minute
    // Log rate limit hit
    PaymentLogger.log({
      reference,
      event: "rate_limit_hit",
      metadata: { attemptCount: attempt.count },
    }).catch(console.error)
    return false
  }
  
  attempt.count++
  return true
}

async function updateSubscription(
  storeId: string,
  plan: string,
  amount: number,
  reference: string
) {
  try {
    await connectToDB()

    const expiryDate = new Date()
    expiryDate.setMonth(expiryDate.getMonth() + 1)

    const updatedStore = await Store.findByIdAndUpdate(
      storeId,
      {
        subscriptionPlan: plan,
        subscriptionStatus: "active",
        subscriptionExpiryDate: expiryDate,
        lastPaymentAmount: amount,
        lastPaymentReference: reference,
        lastPaymentDate: new Date(),
      },
      { new: true }
    ).lean()

    if (!updatedStore) {
      throw new Error("Store not found")
    }

    return {
      success: true,
      store: updatedStore,
      plan,
      expiryDate: expiryDate.toISOString(),
    }
  } catch (error: any) {
    console.error("❌ Failed to update subscription:", error)
    throw error
  }
}

async function verifyAndCalculateOrderAmount(orders: any[], deliveryFee: number = 0) {
  let calculatedTotal = 0
  const verifiedOrders = []

  for (const orderGroup of orders) {
    const { storeId, items } = orderGroup

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error(`Invalid items for store ${storeId}`)
    }

    let storeTotal = 0
    const verifiedItems = []

    for (const item of items) {
      // Fetch the actual product from database
      const product = await Product.findById(item.productId).lean()
      
      if (!product) {
        throw new Error(`Product ${item.productId} not found`)
      }

      // Check if product is active and not deleted
      if (product.isDeleted) {
        throw new Error(`Product "${product.name}" is no longer available`)
      }

      if (!product.isActive) {
        throw new Error(`Product "${product.name}" is currently unavailable`)
      }

      // Check if there's enough inventory
      if (product.inventoryQuantity < item.quantity) {
        throw new Error(`Insufficient stock for "${product.name}". Available: ${product.inventoryQuantity}, Requested: ${item.quantity}`)
      }

      // Use the actual price from database, not client-provided price
      const actualPrice = product.price
      const itemTotal = actualPrice * item.quantity

      verifiedItems.push({
        productId: product._id,
        productName: product.name,
        quantity: item.quantity,
        priceAtPurchase: actualPrice,
        itemTotal,
      })

      storeTotal += itemTotal
    }

    verifiedOrders.push({
      storeId,
      items: verifiedItems,
      totalPrice: storeTotal,
    })

    calculatedTotal += storeTotal
  }

  const grandTotal = calculatedTotal + deliveryFee

  return {
    verifiedOrders,
    subtotal: calculatedTotal,
    deliveryFee,
    grandTotal,
  }
}

async function createMainOrder(
  verifiedOrderData: any,
  reference: string,
  userId: string,
  actualPaymentMethod: string,
  shippingInfo: any,
  paymentInfo: any,
  session: mongoose.ClientSession
) {
  try {
    const { verifiedOrders, subtotal, deliveryFee, grandTotal } = verifiedOrderData

    const createdSubOrders = []

    for (const orderGroup of verifiedOrders) {
      const { storeId, items, totalPrice } = orderGroup

      const subOrder = await Order.create(
        [
          {
            storeId: storeId,
            userId: userId,
            reference: reference,
            totalPrice: totalPrice,
            status: "processing",
            paymentStatus: "paid",
            paidAt: paymentInfo.paidAt,
            paymentDetails: paymentInfo,
            items: items,
            paymentMethod: actualPaymentMethod,
            shippingInfo: {
              firstName: shippingInfo.firstName,
              lastName: shippingInfo.lastName,
              email: shippingInfo.email,
              phone: shippingInfo.phone || "",
              address: shippingInfo.address,
              state: shippingInfo.state,
              area: shippingInfo.area,
            },
          },
        ],
        { session }
      )

      createdSubOrders.push(subOrder[0])

      // Update product stock (inventory)
      for (const item of items) {
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { inventoryQuantity: -item.quantity } },
          { session }
        )
      }
    }

    const timestamp = Date.now().toString().slice(-6)
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")
    const orderNumber = `ORD-${timestamp}${random}`

    const mainOrder = await MainOrder.create(
      [
        {
          userId: userId,
          orderNumber: orderNumber,
          reference: reference,
          subOrders: createdSubOrders.map((order) => order._id),
          totalAmount: subtotal,
          deliveryFee: deliveryFee,
          grandTotal: grandTotal,
          shippingInfo: {
            firstName: shippingInfo.firstName,
            lastName: shippingInfo.lastName,
            email: shippingInfo.email,
            phone: shippingInfo.phone || "",
            address: shippingInfo.address,
            state: shippingInfo.state,
            area: shippingInfo.area,
          },
          paymentMethod: actualPaymentMethod,
          paymentStatus: "paid",
          status: "processing",
          paidAt: paymentInfo.paidAt,
          paymentDetails: paymentInfo,
        },
      ],
      { session }
    )

    return {
      success: true,
      mainOrder: mainOrder[0],
      subOrders: createdSubOrders,
      message: `Order ${orderNumber} created with ${createdSubOrders.length} sub-order(s)`,
    }
  } catch (error: any) {
    console.error("❌ Failed to create main order:", error)
    throw error
  }
}

async function getUserIdFromToken(token: string) {
  try {
    const jwt = await import("jsonwebtoken")
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    const userId = decoded.userId || decoded.id || decoded._id

    if (!userId) {
      console.error("No user ID found in token")
      throw new Error("User ID not found in token")
    }

    return userId
  } catch (error: any) {
    console.error("Failed to decode token:", error.message)
    return null
  }
}

async function verifyPaystackTransaction(reference: string) {
  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
  if (!paystackSecretKey) {
    throw new Error("Payment service not configured")
  }

  const verifyResponse = await fetch(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
      },
    }
  )

  const verifyData = await verifyResponse.json()

  if (!verifyResponse.ok) {
    throw new Error(verifyData.message || "Failed to verify payment")
  }

  return verifyData
}

export async function POST(request: NextRequest) {
  const session = await mongoose.startSession()
  let requestBody: any = null
  
  try {
    requestBody = await request.json()
    const { reference } = requestBody

    if (!reference) {
      return NextResponse.json(
        { error: "Missing reference parameter" },
        { status: 400 }
      )
    }

    // Get client IP - handle different deployment scenarios
    const forwardedFor = request.headers.get("x-forwarded-for")
    const realIp = request.headers.get("x-real-ip")
    const ipAddress = forwardedFor?.split(',')[0] || realIp || 'unknown'

    // Log verification start
    await PaymentLogger.log({
      reference,
      event: "verification_started",
      ipAddress,
      userAgent: request.headers.get("user-agent") || undefined,
    })

    // Rate limiting
    if (!checkRateLimit(reference)) {
      return NextResponse.json(
        { error: "Too many verification attempts. Please try again later." },
        { status: 429 }
      )
    }

    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - No authentication token" },
        { status: 401 }
      )
    }

    const userId = await getUserIdFromToken(token)
    if (!userId) {
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      )
    }

    // Verify payment with Paystack
    const verifyData = await verifyPaystackTransaction(reference)

    if (verifyData.data.status !== "success") {
      return NextResponse.json(
        { error: "Payment was not successful" },
        { status: 400 }
      )
    }

    const paystackMetadata = verifyData.data.metadata ?? {}
    const paystackChannel = verifyData.data.channel || "card"
    const paidAmount = verifyData.data.amount / 100 // Convert from kobo to naira

    // Map payment channel
    let actualPaymentMethod: string
    switch (paystackChannel.toLowerCase()) {
      case "card":
        actualPaymentMethod = "card"
        break
      case "bank":
      case "bank_transfer":
        actualPaymentMethod = "bank_transfer"
        break
      case "ussd":
        actualPaymentMethod = "ussd"
        break
      case "qr":
        actualPaymentMethod = "qr"
        break
      case "mobile_money":
        actualPaymentMethod = "mobile_money"
        break
      case "transfer":
        actualPaymentMethod = "transfer"
        break
      default:
        actualPaymentMethod = "card"
    }

    // Handle subscription payments
    if (paystackMetadata.type === "subscription") {
      const { plan, storeId } = paystackMetadata
      if (!plan || !storeId) {
        return NextResponse.json(
          { error: "Invalid subscription metadata" },
          { status: 400 }
        )
      }

      try {
        const subscriptionResult = await updateSubscription(
          storeId,
          plan,
          paidAmount,
          reference
        )

        return NextResponse.json({
          status: "success",
          message: "Subscription payment verified and updated successfully",
          data: subscriptionResult,
        })
      } catch (error: any) {
        return NextResponse.json(
          {
            error: "Payment verified but failed to update subscription",
            details: error.message,
          },
          { status: 500 }
        )
      }
    }

    // Handle order payments with transaction
    await connectToDB()
    session.startTransaction()

    try {
      // Check for duplicate orders (within transaction for consistency)
      const existingOrders = await Order.find({ reference }).session(session).lean()
      
      if (existingOrders.length > 0) {
        await session.abortTransaction()
        console.log("✅ Orders already exist, returning existing data")
        
        // Log duplicate detection
        await PaymentLogger.log({
          reference,
          userId,
          event: "duplicate_detected",
          metadata: { orderCount: existingOrders.length },
        })
        
        const mainOrder = await MainOrder.findOne({ 
          subOrders: { $in: existingOrders.map(o => o._id) } 
        }).lean()
        
        return NextResponse.json({
          status: "success",
          message: "Payment already processed",
          data: {
            reference,
            orderNumber: mainOrder?.orderNumber,
            mainOrder,
            subOrders: existingOrders,
            paymentStatus: "success",
            paymentMethod: actualPaymentMethod,
            amount: paidAmount,
          },
        })
      }

      // Extract order data from metadata (trusted source)
      const orders = paystackMetadata.orders
      const shippingInfo = paystackMetadata.shippingInfo
      const deliveryFee = paystackMetadata.deliveryFee || 0

      if (!orders || !Array.isArray(orders) || orders.length === 0) {
        await session.abortTransaction()
        return NextResponse.json(
          { error: "Invalid orders data in payment metadata" },
          { status: 400 }
        )
      }

      if (!shippingInfo) {
        await session.abortTransaction()
        return NextResponse.json(
          { error: "Missing shipping information in payment metadata" },
          { status: 400 }
        )
      }

      // Verify and recalculate order amounts from database
      const verifiedOrderData = await verifyAndCalculateOrderAmount(orders, deliveryFee)

      // CRITICAL: Verify paid amount matches calculated total
      const amountDifference = Math.abs(paidAmount - verifiedOrderData.grandTotal)
      if (amountDifference > 0.01) { // Allow 1 kobo difference for rounding
        await session.abortTransaction()
        console.error(
          `❌ Amount mismatch: Paid ${paidAmount}, Expected ${verifiedOrderData.grandTotal}`
        )
        
        // Log amount mismatch for security monitoring
        await PaymentLogger.log({
          reference,
          userId,
          event: "amount_mismatch",
          amount: paidAmount,
          expectedAmount: verifiedOrderData.grandTotal,
          metadata: { difference: amountDifference },
        })
        
        return NextResponse.json(
          {
            error: "Payment amount does not match order total",
            details: {
              paid: paidAmount,
              expected: verifiedOrderData.grandTotal,
            },
          },
          { status: 400 }
        )
      }

      // Create payment info object
      const paymentInfo = {
        transactionId: verifyData.data.id,
        amount: paidAmount,
        currency: verifyData.data.currency,
        channel: paystackChannel,
        fees: verifyData.data.fees ? verifyData.data.fees / 100 : 0,
        paidAt: new Date(verifyData.data.paid_at || verifyData.data.transaction_date),
      }

      // Create orders within transaction
      const orderResult = await createMainOrder(
        verifiedOrderData,
        reference,
        userId,
        actualPaymentMethod,
        shippingInfo,
        paymentInfo,
        session
      )

      // Commit transaction
      await session.commitTransaction()

      // Log successful order creation
      console.log(`✅ Order ${orderResult.mainOrder.orderNumber} created successfully`)
      
      await PaymentLogger.log({
        reference,
        userId,
        event: "order_created",
        amount: paidAmount,
        metadata: {
          orderNumber: orderResult.mainOrder.orderNumber,
          subOrderCount: orderResult.subOrders.length,
        },
      })

      return NextResponse.json({
        status: "success",
        message: "Payment verified and order created successfully",
        data: {
          reference,
          orderNumber: orderResult.mainOrder.orderNumber,
          mainOrder: orderResult.mainOrder,
          subOrders: orderResult.subOrders,
          paymentStatus: "success",
          paymentMethod: actualPaymentMethod,
          amount: paidAmount,
        },
      })
    } catch (error: any) {
      await session.abortTransaction()
      console.error("❌ Transaction failed:", error)
      
      // Log verification failure
      await PaymentLogger.log({
        reference,
        userId,
        event: "verification_failed",
        error: error.message,
        metadata: { stack: error.stack },
      })
      
      return NextResponse.json(
        {
          error: "Payment verified but failed to create order",
          details: error.message,
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    if (session.inTransaction()) {
      await session.abortTransaction()
    }
    console.error("❌ Payment verification error:", error)
    
    // Log general verification failure
    await PaymentLogger.log({
      reference: requestBody?.reference || 'unknown',
      event: "verification_failed",
      error: error.message,
    })
    
    return NextResponse.json(
      {
        error: "Failed to verify payment",
        details: error.message,
      },
      { status: 500 }
    )
  } finally {
    session.endSession()
  }
}

export async function GET(request: NextRequest) {
  try {
    const reference = request.nextUrl.searchParams.get("reference")

    if (!reference) {
      return NextResponse.json(
        { error: "Missing reference parameter" },
        { status: 400 }
      )
    }

    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - No authentication token" },
        { status: 401 }
      )
    }

    // Verify payment with Paystack
    const verifyData = await verifyPaystackTransaction(reference)

    if (verifyData.data.status !== "success") {
      return NextResponse.json(
        { error: "Payment was not successful" },
        { status: 400 }
      )
    }

    const metadata = verifyData.data.metadata ?? {}
    const paidAmount = verifyData.data.amount / 100

    // Handle subscription verification
    if (metadata.type === "subscription") {
      const { plan, storeId } = metadata
      if (!plan || !storeId) {
        return NextResponse.json(
          { error: "Invalid subscription metadata" },
          { status: 400 }
        )
      }

      try {
        const subscriptionResult = await updateSubscription(
          storeId,
          plan,
          paidAmount,
          reference
        )

        return NextResponse.json({
          status: "success",
          message: "Subscription payment verified and updated successfully",
          data: {
            reference,
            plan,
            storeId,
            amount: paidAmount,
            paymentStatus: "success",
            subscription: subscriptionResult,
          },
        })
      } catch (error: any) {
        return NextResponse.json(
          {
            error: "Payment verified but failed to update subscription",
            details: error.message,
          },
          { status: 500 }
        )
      }
    }

    // Check if order exists
    await connectToDB()
    const existingOrders = await Order.find({ reference }).lean()
    
    return NextResponse.json({
      status: "success",
      message: "Payment verified successfully",
      data: {
        reference,
        paymentStatus: "success",
        amount: paidAmount,
        metadata,
        orderExists: existingOrders.length > 0,
      },
    })
  } catch (error: any) {
    console.error("Payment verification error:", error)
    return NextResponse.json(
      {
        error: "Failed to verify payment",
        details: error.message,
      },
      { status: 500 }
    )
  }
}