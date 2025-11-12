"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag, Store, ArrowRight, Sparkles, TrendingUp, Users, Zap } from "lucide-react"
import { Reveal } from "../Reveal"
import { cn } from "@/lib/utils"

export default function HeroSection() {
  return (
    <Reveal>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 rounded-full blur-3xl" />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-20" />

        <div className="container relative z-10 px-4 md:px-6 py-12 ">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16  max-w-7xl mx-auto">
            {/* Left Content */}
            <div className="flex flex-col justify-center space-y-8">
              {/* Badge */}
              <div className="flex justify-center lg:justify-start">
                <Badge
                  variant="secondary"
                  className="px-4 py-2 text-sm font-medium bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  New Platform Launch
                </Badge>
              </div>

              {/* Main Content */}
              <div className="space-y-6">
                <h1 className="text-center lg:text-left font-bold tracking-tight text-5xl xl:text-7xl/none bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                  Buy and Sell{" "}
                  <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    Seamlessly with <span className="text-[#c0a146]">EasyLife</span>
                  </span>
                </h1>
                <p className="text-center lg:text-left max-w-[600px] text-muted-foreground text-lg md:text-xl leading-relaxed m-auto lg:m-0">
                  Build, customize, and launch your online store in minutes. Join thousands of successful entrepreneurs
                  who trust our platform.
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 py-6 m-auto lg:m-0 ">
                <div className="text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                    <Users className="w-5 h-5 text-primary" />
                    <span className="text-2xl font-bold">10K+</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Active Stores</p>
                </div>
                <div className="text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <span className="text-2xl font-bold">₦2M+</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Sales Generated</p>
                </div>
                <div className="text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                    <Zap className="w-5 h-5 text-primary" />
                    <span className="text-2xl font-bold">99.9%</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Uptime</p>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
                <Link href="/auth/login">
                  <Button
                    size="lg"
                    className={cn(
                      "group h-12 px-8 text-base font-medium transition-all duration-300",
                      "bg-gradient-to-r from-[#c0a146] to-[#c0a146]/90 ",
                      "shadow-lg hover:shadow-xl hover:shadow-[#c0a146]/25",
                      "hover:scale-105 active:scale-95",
                    )}
                  >
                    Create Your Store
                    <Store className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="/stores">
                  <Button
                    variant="outline"
                    size="lg"
                    className={cn(
                      "group h-12 px-8 text-base font-medium transition-all duration-300",
                      "bg-background/50 backdrop-blur-sm border-border/50",
                      "hover:bg-background hover:border-border hover:shadow-lg",
                      "hover:scale-105 active:scale-95",
                    )}
                  >
                    Browse Stores
                    <ShoppingBag className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-4 pt-6">
                <p className="text-sm text-muted-foreground">Trusted by leading brands:</p>
                <div className="flex items-center gap-6 opacity-60">
                  <div className="w-20 h-8 bg-muted rounded flex items-center justify-center">
                    <span className="text-xs font-medium">Brand 1</span>
                  </div>
                  <div className="w-20 h-8 bg-muted rounded flex items-center justify-center">
                    <span className="text-xs font-medium">Brand 2</span>
                  </div>
                  <div className="w-20 h-8 bg-muted rounded flex items-center justify-center">
                    <span className="text-xs font-medium">Brand 3</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content - Hero Image */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[600px]">
                {/* Decorative elements */}
                <div className="absolute -top-4 -left-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
                <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-secondary/20 rounded-full blur-2xl" />

                {/* Main image container */}
                <div className="relative aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-muted/50 to-muted border border-border/50 backdrop-blur-sm">
                  <Image
                    src="/hero-image.png"
                    alt="Modern E-commerce Dashboard Interface"
                    fill
                    className="object-cover transition-transform duration-700 hover:scale-105"
                    priority
                  />

                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-transparent" />

                  {/* Floating cards */}
                  <div className="absolute top-6 right-6 bg-card/90 backdrop-blur-sm border border-border/50 rounded-lg p-3 shadow-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs font-medium">Live Sales</span>
                    </div>
                    <p className="text-lg font-bold mt-1">₦12,847</p>
                  </div>

                  <div className="absolute bottom-6 left-6 bg-card/90 backdrop-blur-sm border border-border/50 rounded-lg p-3 shadow-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <span className="text-xs font-medium">Growth</span>
                    </div>
                    <p className="text-lg font-bold mt-1 text-green-600">+24%</p>
                  </div>
                </div>

                {/* Arrow indicator */}
                <div className="absolute -bottom-17 lg:-bottom-9 left-1/2 lg:left-1/3 transform -translate-x-1/2 animate-bounce">
                  <ArrowRight className="w-12 h-12 lg:w-24 lg:h-24 text-primary rotate-90" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>
    </Reveal>
  )
}
