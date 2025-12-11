// app/api/webhooks/paystack/route.ts
import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import mongoose from "mongoose"
import { connectToDB } from "@/lib/db"
import Store from "@/models/Store"
import Order from "@/models/Order"
import MainOrder from "@/models/MainOrder"
import Product from "@/models/Product"
import { PaymentLogger } from "@/lib/paymentLogger"

// Force Node.js runtime for raw body access
export const runtime = "nodejs"

// Rate limiting store (use Redis in production)
const webhookAttempts = new Map<string, { count: number; resetTime: number }>()

/**
 * Verify transaction with Paystack API
 */
async function verifyPaystackTransaction(reference: string) {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) {
    throw new Error("PAYSTACK_SECRET_KEY not configured")
  }

  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Paystack verification failed: ${response.statusText}`)
  }

  return await response.json()
}

/**
 * Verify that the webhook came from Paystack
 * Uses HMAC SHA512 signature verification
 */
function verifyPaystackSignature(body: string, signature: string | null): boolean {
  if (!signature) {
    console.error("❌ Missing Paystack signature")
    return false
  }

  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) {
    throw new Error("PAYSTACK_SECRET_KEY not configured")
  }

  const hash = crypto
    .createHmac("sha512", secret)
    .update(body)
    .digest("hex")

  return hash === signature
}

/**
 * Rate limiting check for webhook calls
 * Prevents spam and duplicate processing
 */
function checkWebhookRateLimit(reference: string): boolean {
  const now = Date.now()
  const attempt = webhookAttempts.get(reference)
  
  if (!attempt || now > attempt.resetTime) {
    webhookAttempts.set(reference, { count: 1, resetTime: now + 60000 }) // 1 min window
    return true
  }
  
  if (attempt.count >= 10) { // Max 10 webhook calls per minute per reference
    console.warn(`⚠️ Rate limit hit for reference: ${reference}`)
    return false
  }
  
  attempt.count++
  return true
}

/**
 * Update store subscription after successful payment
 */
async function updateSubscription(
  storeId: string,
  plan: string,
  amount: number,
  reference: string,
  session: mongoose.ClientSession
) {
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
    { new: true, session }
  ).lean()

  if (!updatedStore) {
    throw new Error(`Store ${storeId} not found`)
  }

  console.log(`✅ Subscription updated for store ${storeId}: ${plan}`)
  return updatedStore
}

/**
 * Verify order amounts against database prices
 * CRITICAL: Never trust client-provided prices
 */
async function verifyAndCalculateOrderAmount(
  orders: any[],
  deliveryFee: number,
  session: mongoose.ClientSession
) {
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
      // Fetch actual product from database
      const product = await Product.findById(item.productId).session(session).lean()
      
      if (!product) {
        throw new Error(`Product ${item.productId} not found`)
      }

      if (product.isDeleted) {
        throw new Error(`Product "${product.name}" is no longer available`)
      }

      if (!product.isActive) {
        throw new Error(`Product "${product.name}" is currently unavailable`)
      }

      // Check inventory
      if (product.inventoryQuantity < item.quantity) {
        throw new Error(
          `Insufficient stock for "${product.name}". Available: ${product.inventoryQuantity}`
        )
      }

      // Use database price, not client price
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

/**
 * Create main order and sub-orders atomically
 */
async function createOrdersFromWebhook(
  verifiedOrderData: any,
  reference: string,
  userId: string,
  paymentMethod: string,
  shippingInfo: any,
  paymentInfo: any,
  session: mongoose.ClientSession
) {
  const { verifiedOrders, subtotal, deliveryFee, grandTotal } = verifiedOrderData
  const createdSubOrders = []

  // Create sub-orders for each store
  for (const orderGroup of verifiedOrders) {
    const { storeId, items, totalPrice } = orderGroup

    const subOrder = await Order.create(
      [
        {
          storeId,
          userId,
          reference,
          totalPrice,
          status: "processing",
          paymentStatus: "paid",
          paidAt: paymentInfo.paidAt,
          paymentDetails: paymentInfo,
          items,
          paymentMethod,
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

    // Deduct inventory atomically
    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { inventoryQuantity: -item.quantity } },
        { session }
      )
    }
  }

  // Generate unique order number
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")
  const orderNumber = `ORD-${timestamp}${random}`

  // Create main order
  const mainOrder = await MainOrder.create(
    [
      {
        userId,
        orderNumber,
        reference,
        subOrders: createdSubOrders.map((order) => order._id),
        totalAmount: subtotal,
        deliveryFee,
        grandTotal,
        shippingInfo: {
          firstName: shippingInfo.firstName,
          lastName: shippingInfo.lastName,
          email: shippingInfo.email,
          phone: shippingInfo.phone || "",
          address: shippingInfo.address,
          state: shippingInfo.state,
          area: shippingInfo.area,
        },
        paymentMethod,
        paymentStatus: "paid",
        status: "processing",
        paidAt: paymentInfo.paidAt,
        paymentDetails: paymentInfo,
      },
    ],
    { session }
  )

  console.log(`✅ Order ${orderNumber} created with ${createdSubOrders.length} sub-order(s)`)

  return {
    mainOrder: mainOrder[0],
    subOrders: createdSubOrders,
    orderNumber,
  }
}

/**
 * Handle successful charge webhook event
 */
async function handleSuccessfulCharge(data: any, ipAddress: string) {
  const reference = data.reference
  const metadata = data.metadata ?? {}
  const paidAmount = data.amount / 100 // Convert kobo to naira
  const channel = data.channel || "card"

  console.log(`✅ Processing charge.success: ${reference}`)

  // Log webhook receipt
  await PaymentLogger.log({
    reference,
    event: "webhook_charge_success",
    amount: paidAmount,
    ipAddress,
    metadata: { channel, status: data.status },
  })

  // Rate limiting
  if (!checkWebhookRateLimit(reference)) {
    await PaymentLogger.log({
      reference,
      event: "webhook_rate_limit_hit",
    })
    return
  }

  // Map payment channel
  let paymentMethod: string
  switch (channel.toLowerCase()) {
    case "card":
      paymentMethod = "card"
      break
    case "bank":
    case "bank_transfer":
      paymentMethod = "bank_transfer"
      break
    case "ussd":
      paymentMethod = "ussd"
      break
    case "qr":
      paymentMethod = "qr"
      break
    case "mobile_money":
      paymentMethod = "mobile_money"
      break
    case "transfer":
      paymentMethod = "transfer"
      break
    default:
      paymentMethod = "card"
  }

  const session = await mongoose.startSession()

  try {
    await connectToDB()
    session.startTransaction()

    // HANDLE SUBSCRIPTION PAYMENTS
    if (metadata.type === "subscription") {
      const { plan, storeId } = metadata

      if (!plan || !storeId) {
        throw new Error("Invalid subscription metadata")
      }

      // Check if already processed
      const store = await Store.findById(storeId).session(session).lean()
      if (store?.lastPaymentReference === reference) {
        console.log(`ℹ️ Subscription already processed: ${reference}`)
        await session.abortTransaction()
        return
      }

      await updateSubscription(storeId, plan, paidAmount, reference, session)

      await PaymentLogger.log({
        reference,
        event: "subscription_updated",
        amount: paidAmount,
        metadata: { plan, storeId },
      })

      await session.commitTransaction()
      console.log(`✅ Subscription webhook completed: ${reference}`)
      return
    }

    // HANDLE CHECKOUT/ORDER PAYMENTS
    // Check for duplicate orders
    const existingOrders = await Order.find({ reference }).session(session).lean()

    if (existingOrders.length > 0) {
      console.log(`ℹ️ Orders already exist for ${reference}, updating status`)

      // Update status if not already paid
      await Order.updateMany(
        { reference, paymentStatus: { $ne: "paid" } },
        {
          $set: {
            paymentStatus: "paid",
            status: "processing",
            paidAt: new Date(data.paid_at || data.transaction_date),
          },
        },
        { session }
      )

      await MainOrder.updateOne(
        { reference, paymentStatus: { $ne: "paid" } },
        {
          $set: {
            paymentStatus: "paid",
            status: "processing",
            paidAt: new Date(data.paid_at || data.transaction_date),
          },
        },
        { session }
      )

      await session.commitTransaction()

      await PaymentLogger.log({
        reference,
        event: "duplicate_order_updated",
        metadata: { orderCount: existingOrders.length },
      })

      return
    }

    // Extract order data from metadata
    const { orders, shippingInfo, deliveryFee = 0, userId } = metadata

    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      throw new Error("Invalid orders data in webhook metadata")
    }

    if (!shippingInfo) {
      throw new Error("Missing shipping information in webhook metadata")
    }

    if (!userId) {
      throw new Error("Missing userId in webhook metadata")
    }

    // Verify and recalculate amounts from database
    const verifiedOrderData = await verifyAndCalculateOrderAmount(
      orders,
      deliveryFee,
      session
    )

    // CRITICAL: Verify paid amount matches calculated total
    const amountDifference = Math.abs(paidAmount - verifiedOrderData.grandTotal)
    if (amountDifference > 0.01) {
      // Allow 1 kobo rounding difference
      await session.abortTransaction()

      await PaymentLogger.log({
        reference,
        userId,
        event: "webhook_amount_mismatch",
        amount: paidAmount,
        expectedAmount: verifiedOrderData.grandTotal,
        metadata: { difference: amountDifference },
      })

      throw new Error(
        `Amount mismatch: Paid ${paidAmount}, Expected ${verifiedOrderData.grandTotal}`
      )
    }

    // Create payment info
    const paymentInfo = {
      transactionId: data.id,
      amount: paidAmount,
      currency: data.currency,
      channel,
      fees: data.fees ? data.fees / 100 : 0,
      paidAt: new Date(data.paid_at || data.transaction_date),
    }

    // Create orders atomically
    const orderResult = await createOrdersFromWebhook(
      verifiedOrderData,
      reference,
      userId,
      paymentMethod,
      shippingInfo,
      paymentInfo,
      session
    )

    await session.commitTransaction()

    await PaymentLogger.log({
      reference,
      userId,
      event: "webhook_order_created",
      amount: paidAmount,
      metadata: {
        orderNumber: orderResult.orderNumber,
        subOrderCount: orderResult.subOrders.length,
      },
    })

    console.log(`✅ Checkout webhook completed: ${orderResult.orderNumber}`)
  } catch (error: any) {
    await session.abortTransaction()
    console.error(`❌ Webhook transaction failed for ${reference}:`, error)

    await PaymentLogger.log({
      reference,
      event: "webhook_processing_failed",
      error: error.message,
      metadata: { stack: error.stack },
    })

    throw error
  } finally {
    session.endSession()
  }
}

/**
 * Handle failed charge webhook event
 */
async function handleFailedCharge(data: any, ipAddress: string) {
  const reference = data.reference
  console.log(`❌ Payment failed for ${reference}`)

  await PaymentLogger.log({
    reference,
    event: "webhook_charge_failed",
    ipAddress,
    metadata: { status: data.status },
  })

  await connectToDB()

  // Update any existing orders to failed status
  await Order.updateMany(
    { reference },
    { $set: { paymentStatus: "failed", status: "cancelled" } }
  )

  await MainOrder.updateOne(
    { reference },
    { $set: { paymentStatus: "failed", status: "cancelled" } }
  )
}

/**
 * GET endpoint - Check payment and order status
 * Used by frontend to verify payment and poll for order creation
 */
export async function GET(request: NextRequest) {
  try {
    const reference = request.nextUrl.searchParams.get("reference")

    if (!reference) {
      return NextResponse.json(
        { error: "Missing reference parameter" },
        { status: 400 }
      )
    }

    // Token may be missing when user is redirected back from Paystack.
    // Allow unauthenticated polling so the frontend can poll for order creation,
    // but avoid returning sensitive main order details to anonymous callers.
    const token = request.cookies.get("token")?.value
    const isAuthenticated = !!token

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

    // Check if orders exist
    await connectToDB()
    
    // Handle subscription verification
    if (metadata.type === "subscription") {
      const { plan, storeId } = metadata
      
      if (!plan || !storeId) {
        return NextResponse.json(
          { error: "Invalid subscription metadata" },
          { status: 400 }
        )
      }

      // Check if subscription was updated
      const store = await Store.findById(storeId)
        .select("subscriptionPlan subscriptionStatus lastPaymentReference")
        .lean()

      return NextResponse.json({
        status: "success",
        message: "Subscription payment verified",
        data: {
          reference,
          type: "subscription",
          plan,
          storeId,
          amount: paidAmount,
          paymentStatus: "success",
          subscriptionUpdated: store?.lastPaymentReference === reference,
        },
      })
    }

    // Check if order exists (for checkout payments)
    const existingOrders = await Order.find({ reference })
      .select("_id reference status paymentStatus")
      .lean()
    
    if (existingOrders.length === 0) {
      // Order not created yet (webhook still processing)
      return NextResponse.json({
        status: "success",
        message: "Payment verified, order being processed",
        data: {
          reference,
          paymentStatus: "success",
          amount: paidAmount,
          orderExists: false,
          metadata,
        },
      })
    }

    // Get main order details
    // If unauthenticated, return minimal info (orderExists = true) so the
    // frontend can tell the user their order is ready. Do not expose
    // orderNumber or detailed order info without authentication.
    if (!isAuthenticated) {
      return NextResponse.json({
        status: "success",
        message: "Payment verified and order created",
        data: {
          reference,
          paymentStatus: "success",
          amount: paidAmount,
          orderExists: true,
          subOrderCount: existingOrders.length,
        },
      })
    }

    // Authenticated: include main order details so we can redirect to the
    // specific order page.
    const mainOrder = await MainOrder.findOne({
      subOrders: { $in: existingOrders.map((o) => o._id) },
    })
      .select("orderNumber reference status paymentStatus grandTotal createdAt")
      .lean()

    return NextResponse.json({
      status: "success",
      message: "Payment verified and order created",
      data: {
        reference,
        paymentStatus: "success",
        amount: paidAmount,
        orderExists: true,
        orderNumber: mainOrder?.orderNumber,
        status: mainOrder?.status,
        grandTotal: mainOrder?.grandTotal,
        subOrderCount: existingOrders.length,
        createdAt: mainOrder?.createdAt,
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

/**
 * Main webhook POST handler
 */
export async function POST(request: NextRequest) {
  let parsedEvent: any = null

  try {
    // Get raw body for signature verification
    const body = await request.text()
    const signature = request.headers.get("x-paystack-signature")

    // Get IP address for logging
    const forwardedFor = request.headers.get("x-forwarded-for")
    const realIp = request.headers.get("x-real-ip")
    const ipAddress = forwardedFor?.split(",")[0] || realIp || "unknown"

    // Verify webhook signature
    if (!verifyPaystackSignature(body, signature)) {
      console.error("❌ Invalid Paystack webhook signature")
      await PaymentLogger.log({
        reference: "unknown",
        event: "webhook_invalid_signature",
        ipAddress,
      })
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    // Parse event
    parsedEvent = JSON.parse(body)
    console.log(`📨 Webhook received: ${parsedEvent.event}`)

    // Handle different event types
    switch (parsedEvent.event) {
      case "charge.success":
        await handleSuccessfulCharge(parsedEvent.data, ipAddress)
        break

      case "charge.failed":
        await handleFailedCharge(parsedEvent.data, ipAddress)
        break

      case "transfer.success":
      case "transfer.failed":
      case "transfer.reversed":
        console.log(`ℹ️ Transfer event: ${parsedEvent.event}`)
        break

      default:
        console.log(`ℹ️ Unhandled webhook event: ${parsedEvent.event}`)
    }

    // Always return 200 to Paystack to prevent retries
    return NextResponse.json({ status: "success" })
  } catch (error: any) {
    console.error("❌ Webhook processing error:", error)

    // Log critical errors
    await PaymentLogger.log({
      reference: parsedEvent?.data?.reference || "unknown",
      event: "webhook_critical_error",
      error: error.message,
      metadata: { stack: error.stack },
    }).catch(console.error)

    // Still return 200 to prevent Paystack retries
    // Log the error internally but don't expose details
    return NextResponse.json({ status: "error_logged" })
  }
}