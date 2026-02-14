// "use client"

import HeroSection from "@/components/home/HeroSection"
// import { FeaturedStoresClient } from "@/components/home/FeaturedStoresSection";
import { TestimonialsSection } from "@/components/home/testimonials-section"
import { FeaturedStoresClient } from "@/components/home/FeaturedStoresClient"
import FeaturedStoresSection from "@/components/home/FeaturedStoresSection"
import Category from "@/components/home/Category"

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      <HeroSection />
      {/* <FeaturesSection />
       */}
       <Category/>
       <FeaturedStoresSection/>
       <TestimonialsSection />
    </div>
  )
}
