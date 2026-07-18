// components/home/FeaturedStoresSection.tsx

import { Suspense } from "react";
import { FeaturedStoresClient } from "./FeaturedStoresClient";
import { FeaturedStoresLoading } from "./FeaturedStoresLoading";
import { connectToDB } from "@/lib/db";
import Store from "@/models/Store";
import Product from "@/models/Product";
import type { Types } from "mongoose";

interface DaySchedule {
  open: boolean;
  openTime: string;
  closeTime: string;
}

interface BusinessHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

// Define the StoreData interface
interface StoreData {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  sellerId: string;
  isPublished: boolean;
  productCount?: number;
  businessHours?: BusinessHours | null;
  createdAt: string;
  updatedAt: string;
}

async function getFeaturedStores(): Promise<StoreData[]> {
  try {
    await connectToDB();
    
    // Fetch only 4 published and approved stores
    const stores = await Store.find({ 
      isPublished: true, 
      isApproved: true 
    })
    .sort({ createdAt: -1 })
    .limit(4)
    .lean();

    const storeIds = stores.map((store: any) => store._id);
    const productCounts = await Product.aggregate([
      { $match: { storeId: { $in: storeIds } } },
      { $group: { _id: "$storeId", count: { $sum: 1 } } },
    ]);
    const countByStoreId = new Map(
      productCounts.map((item: { _id: Types.ObjectId; count: number }) => [
        item._id.toString(),
        item.count,
      ]),
    );

    const storesWithProductCount = stores.map((store: any) => ({
      _id: store._id.toString(), // Convert MongoDB ObjectId to string
      name: store.name,
      slug: store.slug,
      description: store.description,
      logo_url: store.logo_url,
      banner_url: store.banner_url,
      sellerId: store.sellerId?.toString() || store.sellerId,
      isPublished: store.isPublished,
      productCount: countByStoreId.get(store._id.toString()) || 0,
      businessHours: store.businessHours || null,
      createdAt: store.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: store.updatedAt?.toISOString() || new Date().toISOString(),
    }));

    return storesWithProductCount;
  } catch (error) {
    console.error('[FeaturedStores] Error fetching stores:', error);
    return [];
  }
}

async function FeaturedStoresContent() {
  const stores = await getFeaturedStores();

  return <FeaturedStoresClient stores={stores} />;
}

export default function FeaturedStoresSection() {
  return (
    <Suspense fallback={<FeaturedStoresLoading />}>
      <FeaturedStoresContent />
    </Suspense>
  );
}
