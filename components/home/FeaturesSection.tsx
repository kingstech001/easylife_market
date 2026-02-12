"use client"

import {
  ShoppingBag,
  Shield,
  MessageSquare,
  Search,
  BadgeCheck,
  Zap,
  Lock,
  Smartphone,
  TrendingUp,
  Clock,
  Globe,
  HeadphonesIcon,
  CheckCircle,
  ArrowRight,
  Package,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Reveal } from "../Reveal"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default function FeaturesSection() {
  const mainFeatures = [
    {
      icon: Package,
      title: "Easy Product Listing",
      description: "List your items in minutes with our simple upload process. Add photos, set your price, and start selling.",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      darkBgColor: "dark:bg-blue-950/30",
      benefits: ["Quick upload", "Multiple photos", "Instant publishing"],
    },
    {
      icon: BadgeCheck,
      title: "Verified Sellers",
      description: "Shop with confidence. All sellers are verified and rated by real buyers to ensure quality and trust.",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      darkBgColor: "dark:bg-emerald-950/30",
      benefits: ["ID verification", "Buyer ratings", "Trust badges"],
    },
    {
      icon: Shield,
      title: "Buyer Protection",
      description: "Your purchases are protected. Get your money back if items don't match descriptions or never arrive.",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      darkBgColor: "dark:bg-purple-950/30",
      benefits: ["Money-back guarantee", "Safe transactions", "Dispute resolution"],
    },
    {
      icon: Lock,
      title: "Secure Payments",
      description: "Pay safely with multiple payment options. Your financial information is encrypted and protected.",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      darkBgColor: "dark:bg-orange-950/30",
      benefits: ["Bank-level encryption", "Multiple payment methods", "Fraud protection"],
    },
    {
      icon: Search,
      title: "Smart Search & Filters",
      description: "Find exactly what you need with powerful search and filtering by price, location, condition, and more.",
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
      darkBgColor: "dark:bg-cyan-950/30",
      benefits: ["Advanced filters", "Location-based", "Price sorting"],
    },
    {
      icon: MessageSquare,
      title: "Direct Messaging",
      description: "Chat directly with buyers and sellers. Negotiate prices, ask questions, and arrange meetups securely.",
      color: "text-pink-600",
      bgColor: "bg-pink-50",
      darkBgColor: "dark:bg-pink-950/30",
      benefits: ["In-app chat", "Real-time notifications", "Safe communication"],
    },
  ]

  const additionalFeatures = [
    { 
      icon: Smartphone, 
      title: "Mobile-First", 
      description: "Optimized for mobile buying and selling",
      color: "text-indigo-600",
    },
    { 
      icon: Clock, 
      title: "Fast Listings", 
      description: "Get your items live in under 2 minutes",
      color: "text-amber-600",
    },
    { 
      icon: Globe, 
      title: "Nationwide Reach", 
      description: "Connect with buyers across Nigeria",
      color: "text-teal-600",
    },
    { 
      icon: HeadphonesIcon, 
      title: "24/7 Support", 
      description: "Help available whenever you need it",
      color: "text-violet-600",
    },
  ]

  const stats = [
    { icon: TrendingUp, value: "10K+", label: "Active Listings" },
    { icon: BadgeCheck, value: "5K+", label: "Verified Sellers" },
    { icon: ShoppingBag, value: "₦2M+", label: "Total Sales" },
  ]

  return (
    <Reveal direction="down">
      <section className="relative w-full py-16 sm:py-20 lg:py-24 bg-muted/30">
        <div className="container relative z-10 px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl">
          {/* Header Section */}
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12 sm:mb-16">
            <Badge
              variant="secondary"
              className="px-4 py-2 text-sm font-semibold bg-background border shadow-sm"
            >
              <Zap className="w-4 h-4 mr-2 text-[#e1a200]" />
              Why Choose EasyLife
            </Badge>

            <div className="space-y-3 max-w-3xl">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                Buy and Sell with
                <span className="block mt-1 bg-gradient-to-r from-[#e1a200] to-[#d4b55e] bg-clip-text text-transparent">
                  Complete Confidence
                </span>
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Everything you need for safe, convenient marketplace transactions. From listing to delivery, we've got you covered.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-6 pt-6 w-full max-w-2xl">
              {stats.map((stat, index) => (
                <div 
                  key={index}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg bg-background border border-border"
                >
                  <stat.icon className="w-5 h-5 text-[#e1a200]" />
                  <div className="text-center">
                    <p className="text-xl sm:text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 sm:mb-16">
            {mainFeatures.map((feature, index) => (
              <Card
                key={index}
                className={cn(
                  "group relative overflow-hidden transition-all duration-300",
                  "bg-background border border-border",
                  "hover:shadow-lg hover:border-[#e1a200]/30"
                )}
              >
                <CardContent className="p-6 space-y-4">
                  {/* Icon */}
                  <div className="flex items-start justify-between">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center",
                        feature.bgColor,
                        feature.darkBgColor,
                        "border border-border/50"
                      )}
                    >
                      <feature.icon className={cn("h-6 w-6", feature.color)} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  {/* Benefits list */}
                  <div className="space-y-2 pt-2 border-t border-border">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <div 
                        key={benefitIndex} 
                        className="flex items-center gap-2 text-sm"
                      >
                        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span className="text-muted-foreground">
                          {benefit}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Additional Features Section */}
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
                Plus Many More Features
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
                Additional tools and features to make buying and selling easier
              </p>
            </div>

            {/* Additional features grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {additionalFeatures.map((feature, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-6 rounded-lg border border-border bg-background",
                    "hover:border-[#e1a200]/30 transition-all duration-300"
                  )}
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                      <feature.icon className={cn("h-6 w-6", feature.color)} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm text-foreground">
                        {feature.title}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="flex flex-col items-center justify-center space-y-6 pt-16">
            <div className="w-full max-w-md h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            <div className="text-center space-y-4 max-w-xl">
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
                Ready to Start Trading?
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Join thousands of buyers and sellers on Nigeria's trusted marketplace
              </p>
              
              {/* Trust indicators */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {["Free to List", "No Hidden Fees", "Secure Platform"].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted border border-border"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-xs font-medium text-muted-foreground">
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-center pt-4">
                <Link href="/auth/login" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className={cn(
                      "w-full sm:w-auto h-12 px-8 text-base font-semibold",
                      "bg-gradient-to-r from-[#e1a200] to-[#d4b55e]",
                      "hover:from-[#d4b55e] hover:to-[#e1a200]",
                      "shadow-md hover:shadow-lg transition-all"
                    )}
                  >
                    Start Selling
                    <Package className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/stores" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto h-12 px-8 text-base font-semibold border-2 hover:bg-muted/50 hover:border-[#e1a200]/50 transition-all"
                  >
                    Browse Products
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Reveal>
  )
}