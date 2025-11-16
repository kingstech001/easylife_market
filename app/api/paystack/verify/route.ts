import { type NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Store from "@/models/Store";
import Order from "@/models/Order";
import MainOrder from "@/models/MainOrder";
import Product from "@/models/Product";

// Helper to update subscription directly in database
async function updateSubscription(
  storeId: string,
  plan: string,
  amount: number,
  reference: string
) {
  try {
    await connectToDB();

    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);

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
    ).lean();

    if (!updatedStore) {
      throw new Error("Store not found");
    }

    return {
      success: true,
      store: updatedStore,
      plan,
      expiryDate: expiryDate.toISOString(),
    };
  } catch (error: any) {
    console.error("❌ Failed to update subscription:", error);
    throw error;
  }
}

// Helper to create MainOrder with SubOrders
async function createMainOrder(
  orderData: any,
  reference: string,
  userId: string,
  actualPaymentMethod: string
) {
  try {
    await connectToDB();

    const { orders, shippingInfo, deliveryFee } = orderData;

    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      throw new Error("Invalid orders data");
    }

    console.log(
      `[v0] Creating main order for user ${userId} with ${orders.length} sub-orders`
    );
    console.log(`[v0] Payment method used: ${actualPaymentMethod}`);

    // Step 1: Create sub-orders (Order documents)
    const createdSubOrders = [];
    let calculatedTotalAmount = 0;

    for (const orderGroup of orders) {
      const { storeId, items, totalPrice } = orderGroup;

      // Enrich items with product names
      const enrichedItems = await Promise.all(
        items.map(async (item: any) => {
          try {
            const product = await Product.findById(item.productId)
              .select("name")
              .lean();
            return {
              productId: item.productId,
              productName:
                item.productName || product?.name || "Unknown Product",
              quantity: item.quantity,
              priceAtPurchase: item.priceAtPurchase,
            };
          } catch (err) {
            console.error(`Failed to fetch product ${item.productId}:`, err);
            return {
              productId: item.productId,
              productName: item.productName || "Unknown Product",
              quantity: item.quantity,
              priceAtPurchase: item.priceAtPurchase,
            };
          }
        })
      );

      // Create sub-order
      const subOrder = await Order.create({
        storeId: storeId,
        userId: userId,
        totalPrice: totalPrice,
        status: "pending",
        items: enrichedItems,
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
      });

      createdSubOrders.push(subOrder);
      calculatedTotalAmount += totalPrice;
      console.log(`✅ Sub-order created for store ${storeId}:`, subOrder._id);
    }

    // Step 2: Generate order number
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    const orderNumber = `ORD-${timestamp}${random}`;

    console.log(`[v0] Generated order number: ${orderNumber}`);

    // Step 3: Create MainOrder
    const mainOrder = await MainOrder.create({
      userId: userId,
      orderNumber: orderNumber,
      subOrders: createdSubOrders.map((order) => order._id),
      totalAmount: calculatedTotalAmount,
      deliveryFee: deliveryFee || 0,
      grandTotal: calculatedTotalAmount + (deliveryFee || 0),
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
      status: "pending",
    });

    console.log(`✅ MainOrder created:`, mainOrder._id);

    return {
      success: true,
      mainOrder: mainOrder,
      subOrders: createdSubOrders,
      message: `Order ${orderNumber} created with ${createdSubOrders.length} sub-order(s)`,
    };
  } catch (error: any) {
    console.error("❌ Failed to create main order:", error);
    throw error;
  }
}

// Helper to get user ID from token
async function getUserIdFromToken(token: string) {
  try {
    const jwt = await import("jsonwebtoken");
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    console.log("[v0] Decoded token:", decoded);

    const userId = decoded.userId || decoded.id || decoded._id;

    if (!userId) {
      console.error("[v0] No user ID found in token. Token payload:", decoded);
      throw new Error("User ID not found in token");
    }

    console.log("[v0] User ID extracted:", userId);
    return userId;
  } catch (error: any) {
    console.error("[v0] Failed to decode token:", error.message);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reference, orderData } = body;

    console.log("[v0] POST /api/paystack/verify - Reference:", reference);

    if (!reference) {
      return NextResponse.json(
        { error: "Missing reference parameter" },
        { status: 400 }
      );
    }

    const token = request.cookies.get("token")?.value;
    if (!token) {
      console.error("[v0] No authentication token found");
      return NextResponse.json(
        { error: "Unauthorized - No authentication token" },
        { status: 401 }
      );
    }

    // Get user ID from token
    const userId = await getUserIdFromToken(token);
    if (!userId) {
      console.error("[v0] Failed to get user ID from token");
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      console.error("[v0] PAYSTACK_SECRET_KEY is not set");
      return NextResponse.json(
        { error: "Payment service not configured" },
        { status: 500 }
      );
    }

    console.log("[v0] Verifying Paystack payment with reference:", reference);

    // Call Paystack API to verify transaction
    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
        },
      }
    );

    const verifyData = await verifyResponse.json();

    if (!verifyResponse.ok) {
      console.error("[v0] Paystack verification error:", verifyData);
      return NextResponse.json(
        { error: verifyData.message || "Failed to verify payment" },
        { status: verifyResponse.status }
      );
    }

    console.log("[v0] Paystack payment verified successfully");
    console.log("[v0] Payment amount:", verifyData.data.amount / 100, "NGN");
    console.log("[v0] Payment status:", verifyData.data.status);
    console.log("[v0] Payment channel:", verifyData.data.channel);

    if (verifyData.data.status === "success") {
      const paystackMetadata = verifyData.data.metadata ?? {};

      // Extract actual payment method from Paystack response
      // Extract actual payment method from Paystack response
      const paystackChannel = verifyData.data.channel || "card";

      // Map Paystack channels to your enum values
      let actualPaymentMethod: string;
      switch (paystackChannel.toLowerCase()) {
        case "card":
          actualPaymentMethod = "card";
          break;
        case "bank":
          actualPaymentMethod = "bank";
          break;
        case "bank_transfer":
          actualPaymentMethod = "bank_transfer";
          break;
        case "ussd":
          actualPaymentMethod = "ussd";
          break;
        case "qr":
          actualPaymentMethod = "qr";
          break;
        case "mobile_money":
          actualPaymentMethod = "mobile_money";
          break;
        case "transfer":
          actualPaymentMethod = "transfer";
          break;
        default:
          actualPaymentMethod = "card"; // Default to card
      }

      console.log(
        `[v0] Mapped payment method: ${paystackChannel} → ${actualPaymentMethod}`
      );

      // HANDLE SUBSCRIPTION PAYMENT
      if (paystackMetadata.type === "subscription") {
        console.log("[v0] Processing subscription payment...");

        const { plan, storeId } = paystackMetadata;
        if (!plan || !storeId) {
          return NextResponse.json(
            { error: "Invalid subscription metadata" },
            { status: 400 }
          );
        }

        try {
          const subscriptionResult = await updateSubscription(
            storeId,
            plan,
            verifyData.data.amount / 100,
            reference
          );

          console.log("[v0] Subscription updated successfully");

          return NextResponse.json({
            status: "success",
            message: "Subscription payment verified and updated successfully",
            data: subscriptionResult,
          });
        } catch (error: any) {
          console.error("[v0] Failed to update subscription:", error);
          return NextResponse.json(
            {
              error: "Payment verified but failed to update subscription",
              details: error.message,
            },
            { status: 500 }
          );
        }
      }

      // HANDLE REGULAR CHECKOUT PAYMENT
      console.log("[v0] Processing checkout payment...");

      const merged = {
        ...paystackMetadata,
        ...(orderData ?? {}),
      };

      const orders = merged.orders;
      if (!orders || !Array.isArray(orders) || orders.length === 0) {
        console.error("[v0] Invalid orders data:", {
          hasOrders: !!orders,
          isArray: Array.isArray(orders),
          length: orders?.length,
        });
        return NextResponse.json(
          {
            error: "Invalid orders data. At least one order is required.",
          },
          { status: 400 }
        );
      }

      console.log("[v0] Creating main order for user:", userId);
      console.log("[v0] Number of stores:", orders.length);

      // CREATE MAIN ORDER WITH SUB-ORDERS
      try {
        const orderResult = await createMainOrder(
          merged,
          reference,
          userId,
          actualPaymentMethod
        );

        console.log("[v0] ✅ MainOrder created successfully!");
        console.log("[v0] Order Number:", orderResult.mainOrder.orderNumber);
        console.log(
          "[v0] SubOrder IDs:",
          orderResult.subOrders.map((o) => o._id)
        );

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
            amount: verifyData.data.amount / 100,
          },
        });
      } catch (error: any) {
        console.error("[v0] ❌ Failed to create main order:", error);
        console.error("[v0] Error details:", {
          message: error.message,
          name: error.name,
          errors: error.errors,
        });
        return NextResponse.json(
          {
            error: "Payment verified but failed to create order",
            details: error.message,
          },
          { status: 500 }
        );
      }
    }

    console.log("[v0] Payment was not successful:", verifyData.data.status);
    return NextResponse.json(
      { error: "Payment was not successful" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[v0] ❌ Payment verification error:", error);
    return NextResponse.json(
      {
        error: "Failed to verify payment",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const reference = request.nextUrl.searchParams.get("reference");

    console.log("[v0] GET /api/paystack/verify - Reference:", reference);

    if (!reference) {
      return NextResponse.json(
        { error: "Missing reference parameter" },
        { status: 400 }
      );
    }

    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - No authentication token" },
        { status: 401 }
      );
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      console.error("[v0] PAYSTACK_SECRET_KEY is not set");
      return NextResponse.json(
        { error: "Payment service not configured" },
        { status: 500 }
      );
    }

    console.log(
      "[v0] GET: Verifying Paystack payment with reference:",
      reference
    );

    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
        },
      }
    );

    const verifyData = await verifyResponse.json();

    if (!verifyResponse.ok) {
      console.error("[v0] Paystack verification error:", verifyData);
      return NextResponse.json(
        { error: verifyData.message || "Failed to verify payment" },
        { status: verifyResponse.status }
      );
    }

    console.log("[v0] Paystack payment verified");

    if (verifyData.data.status === "success") {
      const metadata = verifyData.data.metadata ?? {};

      // HANDLE SUBSCRIPTION FOR GET REQUEST
      if (metadata.type === "subscription") {
        console.log("[v0] GET: Processing subscription payment...");

        const { plan, storeId } = metadata;
        if (!plan || !storeId) {
          return NextResponse.json(
            { error: "Invalid subscription metadata" },
            { status: 400 }
          );
        }

        try {
          const subscriptionResult = await updateSubscription(
            storeId,
            plan,
            verifyData.data.amount / 100,
            reference
          );

          console.log("[v0] Subscription updated successfully");

          return NextResponse.json({
            status: "success",
            message: "Subscription payment verified and updated successfully",
            data: {
              reference,
              plan,
              storeId,
              amount: verifyData.data.amount / 100,
              paymentStatus: "success",
              subscription: subscriptionResult,
            },
          });
        } catch (error: any) {
          console.error("[v0] Failed to update subscription:", error);
          return NextResponse.json(
            {
              error: "Payment verified but failed to update subscription",
              details: error.message,
            },
            { status: 500 }
          );
        }
      }

      // HANDLE CHECKOUT PAYMENT
      return NextResponse.json({
        status: "success",
        message: "Payment verified successfully",
        data: {
          reference,
          paymentStatus: "success",
          amount: verifyData.data.amount / 100,
          metadata,
        },
      });
    }

    return NextResponse.json(
      { error: "Payment was not successful" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[v0] Payment verification error:", error);
    return NextResponse.json(
      {
        error: "Failed to verify payment",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
