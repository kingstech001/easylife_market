"use client"

import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ShoppingBag,
  Target,
  Eye,
  Heart,
  CheckCircle2,
  Users,
  TrendingUp,
  Sparkles,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

const stagger = {
  animate: {
    transition: { staggerChildren: 0.1 },
  },
}

const features = [
  { icon: CheckCircle2, text: "Easy shop creation for sellers" },
  { icon: ShoppingBag, text: "Smooth & intuitive buying experience" },
  { icon: Users, text: "Trusted community marketplace" },
  { icon: TrendingUp, text: "Fast & reliable service delivery" },
]

const stats = [
  { label: "Active Stores", value: "500+" },
  { label: "Products Listed", value: "10K+" },
  { label: "Happy Customers", value: "5K+" },
  { label: "Daily Transactions", value: "100+" },
]

// ✅ Curated community images that cycle through
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

export default function AboutPage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)

  // ✅ Cycle through images every 5 seconds
  useEffect(() => {
    setIsLoaded(true)
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % COMMUNITY_IMAGES.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const currentImage = COMMUNITY_IMAGES[currentImageIndex]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">

      {/* ── Hero Section ───────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-[85vh] flex items-center">

        {/* ✅ Full background image that changes */}
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
            {/* Dark overlay so text stays readable */}
            <div className="absolute inset-0 bg-black/55" />
            {/* Brand color tint */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          </motion.div>
        </AnimatePresence>

        {/* Content sits above the background */}
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className=" gap-12 items-center max-w-6xl mx-auto">

            {/* Left — Text over background */}
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

            {/* ✅ Right — Side image panel (separate cycling card) */}
            
          </div>

          {/* ✅ Image caption shown on mobile (bottom of hero) */}
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

          {/* ✅ Mobile dot indicators */}
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

      {/* ── Stats Section ──────────────────────────────────────────────────── */}
      <section className="py-12 bg-muted/30 border-y border-border/40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <motion.div key={index} variants={fadeInUp} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-[#e1a200] mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Main Content ───────────────────────────────────────────────────── */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Mission */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Card className="border-border/40 bg-card/50 backdrop-blur-sm shadow-lg">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-[#e1a200]/10">
                      <Target className="h-6 w-6 text-[#e1a200]" />
                    </div>
                    <h2 className="text-2xl font-bold">Our Mission</h2>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Our mission is to empower local businesses by providing a digital platform
                    where they can grow. We believe everyone deserves access to the tools and
                    technology needed to sell their products, no matter their background or
                    location.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Vision */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Card className="border-border/40 bg-card/50 backdrop-blur-sm shadow-lg">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-[#e1a200]/10">
                      <Eye className="h-6 w-6 text-[#e1a200]" />
                    </div>
                    <h2 className="text-2xl font-bold">Our Vision</h2>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    To become the most trusted digital marketplace for communities—helping
                    businesses thrive, helping buyers save time, and making everyday
                    transactions effortless.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* What We Offer */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-16"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">What We Offer</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Everything you need to succeed in the digital marketplace
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="border-border/40 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:border-[#e1a200]/30 h-full">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center gap-4">
                        <div className="p-3 rounded-xl bg-[#e1a200]/10">
                          <feature.icon className="h-6 w-6 text-[#e1a200]" />
                        </div>
                        <p className="font-medium text-sm leading-relaxed">
                          {feature.text}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Why We Built This */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-16"
          >
            <Card className="border-border/40 bg-gradient-to-br from-card/50 to-muted/30 backdrop-blur-sm shadow-lg">
              <CardContent className="p-8 md:p-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-[#e1a200]/10">
                    <Heart className="h-6 w-6 text-[#e1a200]" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold">
                    Why We Built This Platform
                  </h2>
                </div>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  EasyLife Market was created to solve real problems: limited visibility for
                  small businesses, lack of online presence, and difficulty connecting buyers
                  with trustworthy sellers. Our platform gives everyone a digital space to
                  connect, trade, and grow together.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ── CTA Section ────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-[#e1a200]/10 via-transparent to-transparent">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Join Our Community?
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              Whether you're here to shop or sell, EasyLife Market welcomes you. Together,
              we are building a smarter, easier, and more connected experience for everyone.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-[#e1a200] hover:bg-[#e1a200]/90 text-white shadow-lg hover:shadow-xl transition-all"
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
                className="border-[#e1a200]/30 hover:bg-[#e1a200]/10"
              >
                <Link href="/stores">Explore Stores</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}