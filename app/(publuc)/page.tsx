// "use client"

import HeroSection from "@/components/home/HeroSection";
import FeaturedStoresSection from "@/components/home/FeaturedStoresSection";
import NewProductsSection from "@/components/NewProductsSection";

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-background">
      <HeroSection />
      <FeaturedStoresSection />
      <NewProductsSection />
    </div>
  );
}
