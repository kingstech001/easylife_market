// "use client"

import HeroSection from "@/components/home/HeroSection";
import { TestimonialsSection } from "@/components/home/testimonials-section";
import FeaturedStoresSection from "@/components/home/FeaturedStoresSection";
import { BuyerSection } from "@/components/home/BuyerSectionSimple";
import { VendorSection } from "@/components/home/VendorSection";
import { HowItWorksSection} from "@/components/home/HowItWorksSimple";

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      <HeroSection />
      <FeaturedStoresSection />
      <BuyerSection />
      <VendorSection />
      <HowItWorksSection />
      <TestimonialsSection />
    </div>
  );
}
