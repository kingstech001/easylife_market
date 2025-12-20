// lib/subscriptions/enforceProductLimit.ts
import Product from "@/models/Product";
import Store from "@/models/Store";
import mongoose from "mongoose";
import { connectToDB } from "../db";

/**
 * Enforce product limit for a store.
 * - If limit is null => unlimited => activate all non-deleted products
 * - If limit is a number => ensure exactly `limit` products are active (prefer newest)
 *
 * Behavior:
 * - Newest products are preferred to be active.
 * - When reducing limit, oldest extra products become inactive (isActive=false).
 * - Sets deactivatedAt when deactivating products.
 */
export async function enforceProductLimitForStore(
  storeId: string | mongoose.Types.ObjectId
) {
  await connectToDB();

  console.log(`🔧 Enforcing product limit for store: ${storeId}`);

  // ✅ CRITICAL: Removed .lean() to get fresh data from DB, not cache
  const store = await Store.findById(storeId);
  if (!store) {
    throw new Error("Store not found");
  }

  const limit = store.productLimit ?? null; // null -> unlimited
  console.log(
    `📋 Store plan: ${store.subscriptionPlan}, limit: ${
      limit === null ? "unlimited" : limit
    }`
  );

  // Fetch all non-deleted products for the store sorted newest first
  const allProducts = await Product.find({
    storeId: store._id,
    isDeleted: false,
  })
    .sort({ createdAt: -1 }) // newest first
    .select("_id createdAt isActive name");

  console.log(`📦 Found ${allProducts.length} products`);

  // If unlimited: make all active
  if (limit === null) {
    const inactiveIds = allProducts
      .filter((p) => !p.isActive)
      .map((p) => p._id);

    if (inactiveIds.length === 0) {
      console.log(`✅ All products already active (unlimited plan)`);
      return {
        activated: 0,
        deactivated: 0,
        visibleCount: allProducts.length,
        total: allProducts.length,
      };
    }

    const res = await Product.updateMany(
      { _id: { $in: inactiveIds }, isDeleted: false },
      { $set: { isActive: true, deactivatedAt: null } }
    );

    console.log(`✅ Activated ${res.modifiedCount} products (unlimited plan)`);
    return {
      activated: res.modifiedCount ?? 0,
      deactivated: 0,
      visibleCount: allProducts.length,
      total: allProducts.length,
    };
  }

  // limit is a number
  const desiredLimit = Math.max(0, Number(limit));

  // If all products fit within limit, activate all
  if (allProducts.length <= desiredLimit) {
    const inactiveIds = allProducts
      .filter((p) => !p.isActive)
      .map((p) => p._id);

    if (inactiveIds.length === 0) {
      console.log(
        `✅ All ${allProducts.length} products already active (within limit of ${desiredLimit})`
      );
      return {
        activated: 0,
        deactivated: 0,
        visibleCount: allProducts.length,
        total: allProducts.length,
      };
    }

    const res = await Product.updateMany(
      { _id: { $in: inactiveIds }, isDeleted: false },
      { $set: { isActive: true, deactivatedAt: null } }
    );

    console.log(
      `✅ Activated ${res.modifiedCount} products (all within limit)`
    );
    return {
      activated: res.modifiedCount ?? 0,
      deactivated: 0,
      visibleCount: allProducts.length,
      total: allProducts.length,
    };
  }

  // Need to enforce limit: activate newest N, deactivate rest
  const visibleIds = allProducts.slice(0, desiredLimit).map((p) => p._id);
  const invisibleIds = allProducts.slice(desiredLimit).map((p) => p._id);

  console.log(
    `🎯 Enforcing limit: ${visibleIds.length} active, ${invisibleIds.length} inactive`
  );

  const ops: Promise<any>[] = [];

  // Activate newest products
  if (visibleIds.length > 0) {
    ops.push(
      Product.updateMany(
        { _id: { $in: visibleIds }, isDeleted: false },
        { $set: { isActive: true, deactivatedAt: null } }
      )
    );
  }

  // Deactivate older products
  if (invisibleIds.length > 0) {
    ops.push(
      Product.updateMany(
        { _id: { $in: invisibleIds }, isDeleted: false },
        { $set: { isActive: false, deactivatedAt: new Date() } }
      )
    );
  }

  const results = await Promise.all(ops);

  const activated = results[0]?.modifiedCount ?? 0;
  const deactivated = results[1]?.modifiedCount ?? (results.length > 1 ? 0 : 0);

  console.log(
    `✅ Enforcement complete: activated ${activated}, deactivated ${deactivated}`
  );

  return {
    activated,
    deactivated,
    visibleCount: visibleIds.length,
    total: allProducts.length,
  };
}

// /**
//  * Helper to set a new plan on a store and enforce limits in one go.
//  * ✅ FIXED: Removed .lean() and added markModified() calls
//  */
// export async function setStorePlanAndEnforce(
//   storeId: string | mongoose.Types.ObjectId,
//   plan: "free" | "basic" | "standard" | "premium",
//   startDate?: Date | null,
//   endDate?: Date | null
// ) {
//   await connectToDB();

//   console.log(`🔄 Setting store ${storeId} to plan: ${plan}`);

//   const planLimits: Record<string, number | null> = {
//     free: 10,
//     basic: 20,
//     standard: 50,
//     premium: null,
//   };

//   const productLimit = planLimits[plan];

//   // ✅ CRITICAL: Use find-then-save pattern
//   const store = await Store.findById(storeId);
//   if (!store) {
//     throw new Error("Store not found");
//   }

//   store.subscriptionPlan = plan;
//   store.productLimit = productLimit; // ✅ Manually set productLimit
//   store.subscriptionStartDate = startDate ?? store.subscriptionStartDate;
//   store.subscriptionExpiryDate = endDate ?? store.subscriptionExpiryDate;

//   // ✅ Mark fields as modified to ensure Mongoose tracks changes
//   store.markModified("subscriptionPlan");
//   store.markModified("productLimit");

//   await store.save();

//   // Small delay to ensure DB write completes
//   await new Promise((resolve) => setTimeout(resolve, 100));

//   // Verify the save worked
//   const verification = await Store.findById(storeId).lean();
//   console.log(`🔍 Verification after save:`);
//   console.log(`   Plan: ${verification?.subscriptionPlan}`);
//   console.log(`   Limit: ${verification?.productLimit}`);
//   console.log(`   Start: ${verification?.subscriptionStartDate}`);
//   console.log(`   End: ${verification?.subscriptionExpiryDate}`);

//   if (verification?.productLimit !== productLimit) {
//     console.error(`❌ WARNING: Product limit mismatch!`);
//     console.error(`   Expected: ${productLimit}`);
//     console.error(`   Got: ${verification?.productLimit}`);

//     // Force update
//     await Store.findByIdAndUpdate(
//   storeId,
//   {
//     $set: {
//       subscriptionPlan: plan,
//       productLimit: productLimit,
//       subscriptionStartDate: startDate,
//       subscriptionExpiryDate: endDate,
//     }
//   },
//   { new: true }
// )


//     console.log(`🔧 Applied force update`);
//   }

//   console.log(
//     `✅ Store updated to ${plan} plan (limit: ${
//       productLimit === null ? "unlimited" : productLimit
//     })`
//   );

//   // Now enforce with fresh data
//   const result = await enforceProductLimitForStore(storeId);

//   console.log(
//     `📊 Final result: ${result.visibleCount}/${result.total} products visible`
//   );

//   return result;
// }
