// app/api/subscriptions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Store from "@/models/Store";
import { enforceProductLimitForStore } from "@/lib/subscriptions/enforceProductLimit";

const PLAN_DURATIONS: Record<string, number> = {
  free: 0,
  basic: 30,
  standard: 30,
  premium: 30,
};

const PLAN_LIMITS: Record<string, number | null> = {
  free: 10,
  basic: 20,
  standard: 50,
  premium: null, // null = unlimited
};

/**
 * ✅ POST: Manual subscription selection (with Paystack verification)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeId, plan, amount, reference } = body;

    if (!storeId) {
      return NextResponse.json(
        { error: "Store ID is required" },
        { status: 400 }
      );
    }

    if (!plan || !["free", "basic", "standard", "premium"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    if (amount > 0 && !reference) {
      return NextResponse.json(
        { error: "Payment reference required for paid plans" },
        { status: 400 }
      );
    }

    // Verify payment with Paystack for paid plans
    if (amount > 0) {
      const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
      if (!paystackSecretKey) {
        return NextResponse.json(
          { error: "Payment configuration error" },
          { status: 500 }
        );
      }

      const verifyResponse = await fetch(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: { Authorization: `Bearer ${paystackSecretKey}` },
        }
      );

      if (!verifyResponse.ok) {
        return NextResponse.json(
          { error: "Failed to verify payment with Paystack" },
          { status: 500 }
        );
      }

      const verifyData = await verifyResponse.json();

      if (!verifyData.status || verifyData.data.status !== "success") {
        return NextResponse.json(
          { error: "Payment verification failed" },
          { status: 400 }
        );
      }

      if (verifyData.data.amount !== amount * 100) {
        return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
      }
    }

    await connectToDB();

    const startDate = new Date();
    let endDate: Date | null = null;

    if (plan !== "free") {
      const durationDays = PLAN_DURATIONS[plan];
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + durationDays);
    }

    // ✅ Get the correct product limit
    const productLimit = PLAN_LIMITS[plan] ?? null;

    console.log(`📋 Updating subscription:`);
    console.log(`   Store: ${storeId}`);
    console.log(`   Plan: ${plan}`);
    console.log(
      `   Product Limit: ${productLimit === null ? "UNLIMITED" : productLimit}`
    );

    // Update store subscription
    const updatedStore = await Store.findByIdAndUpdate(
      storeId,
      {
        subscriptionPlan: plan,
        subscriptionStatus: "active",
        subscriptionStartDate: startDate,
        subscriptionExpiryDate: endDate, // ✅ FIXED: was subscriptionEndDate
        productLimit: productLimit,
        lastPaymentReference: reference || null,
        lastPaymentAmount: amount,
        lastPaymentDate: amount > 0 ? new Date() : undefined,
      },
      { new: true }
    );

    if (!updatedStore) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    console.log(`✅ Store updated successfully`);

    // Enforce product limit
    const productResult = await enforceProductLimitForStore(storeId);

    console.log(`✅ Product limit enforced:`, {
      activated: productResult.activated,
      deactivated: productResult.deactivated,
      visibleCount: productResult.visibleCount,
      total: productResult.total,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Successfully updated subscription to ${plan}`,
        data: {
          plan,
          productLimit: updatedStore.productLimit,
          startDate,
          endDate,
          products: {
            activated: productResult.activated,
            deactivated: productResult.deactivated,
            visible: productResult.visibleCount,
            total: productResult.total,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Subscription POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * ✅ PUT: Called by webhook after payment verification
 * Payment already verified by webhook, so no Paystack check needed
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeId, plan, amount, reference } = body;


    if (!storeId) {
      return NextResponse.json(
        { error: "Store ID is required" },
        { status: 400 }
      );
    }

    if (!plan || !["free", "basic", "standard", "premium"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    await connectToDB();

    const startDate = new Date();
    let endDate: Date | null = null;

    if (plan !== "free") {
      const durationDays = PLAN_DURATIONS[plan];
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + durationDays);
    }


    // Try multiple ways to get the value
    const directLookup = PLAN_LIMITS[plan];
    const withUndefinedCheck =
      PLAN_LIMITS[plan] !== undefined ? PLAN_LIMITS[plan] : 10;
    const withNullishCoalescing = PLAN_LIMITS[plan] ?? 10;

    // Use the most explicit method
    const productLimit =
      PLAN_LIMITS[plan] !== undefined ? PLAN_LIMITS[plan] : 10;


    const updatedStore = await Store.findByIdAndUpdate(
      storeId,
      {
        $set: {
          subscriptionPlan: plan,
          subscriptionStatus: "active",
          subscriptionStartDate: startDate,
          subscriptionExpiryDate: endDate,
          productLimit: productLimit,
          lastPaymentReference: reference ?? null,
          lastPaymentAmount: amount ?? 0,
          lastPaymentDate: new Date(),
        },
      },
      { new: true }
    );

    if (!updatedStore) {
      console.error(`❌ Store ${storeId} not found!`);
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }


    // ✅ Double-check with fresh database read
    await new Promise((resolve) => setTimeout(resolve, 100));
    const freshStore = await Store.findById(storeId).select(
      "subscriptionPlan productLimit subscriptionStatus"
    );


    // ✅ If STILL wrong, force fix with direct MongoDB update
    if (freshStore?.productLimit !== productLimit) {

      const mongoose = (await import("mongoose")).default;
      await mongoose.connection.collection("stores").updateOne(
        { _id: new mongoose.Types.ObjectId(storeId) },
        {
          $set: {
            productLimit: productLimit === null ? null : Number(productLimit),
            subscriptionPlan: plan,
            updatedAt: new Date(),
          },
        }
      );

      // console.log(`🔧 Applied direct MongoDB update`);

      // Final check
      const finalCheck = await Store.findById(storeId).select(
        "productLimit subscriptionPlan"
      );
    }

    // Enforce product limit
    const productResult = await enforceProductLimitForStore(storeId);


    return NextResponse.json(
      {
        success: true,
        message: `Subscription updated successfully via webhook`,
        data: {
          plan,
          productLimit: updatedStore.productLimit,
          startDate,
          endDate,
          products: {
            activated: productResult.activated,
            deactivated: productResult.deactivated,
            visible: productResult.visibleCount,
            total: productResult.total,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Subscription PUT error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
