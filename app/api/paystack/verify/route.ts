import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reference, orderData } = body

    if (!reference) {
      return NextResponse.json({ error: "Missing reference parameter" }, { status: 400 })
    }

    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized - No authentication token" }, { status: 401 })
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
    if (!paystackSecretKey) {
      console.error("[v0] PAYSTACK_SECRET_KEY is not set")
      return NextResponse.json({ error: "Payment service not configured" }, { status: 500 })
    }

    console.log("[v0] Verifying Paystack payment with reference:", reference)

    // Call Paystack API to verify transaction
    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
      },
    })

    const verifyData = await verifyResponse.json()

    if (!verifyResponse.ok) {
      console.error("[v0] Paystack verification error:", verifyData)
      return NextResponse.json(
        { error: verifyData.message || "Failed to verify payment" },
        { status: verifyResponse.status },
      )
    }

    console.log("[v0] Paystack payment verified:", verifyData)

    if (verifyData.data.status === "success") {
      const paystackMetadata = verifyData.data.metadata ?? {}
      const merged = {
        ...paystackMetadata,
        ...(orderData ?? {}),
      }

      // Normalize payment method to the enum expected by the Orders API.
      const mapPaymentMethod = (pm?: string, channel?: string) => {
        if (!pm && !channel) return "card"
        const p = (pm || channel || "").toString().toLowerCase()
        if (p === "paystack") return "card"
        if (p === "card" || p === "transfer" || p === "bank" || p === "pos") return p
        return "card"
      }

      const orders = merged.orders
      // Validate orders
      if (!orders || !Array.isArray(orders) || orders.length === 0) {
        console.error("[v0] Invalid orders data:", { ordersData: orders, isArray: Array.isArray(orders) })
        return NextResponse.json({ error: "Invalid orders data. At least one order is required." }, { status: 400 })
      }

      const paymentMethodValue = mapPaymentMethod(merged.paymentMethod, verifyData.data.channel)

      const orderResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/orders/buyer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            orders,
            shippingInfo: merged.shippingInfo,
            paymentMethod: paymentMethodValue,
            deliveryFee: merged.deliveryFee,
            paystackReference: reference,
          }),
        },
      )

      if (!orderResponse.ok) {
        console.error("[v0] Failed to create order after payment verification")
        const errorData = await orderResponse.json().catch(() => ({}))
        console.error("[v0] Order creation error:", errorData)
        return NextResponse.json({ error: "Payment verified but failed to create order" }, { status: 500 })
      }

      const orderDataResponse = await orderResponse.json()
      return NextResponse.json({
        status: "success",
        message: "Payment verified and order created",
        data: orderDataResponse,
      })
    }

    return NextResponse.json({ error: "Payment was not successful" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Payment verification error:", error)
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const reference = request.nextUrl.searchParams.get("reference")

    if (!reference) {
      return NextResponse.json({ error: "Missing reference parameter" }, { status: 400 })
    }

    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized - No authentication token" }, { status: 401 })
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
    if (!paystackSecretKey) {
      console.error("[v0] PAYSTACK_SECRET_KEY is not set")
      return NextResponse.json({ error: "Payment service not configured" }, { status: 500 })
    }

    console.log("[v0] Verifying Paystack payment with reference:", reference)

    // Call Paystack API to verify transaction
    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
      },
    })

    const verifyData = await verifyResponse.json()

    if (!verifyResponse.ok) {
      console.error("[v0] Paystack verification error:", verifyData)
      return NextResponse.json(
        { error: verifyData.message || "Failed to verify payment" },
        { status: verifyResponse.status },
      )
    }

    console.log("[v0] Paystack payment verified:", verifyData)

    if (verifyData.data.status === "success") {
      const metadata = verifyData.data.metadata ?? {}

      // If metadata doesn't contain orders, it means the verification was already done via POST
      // Return success status so the frontend can proceed
      if (!metadata.orders || !Array.isArray(metadata.orders) || metadata.orders.length === 0) {
        console.log("[v0] GET verification: Orders not in metadata (likely already verified via POST)")
        return NextResponse.json({
          status: "success",
          message: "Payment verified successfully",
          data: {
            reference,
            paymentStatus: "success",
            amount: verifyData.data.amount,
          },
        })
      }

      const orders = metadata.orders
      const paymentMethodValue = metadata.paymentMethod || "card"

      const orderResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/orders/buyer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            orders,
            shippingInfo: metadata.shippingInfo,
            paymentMethod: paymentMethodValue,
            deliveryFee: metadata.deliveryFee,
            paystackReference: reference,
          }),
        },
      )

      if (!orderResponse.ok) {
        console.error("[v0] Failed to create order after payment verification")
        const errorData = await orderResponse.json().catch(() => ({}))
        console.error("[v0] Order creation error:", errorData)
        return NextResponse.json({ error: "Payment verified but failed to create order" }, { status: 500 })
      }

      const orderData = await orderResponse.json()
      return NextResponse.json({
        status: "success",
        message: "Payment verified and order created",
        data: orderData,
      })
    }

    return NextResponse.json({ error: "Payment was not successful" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Payment verification error:", error)
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 })
  }
}
