"use client"

import {
  Store,
  Palette,
  Shield,
  Zap,
  BarChart3,
  Smartphone,
  Globe,
  Headphones,
  ArrowRight,
  CheckCircle,
  Sparkles,
  TrendingUp,
  Lock,
  Rocket,
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
      icon: Store,
      title: "Easy Store Creation",
      description: "Build your store with our intuitive drag-and-drop interface. No coding required.",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      gradientFrom: "from-blue-500/20",
      gradientTo: "to-blue-600/20",
      benefits: ["Drag & drop builder", "Pre-built templates", "Mobile responsive"],
    },
    {
      icon: Palette,
      title: "Customizable Themes",
      description: "Choose from premium themes and customize every detail to match your brand perfectly.",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
      gradientFrom: "from-purple-500/20",
      gradientTo: "to-purple-600/20",
      benefits: ["50+ premium themes", "Brand customization", "CSS flexibility"],
    },
    {
      icon: Shield,
      title: "Secure Payments",
      description: "Accept payments securely with integrated solutions and fraud protection.",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
      gradientFrom: "from-emerald-500/20",
      gradientTo: "to-emerald-600/20",
      benefits: ["SSL encryption", "PCI compliance", "Fraud protection"],
    },
  ]

  const additionalFeatures = [
    { 
      icon: BarChart3, 
      title: "Advanced Analytics", 
      description: "Track performance with detailed insights",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10"
    },
    { 
      icon: Smartphone, 
      title: "Mobile Optimized", 
      description: "Perfect experience on all devices",
      color: "text-pink-500",
      bgColor: "bg-pink-500/10"
    },
    { 
      icon: Globe, 
      title: "Global Reach", 
      description: "Sell worldwide with multi-currency support",
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10"
    },
    { 
      icon: Headphones, 
      title: "24/7 Support", 
      description: "Get help whenever you need it",
      color: "text-violet-500",
      bgColor: "bg-violet-500/10"
    },
  ]

  const stats = [
    { icon: CheckCircle, label: "99.9% uptime", value: "Reliability" },
    { icon: TrendingUp, label: "50+ integrations", value: "Flexibility" },
    { icon: Lock, label: "Bank-level security", value: "Protection" },
  ]

  return (
    <Reveal direction="down">
      <section className="relative w-full py-12 sm:py-16 lg:py-24 overflow-hidden">
        {/* Enhanced background with gradient and patterns */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />

        {/* Animated background elements - Responsive */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[20%] -left-[10%] sm:top-1/3 sm:-left-1/4 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-[#c0a146]/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-[20%] -right-[10%] sm:bottom-1/3 sm:-right-1/4 w-56 h-56 sm:w-80 sm:h-80 lg:w-96 lg:h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[700px] lg:w-[1000px] h-[500px] sm:h-[700px] lg:h-[1000px] bg-gradient-to-r from-[#c0a146]/3 via-transparent to-primary/3 rounded-full blur-3xl" />
        </div>

        {/* Geometric pattern overlay - Responsive */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:2rem_2rem] sm:bg-[size:3rem_3rem] lg:bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_70%,transparent_110%)] opacity-10" />

        <div className="container relative z-10 px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl">
          {/* Header Section - Responsive */}
          <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6 text-center mb-12 sm:mb-16 lg:mb-20">
            {/* Badge */}
            <Badge
              variant="secondary"
              className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold bg-gradient-to-r from-[#c0a146]/10 to-primary/10 text-foreground border-[#c0a146]/30 hover:from-[#c0a146]/20 hover:to-primary/20 transition-all duration-300 backdrop-blur-sm shadow-sm hover:shadow-md"
            >
              <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-[#c0a146]" />
              Powerful Features
            </Badge>

            {/* Main heading - Responsive typography */}
            <div className="space-y-3 sm:space-y-4 max-w-4xl">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                <span className="block sm:inline bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent">
                  Everything You Need to{" "}
                </span>
                <span className="block sm:inline mt-1 sm:mt-0 bg-gradient-to-r from-[#c0a146] via-[#d4b55e] to-primary bg-clip-text text-transparent">
                  Succeed Online
                </span>
              </h2>
              <p className="max-w-[90%] sm:max-w-[85%] lg:max-w-[800px] mx-auto text-muted-foreground text-base sm:text-lg lg:text-xl leading-relaxed px-4 sm:px-0">
                Our comprehensive platform provides all the tools, features, and support you need to create, manage, and
                scale your online business successfully.
              </p>
            </div>

            {/* Stats - Responsive grid */}
            <div className="grid grid-cols-3 gap-4 sm:gap-6 lg:gap-8 pt-4 sm:pt-6 w-full max-w-3xl">
              {stats.map((stat, index) => (
                <div 
                  key={index}
                  className="flex flex-col sm:flex-row items-center justify-center gap-2 p-3 sm:p-4 rounded-xl bg-muted/50 border border-border/50 hover:border-[#c0a146]/30 hover:bg-muted/70 transition-all duration-300 hover:scale-105"
                >
                  <div className="p-2 rounded-lg bg-gradient-to-br from-[#c0a146]/20 to-primary/20">
                    <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#c0a146]" />
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-xs sm:text-sm font-semibold text-foreground">{stat.label}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Features Grid - Responsive */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 mb-12 sm:mb-16 lg:mb-20">
            {mainFeatures.map((feature, index) => (
              <Card
                key={index}
                className={cn(
                  "group relative overflow-hidden transition-all duration-500",
                  "bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm",
                  "border border-border/50 hover:border-border",
                  "hover:shadow-2xl hover:shadow-[#c0a146]/10",
                  "hover:scale-[1.02] sm:hover:scale-105",
                )}
              >
                {/* Animated gradient background */}
                <div
                  className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                    feature.gradientFrom,
                    feature.gradientTo
                  )}
                />

                {/* Glow effect */}
                <div
                  className={cn(
                    "absolute -inset-1 rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                    feature.bgColor,
                  )}
                />

                <CardContent className="relative p-6 sm:p-8 space-y-4 sm:space-y-6">
                  {/* Icon container */}
                  <div className="flex items-start justify-between">
                    <div
                      className={cn(
                        "relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-500",
                        feature.bgColor,
                        "group-hover:scale-110 group-hover:rotate-6",
                        "shadow-lg group-hover:shadow-xl"
                      )}
                    >
                      <feature.icon className={cn("h-7 w-7 sm:h-8 sm:w-8", feature.color)} />

                      {/* Icon glow */}
                      <div
                        className={cn(
                          "absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500",
                          feature.bgColor,
                        )}
                      />

                      {/* Orbiting dot */}
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-[#c0a146] to-primary rounded-full opacity-0 group-hover:opacity-100 animate-ping" />
                    </div>

                    {/* Hover arrow */}
                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-2 group-hover:translate-x-0">
                      <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-[#c0a146]" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-2 sm:space-y-3">
                    <h3 className="text-lg sm:text-xl font-bold group-hover:text-[#c0a146] transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  {/* Benefits list */}
                  <div className="space-y-2 pt-2 sm:pt-3 border-t border-border/50">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <div 
                        key={benefitIndex} 
                        className="flex items-center gap-2 text-xs sm:text-sm transform transition-transform duration-300 hover:translate-x-1"
                      >
                        <div className="flex-shrink-0">
                          <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
                        </div>
                        <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                          {benefit}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Bottom accent line */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#c0a146] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Additional Features Section - Responsive */}
          <div className="space-y-6 sm:space-y-8 lg:space-y-10">
            <div className="text-center space-y-2 sm:space-y-3">
              <Badge 
                variant="outline" 
                className="mb-2 border-[#c0a146]/30 text-[#c0a146] hover:bg-[#c0a146]/10"
              >
                <Rocket className="w-3 h-3 mr-1.5" />
                More Features
              </Badge>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Plus Many More Features
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-4">
                Discover additional tools and capabilities designed to enhance your store and boost your success
              </p>
            </div>

            {/* Additional features grid - Responsive */}
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {additionalFeatures.map((feature, index) => (
                <div
                  key={index}
                  className={cn(
                    "group relative p-5 sm:p-6 rounded-xl sm:rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm",
                    "hover:bg-card/60 hover:border-border transition-all duration-300",
                    "hover:scale-105 hover:shadow-lg hover:shadow-[#c0a146]/5",
                  )}
                >
                  {/* Background glow on hover */}
                  <div className={cn(
                    "absolute inset-0 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl",
                    feature.bgColor
                  )} />
                  
                  <div className="relative flex flex-col items-center text-center space-y-3 sm:space-y-4">
                    <div className={cn(
                      "w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center transition-all duration-300",
                      feature.bgColor,
                      "group-hover:scale-110 group-hover:rotate-3"
                    )}>
                      <feature.icon className={cn("h-6 w-6 sm:h-7 sm:w-7", feature.color)} />
                    </div>
                    <div className="space-y-1 sm:space-y-2">
                      <h4 className="font-semibold text-sm sm:text-base group-hover:text-[#c0a146] transition-colors">
                        {feature.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section - Responsive */}
          <div className="flex flex-col items-center justify-center space-y-6 sm:space-y-8 pt-12 sm:pt-16 lg:pt-20">
            {/* Decorative elements */}
            <div className="flex items-center gap-4 w-full max-w-md">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-border" />
              <div className="p-2 rounded-full bg-gradient-to-br from-[#c0a146]/20 to-primary/20">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#c0a146]" />
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-border via-border to-transparent" />
            </div>

            <div className="text-center space-y-3 sm:space-y-4 max-w-2xl px-4">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-foreground via-[#c0a146] to-foreground bg-clip-text text-transparent">
                Ready to Get Started?
              </h3>
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-md mx-auto">
                Join thousands of successful entrepreneurs who chose our platform to build their dream business
              </p>
              
              {/* Trust indicators */}
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-2 sm:pt-4">
                {["Free Trial", "No Credit Card", "Cancel Anytime"].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50"
                  >
                    <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500" />
                    <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons - Responsive */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-center pt-4 sm:pt-6 w-full max-w-md mx-auto sm:max-w-none">
                <Link href="/auth/register" className="w-full sm:w-auto">
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
                      Start Building Now
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:rotate-12 group-hover:scale-110" />
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
                      View Demo
                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-20 sm:h-24 lg:h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />

        <style jsx>{`
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
            .xs\:grid-cols-2 {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
            .xs\:grid-cols-3 {
              grid-template-columns: repeat(3, minmax(0, 1fr));
            }
          }
        `}</style>
      </section>
    </Reveal>
  )
}