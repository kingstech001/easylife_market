"use client"

import HeroSection from "@/components/home/HeroSection"
import FeaturesSection from "@/components/home/FeaturesSection"
import FeaturedStoresSection from "@/components/home/FeaturedStoresSection"
import { TestimonialsSection } from "@/components/home/testimonials-section"

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      <HeroSection />
      <FeaturesSection />
      <FeaturedStoresSection />
      <TestimonialsSection />
    </div>
  )
}
