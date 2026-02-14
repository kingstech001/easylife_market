// components/home/FeaturedStoresSection.tsx

import { Suspense } from "react";
import { FeaturedStoresClient } from "./FeaturedStoresClient";
import { FeaturedStoresLoading } from "./FeaturedStoresLoading";

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
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/featured-stores`, {
      next: { revalidate: 3600 }, // Revalidate every hour
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      console.error('Failed to fetch featured stores:', res.statusText);
      return [];
    }

    const data = await res.json();
    return data.stores || [];
  } catch (error) {
    console.error('Error fetching featured stores:', error);
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