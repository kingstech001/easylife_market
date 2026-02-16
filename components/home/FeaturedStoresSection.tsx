// components/home/FeaturedStoresSection.tsx

import { Suspense } from "react";
import { FeaturedStoresClient } from "./FeaturedStoresClient";
import { FeaturedStoresLoading } from "./FeaturedStoresLoading";
import { connectToDB } from "@/lib/db";
import Store from "@/models/Store";
import Product from "@/models/Product";

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

    // Count products for each store in parallel
    const storesWithProductCount = await Promise.all(
      stores.map(async (store: any) => {
        const productCount = await Product.countDocuments({ 
          storeId: store._id 
        });
        
        return {
          _id: store._id.toString(), // Convert MongoDB ObjectId to string
          name: store.name,
          slug: store.slug,
          description: store.description,
          logo_url: store.logo_url,
          banner_url: store.banner_url,
          sellerId: store.sellerId?.toString() || store.sellerId,
          isPublished: store.isPublished,
          productCount,
          createdAt: store.createdAt?.toISOString() || new Date().toISOString(),
          updatedAt: store.updatedAt?.toISOString() || new Date().toISOString(),
        };
      })
    );

    return storesWithProductCount;
  } catch (error) {
    console.error('[FeaturedStores] Error fetching stores:', error);
    return [];
  }
}

export default async function FeaturedStoresSection() {
  const stores = await getFeaturedStores();

  return (
    <Suspense fallback={<FeaturedStoresLoading />}>
      <FeaturedStoresClient stores={stores} />
    </Suspense>
  );
}