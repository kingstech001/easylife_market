"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag, Store, ArrowRight, Sparkles, TrendingUp, Users, Zap, Star, CheckCircle } from "lucide-react"
import { Reveal } from "../Reveal"
import { cn } from "@/lib/utils"

export default function HeroSection() {
  return (
    <Reveal>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] sm:min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
        {/* Enhanced animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[10%] sm:top-[20%] left-[15%] sm:left-[20%] w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-[10%] sm:bottom-[20%] right-[15%] sm:right-[20%] w-56 h-56 sm:w-96 sm:h-96 lg:w-[500px] lg:h-[500px] bg-[#c0a146]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[800px] lg:w-[1000px] h-[600px] sm:h-[800px] lg:h-[1000px] bg-gradient-to-r from-primary/5 via-transparent to-[#c0a146]/5 rounded-full blur-3xl" />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:2rem_2rem] sm:bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_70%,transparent_110%)] opacity-20" />

        <div className="container relative z-10 px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          <div className="md:grid gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-20 max-w-7xl mx-auto items-center">
            {/* Left Content */}
            <div className="flex flex-col justify-center space-y-6 sm:space-y-8 order-2 lg:order-1">
              {/* Badge */}
              <div className="flex justify-center lg:justify-start animate-fade-in">
                <Badge
                  variant="secondary"
                  className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium bg-gradient-to-r from-[#c0a146]/10 to-primary/10 text-foreground border-[#c0a146]/30 hover:from-[#c0a146]/20 hover:to-primary/20 transition-all duration-300 backdrop-blur-sm shadow-sm hover:shadow-md"
                >
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-[#c0a146]" />
                  New Platform Launch 🎉
                </Badge>
              </div>

              {/* Main Content */}
              <div className="space-y-4 sm:space-y-6 animate-slide-up">
                <h1 className="text-center lg:text-left font-bold tracking-tight text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-tight">
                  <span className="block sm:inline bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent">
                    Buy and Sell{" "}
                  </span>
                  <span className="block sm:inline mt-1 sm:mt-0 bg-gradient-to-r from-primary via-[#c0a146] to-primary/70 bg-clip-text text-transparent">
                    Seamlessly
                  </span>
                  <span className="block mt-2 text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">
                    with{" "}
                    <span className="relative inline-block">
                      <span className="bg-gradient-to-r from-[#c0a146] to-[#d4b55e] bg-clip-text text-transparent font-extrabold">
                        EasyLife
                      </span>
                      <span className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-[#c0a146] to-[#d4b55e] rounded-full opacity-50"></span>
                    </span>
                  </span>
                </h1>
                <p className="text-center lg:text-left max-w-[650px] text-muted-foreground text-base sm:text-lg lg:text-xl leading-relaxed mx-auto lg:mx-0">
                  Build, customize, and launch your online store in minutes. Join thousands of successful entrepreneurs
                  who trust our platform to grow their business.
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:gap-6 py-4 sm:py-6 mx-auto lg:mx-0 w-full max-w-xl lg:max-w-none">
                {[
                  { icon: Users, value: "10K+", label: "Active Stores" },
                  { icon: TrendingUp, value: "₦2M+", label: "Sales" },
                  { icon: Zap, value: "99.9%", label: "Uptime" },
                ].map((stat, index) => (
                  <div 
                    key={index}
                    className="group p-3 sm:p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50 hover:border-[#c0a146]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#c0a146]/10 hover:-translate-y-1"
                  >
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3">
                      <div className="p-2 sm:p-2.5 rounded-lg bg-gradient-to-br from-[#c0a146]/20 to-primary/20 group-hover:from-[#c0a146]/30 group-hover:to-primary/30 transition-all">
                        <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#c0a146]" />
                      </div>
                      <div className="text-center sm:text-left flex-1">
                        <span className="block text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
                          {stat.value}
                        </span>
                        <p className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                          {stat.label}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start items-center w-full max-w-md mx-auto lg:mx-0">
                <Link href="/auth/login" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className={cn(
                      "group w-full sm:w-auto h-11 sm:h-12 lg:h-14 px-6 sm:px-8 lg:px-10 text-sm sm:text-base lg:text-lg font-semibold transition-all duration-300",
                      "bg-gradient-to-r from-[#c0a146] via-[#d4b55e] to-[#c0a146] bg-size-200 bg-pos-0 hover:bg-pos-100",
                      "shadow-lg hover:shadow-xl hover:shadow-[#c0a146]/30",
                      "hover:scale-105 active:scale-95",
                      "relative overflow-hidden"
                    )}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      Create Your Store
                      <Store className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1 group-hover:scale-110" />
                    </span>
                  </Button>
                </Link>
                <Link href="/stores" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className={cn(
                      "group w-full sm:w-auto h-11 sm:h-12 lg:h-14 px-6 sm:px-8 lg:px-10 text-sm sm:text-base lg:text-lg font-semibold transition-all duration-300",
                      "bg-background/80 backdrop-blur-sm border-2 border-border/50 hover:border-[#c0a146]/50",
                      "hover:bg-muted/50 hover:shadow-lg hover:shadow-[#c0a146]/10",
                      "hover:scale-105 active:scale-95"
                    )}
                  >
                    <span className="flex items-center justify-center gap-2">
                      Browse Stores
                      <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1 group-hover:scale-110" />
                    </span>
                  </Button>
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-col items-center lg:items-start gap-3 sm:gap-4 pt-4 sm:pt-6">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-background bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center"
                      >
                        <Users className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="w-3 h-3 sm:w-4 sm:h-4 fill-[#c0a146] text-[#c0a146]" />
                      ))}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Trusted by <span className="font-semibold text-foreground">10,000+</span> sellers
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4">
                  {["Secure Payments", "24/7 Support", "Fast Setup"].map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50"
                    >
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-[#c0a146]" />
                      <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Content - Hero Image */}
            <div className="relative flex justify-center lg:justify-end order-1 lg:order-2 mt-4 md:mt-0">
              <div className="relative w-full max-w-[280px] xs:max-w-[350px] sm:max-w-[450px] md:max-w-[550px] lg:max-w-[600px]">
                {/* Decorative elements */}
                <div className="absolute -top-4 -left-4 w-16 h-16 sm:w-24 sm:h-24 bg-[#c0a146]/20 rounded-full blur-2xl animate-pulse" />
                <div className="absolute -bottom-4 -right-4 w-20 h-20 sm:w-32 sm:h-32 bg-primary/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />

                {/* Main image container */}
                <div className="relative aspect-square rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-br from-muted/50 to-muted border-2 border-border/50 backdrop-blur-sm shadow-2xl hover:shadow-[#c0a146]/20 transition-all duration-500 hover:scale-[1.02]">
                  <Image
                    src="/hero-image.png"
                    alt="Modern E-commerce Dashboard Interface"
                    fill
                    className="object-cover transition-transform duration-700 hover:scale-105"
                    priority
                    sizes="(max-width: 640px) 280px, (max-width: 768px) 350px, (max-width: 1024px) 450px, 600px"
                  />

                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/30 via-transparent to-transparent" />

                  {/* Floating cards - Responsive positioning */}
                  <div className="absolute top-3 right-3 sm:top-6 sm:right-6 bg-card/95 backdrop-blur-md border border-border/50 rounded-lg sm:rounded-xl p-2 sm:p-3 shadow-xl hover:scale-105 transition-transform duration-300">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground">Live Sales</span>
                    </div>
                    <p className="text-base sm:text-lg lg:text-xl font-bold mt-0.5 sm:mt-1 bg-gradient-to-r from-[#c0a146] to-primary bg-clip-text text-transparent">
                      ₦12,847
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="w-2 h-2 sm:w-3 sm:h-3 text-emerald-500" />
                      <span className="text-[9px] sm:text-[10px] text-emerald-600 font-medium">+15% today</span>
                    </div>
                  </div>

                  <div className="absolute bottom-3 left-3 sm:bottom-6 sm:left-6 bg-card/95 backdrop-blur-md border border-border/50 rounded-lg sm:rounded-xl p-2 sm:p-3 shadow-xl hover:scale-105 transition-transform duration-300">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="p-1 sm:p-1.5 rounded-md bg-gradient-to-br from-[#c0a146]/20 to-primary/20">
                        <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-[#c0a146]" />
                      </div>
                      <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground">Growth</span>
                    </div>
                    <p className="text-base sm:text-lg lg:text-xl font-bold mt-0.5 sm:mt-1 text-emerald-600">
                      +24%
                    </p>
                    <span className="text-[9px] sm:text-[10px] text-muted-foreground">vs last month</span>
                  </div>

                  {/* Additional floating card - Hidden on mobile */}
                  <div className="hidden sm:block absolute top-1/2 -right-4 lg:-right-6 -translate-y-1/2 bg-card/95 backdrop-blur-md border border-border/50 rounded-xl p-3 shadow-xl hover:scale-105 transition-transform duration-300">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-gradient-to-br from-emerald-500/20 to-emerald-600/20">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground">Orders</p>
                        <p className="text-lg font-bold">145</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Arrow indicator - Responsive */}
                <div className="absolute -bottom-12 sm:-bottom-16 lg:-bottom-20 left-1/2 lg:left-1/3 transform -translate-x-1/2 animate-bounce hidden sm:block">
                  <div className="p-3 sm:p-4 rounded-full bg-gradient-to-br from-[#c0a146]/20 to-primary/20 backdrop-blur-sm border border-[#c0a146]/30">
                    <ArrowRight className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-[#c0a146] rotate-90" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-20 sm:h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </section>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.8s ease-out 0.2s both;
        }

        .bg-size-200 {
          background-size: 200%;
        }

        .bg-pos-0 {
          background-position: 0%;
        }

        .hover\:bg-pos-100:hover {
          background-position: 100%;
        }

        @media (max-width: 475px) {
          .xs\:max-w-\[350px\] {
            max-width: 350px;
          }
        }
      `}</style>
    </Reveal>
  )
}