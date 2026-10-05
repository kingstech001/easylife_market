// "use client"

import { CategoryGrid } from "@/components/CategoryGrid";
import FeaturedStoresSection from "@/components/home/FeaturedStoresSection";
import NewProductsSection from "@/components/NewProductsSection";

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-background">
      <FeaturedStoresSection />
      <div className=" flex items-center justify-center">
        <CategoryGrid />
      </div>
      <NewProductsSection />
    </div>
  );
}
