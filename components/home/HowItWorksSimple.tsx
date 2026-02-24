// components/home/HowItWorksSection.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import {
  Search,
  ShoppingCart,
  Package,
  UserPlus,
  Upload,
  DollarSign,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export function HowItWorksSection() {
  const buyerSteps = [
    {
      number: "01",
      icon: Search,
      title: "Browse Products",
      description: "Explore thousands of products from verified sellers across multiple categories.",
    },
    {
      number: "02",
      icon: ShoppingCart,
      title: "Place Your Order",
      description: "Add items to cart, checkout securely, and track your order in real-time.",
    },
    {
      number: "03",
      icon: Package,
      title: "Receive & Enjoy",
      description: "Get your items delivered fast and enjoy hassle-free shopping.",
    },
  ];

  const vendorSteps = [
    {
      number: "01",
      icon: UserPlus,
      title: "Create Your Store",
      description: "Sign up free, customize your store, and get ready to sell in minutes.",
    },
    {
      number: "02",
      icon: Upload,
      title: "List Your Products",
      description: "Upload products with photos, descriptions, and pricing—simple and quick.",
    },
    {
      number: "03",
      icon: DollarSign,
      title: "Sell & Grow",
      description: "Receive orders, fulfill them, and watch your business thrive.",
    },
  ];

  return (
    <section className="relative py-16 md:py-24 bg-gradient-to-b from-background via-muted/30 to-background overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgb(0 0 0 / 0.05) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* Minimal Accent - MATCHING OTHER SECTIONS */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#e1a200]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#d4b55e]/5 rounded-full blur-3xl" />

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-16">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <Badge className="bg-gradient-to-r from-[#e1a200] to-[#d4b55e] text-white border-0 px-4 py-2 text-sm font-semibold shadow-sm">
              <Sparkles className="w-4 h-4 mr-2" />
              Simple Process
            </Badge>
          </div>

          {/* Headline */}
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            <span className="block text-foreground">
              How It Works
            </span>
            <span className="block mt-2 bg-gradient-to-r from-[#e1a200] via-[#d4b55e] to-[#e1a200] bg-clip-text text-transparent">
              Simple, fast, hassle-free
            </span>
          </h2>

          {/* Intro Paragraph */}
          <p className="text-sm md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Whether you're shopping or selling, EasyLife makes it simple. Follow three easy steps 
            to start buying from trusted sellers or launch your own store today.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* For Buyers */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-sm">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-foreground">
                For Buyers
              </h3>
            </div>

            <div className="space-y-6">
              {buyerSteps.map((step, index) => (
                <div
                  key={index}
                  className="group relative flex gap-4 p-6 bg-card border border-border rounded-2xl shadow-sm hover:shadow-md hover:border-blue-500/30 transition-all duration-300"
                >
                  {/* Step Number */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 flex items-center justify-center">
                      <span className="text-xl font-bold bg-gradient-to-br from-blue-500 to-blue-600 bg-clip-text text-transparent">
                        {step.number}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <step.icon className="w-5 h-5 text-blue-500" />
                      <h4 className="text-lg font-bold text-foreground">
                        {step.title}
                      </h4>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Arrow (except last) */}
                  {index < buyerSteps.length - 1 && (
                    <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 hidden lg:block">
                      <ArrowRight className="w-5 h-5 text-border rotate-90" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* For Vendors */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#e1a200] to-[#d4b55e] flex items-center justify-center text-white shadow-sm">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-foreground">
                For Vendors
              </h3>
            </div>

            <div className="space-y-6">
              {vendorSteps.map((step, index) => (
                <div
                  key={index}
                  className="group relative flex gap-4 p-6 bg-card border border-border rounded-2xl shadow-sm hover:shadow-md hover:border-[#e1a200]/30 transition-all duration-300"
                >
                  {/* Step Number */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#e1a200]/10 to-[#d4b55e]/10 flex items-center justify-center">
                      <span className="text-xl font-bold bg-gradient-to-br from-[#e1a200] to-[#d4b55e] bg-clip-text text-transparent">
                        {step.number}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <step.icon className="w-5 h-5 text-[#e1a200]" />
                      <h4 className="text-lg font-bold text-foreground">
                        {step.title}
                      </h4>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Arrow (except last) */}
                  {index < vendorSteps.length - 1 && (
                    <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 hidden lg:block">
                      <ArrowRight className="w-5 h-5 text-border rotate-90" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}