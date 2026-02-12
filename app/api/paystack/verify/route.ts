import { type NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Store from "@/models/Store";
import Order from "@/models/Order";
import MainOrder from "@/models/MainOrder";
import Product from "@/models/Product";
import mongoose from "mongoose";
import { PaymentLogger } from "@/lib/paymentLogger";

// Rate limiting store (in production, use Redis)
const verificationAttempts = new Map<
  string,
  { count: number; resetTime: number }
>();

function checkRateLimit(reference: string): boolean {
  const now = Date.now();
  const attempt = verificationAttempts.get(reference);

  if (!attempt || now > attempt.resetTime) {
    verificationAttempts.set(reference, { count: 1, resetTime: now + 60000 });
    return true;
  }

  if (attempt.count >= 5) {
    PaymentLogger.log({
      reference,
      event: "rate_limit_hit",
      metadata: { attemptCount: attempt.count },
    }).catch(console.error);
    return false;
  }

  attempt.count++;
  return true;
}

async function updateSubscription(
  storeId: string,
  plan: string,
  amount: number,
  reference: string,
) {
  try {
    await connectToDB();

    const now = new Date();
    const expiryDate = new Date(now);
    expiryDate.setMonth(expiryDate.getMonth() + 1);

    // Determine product limit based on plan
    let productLimit = 10;
    if (plan === "basic") productLimit = 20;
    else if (plan === "standard") productLimit = 50;
    else if (plan === "premium") productLimit = 999999;

    console.log("[Subscription Update] Updating store:", {
      storeId,
      plan,
      amount,
      reference,
      productLimit,
      expiryDate: expiryDate.toISOString(),
    });

    const updatedStore = await Store.findByIdAndUpdate(
      storeId,
      {
        subscriptionPlan: plan,
        subscriptionStatus: "active",
        subscriptionStartDate: now,
        subscriptionExpiryDate: expiryDate,
        lastPaymentAmount: amount,
        lastPaymentReference: reference,
        lastPaymentDate: now,
        productLimit: productLimit,
      },
      { new: true },
    ).lean();

    if (!updatedStore) {
      throw new Error("Store not found");
    }

    console.log("[Subscription Update] ✅ Success:", {
      storeId: updatedStore._id,
      plan: updatedStore.subscriptionPlan,
      status: updatedStore.subscriptionStatus,
      expiryDate: updatedStore.subscriptionExpiryDate,
      productLimit: updatedStore.productLimit,
    });

    return {
      success: true,
      store: updatedStore,
      plan: updatedStore.subscriptionPlan,
      status: updatedStore.subscriptionStatus,
      expiryDate: updatedStore.subscriptionExpiryDate,
      productLimit: updatedStore.productLimit,
    };
  } catch (error: any) {
    console.error("❌ Failed to update subscription:", error);
    throw error;
  }
}

async function verifyAndCalculateOrderAmount(
  orders: any[],
  deliveryFee: number = 0,
) {
  let calculatedTotal = 0;
  const verifiedOrders = [];

  console.log("=== Starting Order Verification ===");
  console.log("Delivery Fee (from metadata):", deliveryFee);

  for (const orderGroup of orders) {
    const { storeId, items } = orderGroup;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error(`Invalid items for store ${storeId}`);
    }

    let storeTotal = 0;
    const verifiedItems = [];

    console.log(`\n--- Verifying Store ${storeId} ---`);

    for (const item of items) {
      const product = await Product.findById(item.productId).lean();

      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }

      console.log(`Product: ${product.name}`);
      console.log(`  DB Price: ${product.price}`);
      console.log(`  Quantity: ${item.quantity}`);

      if (product.isDeleted) {
        throw new Error(`Product "${product.name}" is no longer available`);
      }

      if (!product.isActive) {
        throw new Error(`Product "${product.name}" is currently unavailable`);
      }

      if (product.inventoryQuantity < item.quantity) {
        throw new Error(
          `Insufficient stock for "${product.name}". Available: ${product.inventoryQuantity}, Requested: ${item.quantity}`,
        );
      }

      const actualPrice = Number(product.price);
      const itemTotal = actualPrice * item.quantity;

      console.log(
        `  Item Total: ₦${actualPrice} × ${item.quantity} = ₦${itemTotal}`,
      );

      verifiedItems.push({
        productId: product._id,
        productName: product.name,
        quantity: item.quantity,
        priceAtPurchase: actualPrice,
        itemTotal,
      });

      storeTotal += itemTotal;
    }

    console.log(`Store Total: ₦${storeTotal}`);

    verifiedOrders.push({
      storeId,
      items: verifiedItems,
      totalPrice: storeTotal,
    });

    calculatedTotal += storeTotal;
  }

  const grandTotal = calculatedTotal + deliveryFee;

  console.log("\n=== Calculation Summary ===");
  console.log(`Subtotal: ₦${calculatedTotal}`);
  console.log(`Delivery Fee: ₦${deliveryFee}`);
  console.log(`Grand Total: ₦${grandTotal}`);
  console.log("===========================\n");

  return {
    verifiedOrders,
    subtotal: calculatedTotal,
    deliveryFee,
    grandTotal,
  };
}

async function createMainOrder(
  verifiedOrderData: any,
  reference: string,
  userId: string,
  actualPaymentMethod: string,
  shippingInfo: any,
  paymentInfo: any,
  session: mongoose.ClientSession,
) {
  try {
    const { verifiedOrders, subtotal, deliveryFee, grandTotal } =
      verifiedOrderData;

    const createdSubOrders = [];

    for (const orderGroup of verifiedOrders) {
      const { storeId, items, totalPrice } = orderGroup;

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
        { session },
      );

      createdSubOrders.push(subOrder[0]);

      for (const item of items) {
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { inventoryQuantity: -item.quantity } },
          { session },
        );
      }
    }

    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    const orderNumber = `ORD-${timestamp}${random}`;

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
      { session },
    );

    return {
      success: true,
      mainOrder: mainOrder[0],
      subOrders: createdSubOrders,
      message: `Order ${orderNumber} created with ${createdSubOrders.length} sub-order(s)`,
    };
  } catch (error: any) {
    console.error("❌ Failed to create main order:", error);
    throw error;
  }
}

async function getUserIdFromToken(token: string) {
  try {
    const jwt = await import("jsonwebtoken");
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    const userId = decoded.userId || decoded.id || decoded._id;

    if (!userId) {
      console.error("No user ID found in token");
      throw new Error("User ID not found in token");
    }

    return userId;
  } catch (error: any) {
    console.error("Failed to decode token:", error.message);
    return null;
  }
}

async function verifyPaystackTransaction(reference: string) {
  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!paystackSecretKey) {
    throw new Error("Payment service not configured");
  }

  console.log("[Paystack Verify] Verifying reference:", reference);

  const verifyResponse = await fetch(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
      },
    },
  );

  const verifyData = await verifyResponse.json();

  console.log("[Paystack Verify] Response status:", verifyData.status);
  console.log("[Paystack Verify] Transaction status:", verifyData.data?.status);
  console.log(
    "[Paystack Verify] Raw metadata:",
    JSON.stringify(verifyData.data?.metadata, null, 2),
  );

  if (!verifyResponse.ok) {
    throw new Error(verifyData.message || "Failed to verify payment");
  }

  return verifyData;
}

// Helper function to extract metadata with fallbacks
function extractMetadata(paystackMetadata: any) {
  console.log(
    "[Extract Metadata] Input:",
    JSON.stringify(paystackMetadata, null, 2),
  );

  // Try to get type
  const type =
    paystackMetadata.type ||
    paystackMetadata.custom_fields?.find((f: any) => f.variable_name === "type")
      ?.value;

  // Try to get plan
  const plan =
    paystackMetadata.plan ||
    paystackMetadata.custom_fields?.find((f: any) => f.variable_name === "plan")
      ?.value;

  // Try to get storeId (with multiple possible field names)
  const storeId =
    paystackMetadata.storeId ||
    paystackMetadata.store_id ||
    paystackMetadata.custom_fields?.find(
      (f: any) => f.variable_name === "store_id",
    )?.value;

  const result = { type, plan, storeId };
  console.log("[Extract Metadata] Extracted:", result);

  return result;
}

export async function POST(request: NextRequest) {
  const session = await mongoose.startSession();
  let requestBody: any = null;

  try {
    requestBody = await request.json();
    const { reference } = requestBody;

    if (!reference) {
      return NextResponse.json(
        { error: "Missing reference parameter" },
        { status: 400 },
      );
    }

    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const ipAddress = forwardedFor?.split(",")[0] || realIp || "unknown";

    await PaymentLogger.log({
      reference,
      event: "verification_started",
      ipAddress,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    if (!checkRateLimit(reference)) {
      return NextResponse.json(
        { error: "Too many verification attempts. Please try again later." },
        { status: 429 },
      );
    }

    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - No authentication token" },
        { status: 401 },
      );
    }

    const userId = await getUserIdFromToken(token);
    if (!userId) {
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 },
      );
    }

    // Verify payment with Paystack
    const verifyData = await verifyPaystackTransaction(reference);

    if (verifyData.data.status !== "success") {
      console.log(
        "[Paystack Verify] Payment not successful:",
        verifyData.data.status,
      );
      return NextResponse.json(
        { error: "Payment was not successful" },
        { status: 400 },
      );
    }

    const paystackMetadata = verifyData.data.metadata ?? {};
    const paystackChannel = verifyData.data.channel || "card";
    const paidAmount = verifyData.data.amount / 100; // Convert from kobo to naira

    console.log(
      `💰 Payment verified: ₦${paidAmount} (${verifyData.data.amount} kobo)`,
    );
    console.log(
      "[Paystack Verify] Raw Metadata:",
      JSON.stringify(paystackMetadata, null, 2),
    );

    // Extract metadata with fallbacks
    const {
      type: metadataType,
      plan: extractedPlan,
      storeId: extractedStoreId,
    } = extractMetadata(paystackMetadata);

    console.log("[Paystack Verify] Extracted values:", {
      type: metadataType,
      plan: extractedPlan,
      storeId: extractedStoreId,
    });

    // Map payment channel
    let actualPaymentMethod: string;
    switch (paystackChannel.toLowerCase()) {
      case "card":
        actualPaymentMethod = "card";
        break;
      case "bank":
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
        actualPaymentMethod = "card";
    }

    // ✅ FIXED: Handle subscription payments with better metadata extraction
    if (metadataType === "subscription") {
      console.log("[Subscription] Processing subscription payment:", {
        plan: extractedPlan,
        storeId: extractedStoreId,
        amount: paidAmount,
      });

      if (!extractedPlan || !extractedStoreId) {
        console.error("[Subscription] Missing required metadata:", {
          plan: extractedPlan,
          storeId: extractedStoreId,
          rawMetadata: paystackMetadata,
        });
        return NextResponse.json(
          {
            error: "Invalid subscription metadata",
            details: {
              plan: extractedPlan,
              storeId: extractedStoreId,
              receivedMetadata: Object.keys(paystackMetadata),
            },
          },
          { status: 400 },
        );
      }

      try {
        // Check if subscription already updated
        await connectToDB();
        const existingStore = await Store.findById(extractedStoreId).lean();

        if (existingStore && existingStore.lastPaymentReference === reference) {
          console.log(
            "[Subscription] Already processed, returning existing data",
          );

          return NextResponse.json({
            status: "success",
            success: true,
            message: "Subscription payment already processed",
            data: {
              reference,
              type: "subscription",
              subscriptionUpdated: true,
              paymentStatus: "success",
              amount: paidAmount,
              plan: existingStore.subscriptionPlan,
              status: existingStore.subscriptionStatus,
              expiryDate: existingStore.subscriptionExpiryDate,
              productLimit: existingStore.productLimit,
            },
          });
        }

        // Verify store exists before updating
        if (!existingStore) {
          console.error("[Subscription] Store not found:", extractedStoreId);
          return NextResponse.json(
            { error: "Store not found" },
            { status: 404 },
          );
        }

        // Update subscription
        const subscriptionResult = await updateSubscription(
          extractedStoreId,
          extractedPlan,
          paidAmount,
          reference,
        );

        await PaymentLogger.log({
          reference,
          userId,
          event: "subscription_updated",
          amount: paidAmount,
          metadata: {
            storeId: extractedStoreId,
            plan: extractedPlan,
            expiryDate: subscriptionResult.expiryDate,
            productLimit: subscriptionResult.productLimit,
          },
        });

        return NextResponse.json({
          status: "success",
          success: true,
          message: "Subscription payment verified and updated successfully",
          data: {
            reference,
            type: "subscription",
            subscriptionUpdated: true,
            paymentStatus: "success",
            amount: paidAmount,
            plan: subscriptionResult.plan,
            status: subscriptionResult.status,
            expiryDate: subscriptionResult.expiryDate,
            productLimit: subscriptionResult.productLimit,
            storeId: extractedStoreId,
          },
        });
      } catch (error: any) {
        console.error("[Subscription] Update failed:", error);
        console.error("[Subscription] Error stack:", error.stack);

        await PaymentLogger.log({
          reference,
          userId,
          event: "subscription_update_failed",
          error: error.message,
          metadata: { stack: error.stack },
        });

        return NextResponse.json(
          {
            error: "Payment verified but failed to update subscription",
            details: error.message,
          },
          { status: 500 },
        );
      }
    }

    // Handle order payments with transaction
    await connectToDB();
    session.startTransaction();

    try {
      const existingOrders = await Order.find({ reference })
        .session(session)
        .lean();

      if (existingOrders.length > 0) {
        await session.abortTransaction();
        console.log("✅ Orders already exist, returning existing data");

        await PaymentLogger.log({
          reference,
          userId,
          event: "duplicate_detected",
          metadata: { orderCount: existingOrders.length },
        });

        const mainOrder = await MainOrder.findOne({
          subOrders: { $in: existingOrders.map((o) => o._id) },
        }).lean();

        return NextResponse.json({
          status: "success",
          message: "Payment already processed",
          data: {
            reference,
            orderNumber: mainOrder?.orderNumber,
            orderExists: true,
            status: mainOrder?.status,
            grandTotal: mainOrder?.grandTotal,
            subOrderCount: existingOrders.length,
            mainOrder,
            subOrders: existingOrders,
            paymentStatus: "success",
            paymentMethod: actualPaymentMethod,
            amount: paidAmount,
          },
        });
      }

      const orders = paystackMetadata.orders;
      const shippingInfo = paystackMetadata.shippingInfo;
      const deliveryFee = paystackMetadata.deliveryFee || 0;

      if (!orders || !Array.isArray(orders) || orders.length === 0) {
        await session.abortTransaction();
        return NextResponse.json(
          { error: "Invalid orders data in payment metadata" },
          { status: 400 },
        );
      }

      if (!shippingInfo) {
        await session.abortTransaction();
        return NextResponse.json(
          { error: "Missing shipping information in payment metadata" },
          { status: 400 },
        );
      }

      const verifiedOrderData = await verifyAndCalculateOrderAmount(
        orders,
        deliveryFee,
      );

      const amountDifference = Math.abs(
        paidAmount - verifiedOrderData.grandTotal,
      );
      if (amountDifference > 1) {
        await session.abortTransaction();
        console.error(
          `❌ Amount mismatch: Paid ₦${paidAmount}, Expected ₦${verifiedOrderData.grandTotal}, Difference: ₦${amountDifference}`,
        );

        await PaymentLogger.log({
          reference,
          userId,
          event: "amount_mismatch",
          amount: paidAmount,
          expectedAmount: verifiedOrderData.grandTotal,
          metadata: {
            difference: amountDifference,
            deliveryFee,
            subtotal: verifiedOrderData.subtotal,
          },
        });

        return NextResponse.json(
          {
            error: "Payment amount does not match order total",
            details: {
              paid: paidAmount,
              expected: verifiedOrderData.grandTotal,
              difference: amountDifference,
              subtotal: verifiedOrderData.subtotal,
              deliveryFee: deliveryFee,
            },
          },
          { status: 400 },
        );
      }

      const paymentInfo = {
        transactionId: verifyData.data.id,
        amount: paidAmount,
        currency: verifyData.data.currency,
        channel: paystackChannel,
        fees: verifyData.data.fees ? verifyData.data.fees / 100 : 0,
        paidAt: new Date(
          verifyData.data.paid_at || verifyData.data.transaction_date,
        ),
      };

      const orderResult = await createMainOrder(
        verifiedOrderData,
        reference,
        userId,
        actualPaymentMethod,
        shippingInfo,
        paymentInfo,
        session,
      );

      await session.commitTransaction();

      console.log(
        `✅ Order ${orderResult.mainOrder.orderNumber} created successfully`,
      );

      await PaymentLogger.log({
        reference,
        userId,
        event: "order_created",
        amount: paidAmount,
        metadata: {
          orderNumber: orderResult.mainOrder.orderNumber,
          subOrderCount: orderResult.subOrders.length,
        },
      });

      return NextResponse.json({
        status: "success",
        message: "Payment verified and order created successfully",
        data: {
          reference,
          orderNumber: orderResult.mainOrder.orderNumber,
          orderExists: true,
          status: orderResult.mainOrder.status,
          grandTotal: orderResult.mainOrder.grandTotal,
          subOrderCount: orderResult.subOrders.length,
          mainOrder: orderResult.mainOrder,
          subOrders: orderResult.subOrders,
          paymentStatus: "success",
          paymentMethod: actualPaymentMethod,
          amount: paidAmount,
        },
      });
    } catch (error: any) {
      await session.abortTransaction();
      console.error("❌ Transaction failed:", error);

      await PaymentLogger.log({
        reference,
        userId,
        event: "verification_failed",
        error: error.message,
        metadata: { stack: error.stack },
      });

      return NextResponse.json(
        {
          error: "Payment verified but failed to create order",
          details: error.message,
        },
        { status: 500 },
      );
    }
  } catch (error: any) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    console.error("❌ Payment verification error:", error);

    await PaymentLogger.log({
      reference: requestBody?.reference || "unknown",
      event: "verification_failed",
      error: error.message,
    });

    return NextResponse.json(
      {
        error: "Failed to verify payment",
        details: error.message,
      },
      { status: 500 },
    );
  } finally {
    session.endSession();
  }
}

export async function GET(request: NextRequest) {
  try {
    const reference = request.nextUrl.searchParams.get("reference");

    if (!reference) {
      return NextResponse.json(
        { error: "Missing reference parameter" },
        { status: 400 },
      );
    }

    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - No authentication token" },
        { status: 401 },
      );
    }

    const userId = await getUserIdFromToken(token);
    if (!userId) {
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 },
      );
    }

    const verifyData = await verifyPaystackTransaction(reference);

    if (verifyData.data.status !== "success") {
      return NextResponse.json(
        { error: "Payment was not successful" },
        { status: 400 },
      );
    }

    const paystackMetadata = verifyData.data.metadata ?? {};
    const paidAmount = verifyData.data.amount / 100;

    console.log(
      "[GET Verify] Raw metadata:",
      JSON.stringify(paystackMetadata, null, 2),
    );

    // Extract metadata with fallbacks
    const {
      type: metadataType,
      plan: extractedPlan,
      storeId: extractedStoreId,
    } = extractMetadata(paystackMetadata);

    console.log("[GET Verify] Extracted:", {
      type: metadataType,
      plan: extractedPlan,
      storeId: extractedStoreId,
    });

    // ✅ FIXED: Handle subscription verification AND UPDATE
    if (metadataType === "subscription") {
      if (!extractedPlan || !extractedStoreId) {
        return NextResponse.json(
          { error: "Invalid subscription metadata" },
          { status: 400 },
        );
      }

      await connectToDB();
      const store = await Store.findById(extractedStoreId).lean();

      const subscriptionUpdated = store?.lastPaymentReference === reference;

      // ✅ NEW: If not yet updated, update it now!
      if (!subscriptionUpdated && store) {
        console.log(
          "[GET Verify] Subscription not yet updated, updating now...",
        );

        try {
          const subscriptionResult = await updateSubscription(
            extractedStoreId,
            extractedPlan,
            paidAmount,
            reference,
          );

          await PaymentLogger.log({
            reference,
            userId,
            event: "subscription_updated_from_get",
            amount: paidAmount,
            metadata: {
              storeId: extractedStoreId,
              plan: extractedPlan,
              expiryDate: subscriptionResult.expiryDate,
              productLimit: subscriptionResult.productLimit,
            },
          });

          console.log("[GET Verify] ✅ Subscription updated successfully");

          return NextResponse.json({
            status: "success",
            success: true,
            message: "Subscription payment verified and updated successfully",
            data: {
              reference,
              type: "subscription",
              plan: subscriptionResult.plan,
              storeId: extractedStoreId,
              amount: paidAmount,
              paymentStatus: "success",
              subscriptionUpdated: true,
              expiryDate: subscriptionResult.expiryDate,
              productLimit: subscriptionResult.productLimit,
            },
          });
        } catch (error: any) {
          console.error("[GET Verify] Failed to update subscription:", error);

          await PaymentLogger.log({
            reference,
            userId,
            event: "subscription_update_failed_from_get",
            error: error.message,
          });

          return NextResponse.json(
            {
              error: "Payment verified but failed to update subscription",
              details: error.message,
            },
            { status: 500 },
          );
        }
      }

      // Already updated
      return NextResponse.json({
        status: "success",
        success: true,
        message: "Subscription payment verified and updated",
        data: {
          reference,
          type: "subscription",
          plan: store?.subscriptionPlan || extractedPlan,
          storeId: extractedStoreId,
          amount: paidAmount,
          paymentStatus: "success",
          subscriptionUpdated: true,
          expiryDate: store?.subscriptionExpiryDate,
          productLimit: store?.productLimit,
        },
      });
    }

    // Handle order verification (existing code)
    await connectToDB();
    const existingOrders = await Order.find({ reference }).lean();

    if (existingOrders.length > 0) {
      const mainOrder = await MainOrder.findOne({
        subOrders: { $in: existingOrders.map((o) => o._id) },
      }).lean();

      return NextResponse.json({
        status: "success",
        message: "Payment verified and order exists",
        data: {
          reference,
          paymentStatus: "success",
          amount: paidAmount,
          orderExists: true,
          orderNumber: mainOrder?.orderNumber,
          status: mainOrder?.status,
          grandTotal: mainOrder?.grandTotal,
          subOrderCount: existingOrders.length,
        },
      });
    }

    return NextResponse.json({
      status: "success",
      message: "Payment verified, order not yet created",
      data: {
        reference,
        paymentStatus: "success",
        amount: paidAmount,
        metadata: paystackMetadata,
        orderExists: false,
      },
    });
  } catch (error: any) {
    console.error("❌ Payment verification error:", error);
    return NextResponse.json(
      {
        error: "Failed to verify payment",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
