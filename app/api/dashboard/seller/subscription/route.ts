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

    console.log(`\n${"=".repeat(60)}`);
    console.log(`📞 SUBSCRIPTION API CALLED BY WEBHOOK`);
    console.log(`${"=".repeat(60)}`);
    console.log(`   Store ID: ${storeId}`);
    console.log(`   Plan: ${plan}`);
    console.log(`   Amount: ₦${amount}`);
    console.log(`   Reference: ${reference}`);

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

    // ✅ CRITICAL DEBUG: Get the correct product limit with EXTENSIVE logging
    console.log(`\n🔍 DETAILED PLAN_LIMITS INSPECTION:`);
    console.log(`   PLAN_LIMITS object:`, JSON.stringify(PLAN_LIMITS, null, 2));
    console.log(`   Keys in PLAN_LIMITS:`, Object.keys(PLAN_LIMITS));

    console.log(`\n📊 Product Limit Calculation:`);
    console.log(`   Received plan: "${plan}"`);
    console.log(`   Plan type: ${typeof plan}`);
    console.log(`   Plan trimmed: "${plan.trim()}"`);
    console.log(`   Plan in PLAN_LIMITS: ${plan in PLAN_LIMITS}`);
    console.log(`   Direct access PLAN_LIMITS["${plan}"]:`, PLAN_LIMITS[plan]);
    console.log(
      `   Using bracket notation:`,
      PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS]
    );

    // Try multiple ways to get the value
    const directLookup = PLAN_LIMITS[plan];
    const withUndefinedCheck =
      PLAN_LIMITS[plan] !== undefined ? PLAN_LIMITS[plan] : 10;
    const withNullishCoalescing = PLAN_LIMITS[plan] ?? 10;

    console.log(`\n🧪 Different lookup methods:`);
    console.log(
      `   directLookup:`,
      directLookup,
      `(type: ${typeof directLookup})`
    );
    console.log(
      `   withUndefinedCheck:`,
      withUndefinedCheck,
      `(type: ${typeof withUndefinedCheck})`
    );
    console.log(
      `   withNullishCoalescing:`,
      withNullishCoalescing,
      `(type: ${typeof withNullishCoalescing})`
    );

    // Use the most explicit method
    const productLimit =
      PLAN_LIMITS[plan] !== undefined ? PLAN_LIMITS[plan] : 10;

    console.log(`\n✅ Final productLimit value:`);
    console.log(`   Value: ${productLimit}`);
    console.log(`   Type: ${typeof productLimit}`);
    console.log(`   Is null: ${productLimit === null}`);
    console.log(`   Is undefined: ${productLimit === undefined}`);
    console.log(`   Is number: ${typeof productLimit === "number"}`);
    console.log(
      `   Display: ${productLimit === null ? "UNLIMITED" : productLimit}`
    );

    // Update store subscription
    console.log(`\n🔄 Updating store in database...`);
    console.log(`   About to save with productLimit:`, productLimit);

    const updatedStore = await Store.findByIdAndUpdate(
      storeId,
      {
        $set: {
          subscriptionPlan: plan,
          subscriptionStatus: "active",
          subscriptionStartDate: startDate,
          subscriptionExpiryDate: endDate,
          productLimit: productLimit, // NEVER undefined
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

    console.log(`💾 Store updated successfully`);

    // ✅ CRITICAL: Verify immediately after update
    console.log(`\n🔍 Immediate verification (from returned document):`);
    console.log(`   Plan: ${updatedStore.subscriptionPlan}`);
    console.log(`   Product Limit: ${updatedStore.productLimit}`);
    console.log(`   Status: ${updatedStore.subscriptionStatus}`);
    console.log(
      `   Match: ${
        updatedStore.productLimit === productLimit ? "✅ CORRECT" : "❌ WRONG!"
      }`
    );

    // ✅ Double-check with fresh database read
    await new Promise((resolve) => setTimeout(resolve, 100));
    const freshStore = await Store.findById(storeId).select(
      "subscriptionPlan productLimit subscriptionStatus"
    );

    console.log(`\n🔍 Fresh database read verification:`);
    console.log(`   Plan: ${freshStore?.subscriptionPlan}`);
    console.log(`   Product Limit: ${freshStore?.productLimit}`);
    console.log(`   Status: ${freshStore?.subscriptionStatus}`);
    console.log(
      `   Match: ${
        freshStore?.productLimit === productLimit ? "✅ CORRECT" : "❌ WRONG!"
      }`
    );

    // ✅ If STILL wrong, force fix with direct MongoDB update
    if (freshStore?.productLimit !== productLimit) {
      console.error(
        `\n❌ CRITICAL: Product limit is STILL wrong after update!`
      );
      console.error(`   Expected: ${productLimit}`);
      console.error(`   Got: ${freshStore?.productLimit}`);
      console.error(`   Applying emergency direct MongoDB update...`);

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

      console.log(`🔧 Applied direct MongoDB update`);

      // Final check
      const finalCheck = await Store.findById(storeId).select(
        "productLimit subscriptionPlan"
      );
      console.log(
        `   Final check - Limit: ${finalCheck?.productLimit}, Plan: ${finalCheck?.subscriptionPlan}`
      );
    }

    // Enforce product limit
    console.log(`\n🔧 Enforcing product limit...`);
    const productResult = await enforceProductLimitForStore(storeId);

    console.log(`\n✅ Product limit enforced:`);
    console.log(`   Activated: ${productResult.activated}`);
    console.log(`   Deactivated: ${productResult.deactivated}`);
    console.log(
      `   Visible: ${productResult.visibleCount}/${productResult.total}`
    );
    console.log(`${"=".repeat(60)}\n`);

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
