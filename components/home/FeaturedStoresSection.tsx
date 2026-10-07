// components/home/FeaturedStoresSection.tsx

import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { FeaturedStoresClient } from "./FeaturedStoresClient";
import { FeaturedStoresLoading } from "./FeaturedStoresLoading";
import { connectToDB } from "@/lib/db";
import Store from "@/models/Store";

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

// Only the fields the card actually uses. Store documents can be large
// (store-builder content etc.), so never pull the whole document for a carousel.
const CARD_FIELDS =
  "name slug description logo_url banner_url sellerId isPublished businessHours createdAt updatedAt";

// Cached for 5 minutes, so most visitors never touch MongoDB.
// This function THROWS on failure on purpose: unstable_cache doesn't cache
// thrown errors, so a failed query can't get stuck as "No Featured Stores".
const fetchFeaturedStores = unstable_cache(
  async (): Promise<StoreData[]> => {
    await connectToDB();

    const stores = await Store.find({ isPublished: true, isApproved: true })
      .select(CARD_FIELDS)
      .sort({ createdAt: -1 })
      .limit(4)
      .maxTimeMS(5000)
      .lean();

    return stores.map((store: any) => ({
      _id: store._id.toString(),
      name: store.name,
      slug: store.slug,
      description: store.description,
      logo_url: store.logo_url,
      banner_url: store.banner_url,
      sellerId: store.sellerId?.toString() || store.sellerId,
      isPublished: store.isPublished,
      businessHours: store.businessHours || null,
      createdAt: store.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: store.updatedAt?.toISOString() || new Date().toISOString(),
    }));
  },
  ["featured-stores"],
  { revalidate: 300, tags: ["featured-stores"] },
);

async function getFeaturedStores(): Promise<StoreData[]> {
  try {
    return await fetchFeaturedStores();
  } catch (error) {
    console.error("[FeaturedStores] Error fetching stores:", error);
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