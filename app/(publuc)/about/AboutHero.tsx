"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

const COMMUNITY_IMAGES = [
  {
    url: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80",
    caption: "500+ stores & growing",
  },
  {
    url: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&q=80",
    caption: "Empowering local businesses",
  },
  {
    url: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&q=80",
    caption: "Real people, real products",
  },
  {
    url: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=1200&q=80",
    caption: "Community first marketplace",
  },
  {
    url: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=1200&q=80",
    caption: "Trusted by thousands",
  },
  {
    url: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&q=80",
    caption: "Building the future together",
  },
]

export default function AboutHero() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % COMMUNITY_IMAGES.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const currentImage = COMMUNITY_IMAGES[currentImageIndex]

  return (
    <section className="relative overflow-hidden min-h-[85vh] flex items-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentImageIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="absolute inset-0 z-0"
        >
          <Image
            src={currentImage.url}
            alt="EasyLife community"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/55" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="gap-12 items-center max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#e1a200]/20 border border-[#e1a200]/40 mb-6 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-[#e1a200]" />
              <span className="text-sm font-medium text-[#e1a200]">About EasyLife</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-white leading-tight">
              Empowering{" "}
              <span className="text-[#e1a200]">Communities</span>{" "}
              Through Digital Commerce
            </h1>

            <p className="text-lg text-white/80 leading-relaxed mb-8 max-w-lg">
              Welcome to{" "}
              <span className="font-semibold text-[#e1a200]">EasyLife Market</span> — a
              modern online marketplace built to make buying and selling simpler, faster,
              and more accessible for everyone.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                asChild
                size="lg"
                className="bg-[#e1a200] hover:bg-[#e1a200]/90 text-white shadow-lg"
              >
                <Link href="/auth/register">
                  Start Selling Today
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/40 text-white hover:bg-white/10 backdrop-blur-sm"
              >
                <Link href="/stores">Explore Stores</Link>
              </Button>
            </div>
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`mobile-caption-${currentImageIndex}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:hidden mt-8 flex justify-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
              <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-white">
                {currentImage.caption}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="lg:hidden flex justify-center gap-2 mt-4">
          {COMMUNITY_IMAGES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentImageIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentImageIndex
                  ? "w-6 bg-[#e1a200]"
                  : "w-1.5 bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
