// components/home/BuyerSection.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingBag,
  Shield,
  Zap,
  Package,
  CheckCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export function BuyerSection() {
  const benefits = [
    {
      icon: ShoppingBag,
      title: "Discover Everything",
      description: "Browse thousands of products from trusted local sellers",
    },
    {
      icon: Shield,
      title: "Shop with Confidence",
      description: "Secure checkout and buyer protection on every order",
    },
    {
      icon: Zap,
      title: "Lightning Fast Delivery",
      description: "Get your orders delivered right to your doorstep quickly",
    },
    {
      icon: Package,
      title: "Quality Guaranteed",
      description: "Verified sellers and authentic products, always",
    },
  ];

  return (
    <section className="relative overflow-hidden border-b border-border/60 bg-background py-14 md:py-18">
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="text-center mb-10 md:mb-12">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <Badge className="rounded bg-[#0E5A43] text-white border-0 px-4 py-2 text-sm font-semibold shadow-sm">
              <Sparkles className="w-4 h-4 mr-2" />
              For Customers
            </Badge>
          </div>

          {/* Headline */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-5">
            <span className="block text-foreground">
              Everything you need,
            </span>
            <span className="block mt-2 text-[#0E5A43]">
              delivered with ease
            </span>
          </h2>

          {/* Supporting Paragraph */}
          <p className="text-sm md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Shop from thousands of verified sellers, enjoy secure payments, and get your favorite products 
            delivered straight to your door. EasyLife makes online shopping simple, safe, and enjoyable.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="group relative bg-card border border-border rounded p-6 shadow-sm hover:shadow-md hover:border-[#0E5A43]/30 transition-all duration-300"
            >
              {/* Icon */}
              <div className="mb-4 inline-flex p-3 rounded bg-[#0E5A43] text-white shadow-sm">
                <benefit.icon className="w-6 h-6" />
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-foreground mb-2">
                {benefit.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-wrap items-center justify-center gap-6 mb-10 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <span className="font-medium">Verified Sellers</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <span className="font-medium">Secure Payments</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <span className="font-medium">Fast Delivery</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <span className="font-medium">24/7 Support</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <Link href="/allStoreProducts" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto h-12 px-7 text-base font-semibold bg-[#0E5A43] text-white hover:bg-[#083B2D] shadow-lg transition-all duration-300 group"
            >
              Start Shopping
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>

          <Link href="/stores" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto h-12 px-7 text-base bg-transparent font-semibold border-2 hover:border-[#0E5A43] hover:bg-[#0E5A43]/5 transition-all duration-300"
            >
              Browse Stores
            </Button>
          </Link>
        </div>

      </div>
    </section>
  );
}
