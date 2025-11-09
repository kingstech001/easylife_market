"use client"

import {
  Store,
  Palette,
  Shield,
  Zap,
  BarChart3,
  Smartphone,
  Globe,
  HeadphonesIcon,
  ArrowRight,
  CheckCircle,
  Sparkles,
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
      benefits: ["Drag & drop builder", "Pre-built templates", "Mobile responsive"],
    },
    {
      icon: Palette,
      title: "Customizable Themes",
      description: "Choose from premium themes and customize every detail to match your brand perfectly.",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
      benefits: ["50+ premium themes", "Brand customization", "CSS flexibility"],
    },
    {
      icon: Shield,
      title: "Secure Payments",
      description: "Accept payments securely with integrated solutions and fraud protection.",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
      benefits: ["SSL encryption", "PCI compliance", "Fraud protection"],
    },
  ]

  const additionalFeatures = [
    { icon: BarChart3, title: "Advanced Analytics", description: "Track performance with detailed insights" },
    { icon: Smartphone, title: "Mobile Optimized", description: "Perfect experience on all devices" },
    { icon: Globe, title: "Global Reach", description: "Sell worldwide with multi-currency support" },
    { icon: HeadphonesIcon, title: "24/7 Support", description: "Get help whenever you need it" },
  ]

  return (
    <Reveal direction="down">
      <section className="relative w-full py-16 md:py-24 lg:py-32 overflow-hidden">
        {/* Background with gradient and patterns */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />

        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/3 -left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/3 -right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-primary/3 via-transparent to-secondary/3 rounded-full blur-3xl" />
        </div>

        {/* Geometric pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-10" />

        <div className="container relative z-10 px-4 md:px-6 block m-auto">
          {/* Header Section */}
          <div className="flex flex-col items-center justify-center space-y-6 text-center mb-16">
            {/* Badge */}
            <Badge
              variant="secondary"
              className="px-4 py-2 text-sm font-medium bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors"
            >
              <Zap className="w-4 h-4 mr-2" />
              Powerful Features
            </Badge>

            {/* Main heading */}
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                Everything You Need to{" "}
                <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Succeed
                </span>
              </h2>
              <p className="max-w-[800px] m-auto text-muted-foreground text-lg md:text-xl leading-relaxed">
                Our comprehensive platform provides all the tools, features, and support you need to create, manage, and
                scale your online business successfully.
              </p>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center justify-center gap-8 pt-6">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-muted-foreground">99.9% uptime</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-muted-foreground">50+ integrations</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-muted-foreground">24/7 support</span>
              </div>
            </div>
          </div>

          {/* Main Features Grid */}
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-10 mb-16">
            {mainFeatures.map((feature, index) => (
              <Card
                key={index}
                className={cn(
                  "group relative overflow-hidden transition-all duration-500 hover:scale-105",
                  "bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 hover:border-border",
                  "hover:shadow-2xl hover:shadow-primary/10",
                )}
              >
                {/* Glow effect */}
                <div
                  className={cn(
                    "absolute -inset-1 rounded-lg blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                    feature.bgColor,
                  )}
                />

                <CardContent className="relative p-8 space-y-6">
                  {/* Icon */}
                  <div
                    className={cn(
                      "relative w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300",
                      feature.bgColor,
                      "group-hover:scale-110 group-hover:rotate-3",
                    )}
                  >
                    <feature.icon className={cn("h-8 w-8", feature.color)} />

                    {/* Icon glow */}
                    <div
                      className={cn(
                        "absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300",
                        feature.bgColor,
                      )}
                    />
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>

                  {/* Benefits list */}
                  <div className="space-y-2 pt-2">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <div key={benefitIndex} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                        <span className="text-muted-foreground">{benefit}</span>
                      </div>
                    ))}
                  </div>

                  {/* Hover arrow */}
                  <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                    <ArrowRight className="w-5 h-5 text-primary" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Additional Features Grid */}
          <div className="space-y-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">Plus Many More Features</h3>
              <p className="text-muted-foreground">Discover additional tools to enhance your store</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {additionalFeatures.map((feature, index) => (
                <div
                  key={index}
                  className={cn(
                    "group p-6 rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm",
                    "hover:bg-card/60 hover:border-border transition-all duration-300",
                    "hover:scale-105 hover:shadow-lg",
                  )}
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h4 className="font-semibold text-sm">{feature.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="flex flex-col items-center justify-center space-y-6 mt-16 pt-8">
            {/* Decorative line */}
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold">Ready to Get Started?</h3>
              <p className="text-muted-foreground max-w-md">
                Join thousands of successful entrepreneurs who chose our platform
              </p>
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-4">
                <Link href="/auth/register">
                  <Button
                    size="lg"
                    className={cn(
                      "group h-12 px-8 text-base font-medium transition-all duration-300",
                      "bg-gradient-to-r from-[#c0a146] to-[#c0a146]/90 ",
                      "shadow-lg hover:shadow-xl hover:shadow-[#c0a146]/25",
                      "hover:scale-105 active:scale-95",
                    )}
                  >
                    Start Building Now
                    <Sparkles className="ml-2 h-4 w-4 transition-transform group-hover:rotate-12" />
                  </Button>
                </Link>
                
              </div>
            </div>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </section>
    </Reveal>
  )
}
