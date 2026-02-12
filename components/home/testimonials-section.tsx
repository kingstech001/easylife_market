"use client"

import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Quote, Star, Users, TrendingUp, Award, LucideIcon, Store, ShoppingBag } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

// ============================================================================
// TYPES
// ============================================================================

interface Testimonial {
  quote: string
  author: string
  title: string
  avatar: string
  rating?: number
  type: "seller" | "buyer"
}

interface Stat {
  value: string
  label: string
  icon: LucideIcon
}

interface MarqueeRowProps {
  items: Testimonial[]
  direction?: "left" | "right"
  speed?: number
}

// ============================================================================
// DATA
// ============================================================================

const testimonials: Testimonial[] = [
  // Sellers
  {
    quote: "This platform has revolutionized how I manage my online store. The features are intuitive and powerful!",
    author: "Ugwuanyi Kelvin",
    title: "CEO, Fashionista Boutique",
    avatar: "/placeholder.svg?height=100&width=100",
    rating: 5,
    type: "seller",
  },
  {
    quote: "Setting up my shop was incredibly easy, and the analytics tools are a game-changer for understanding my customers.",
    author: "Mamah Johnson",
    title: "Founder, Gadget Hub",
    avatar: "/placeholder.svg?height=100&width=100",
    rating: 5,
    type: "seller",
  },
  {
    quote: "The support team is fantastic! They helped me every step of the way, and my sales have never been better.",
    author: "Ossai Kelechi",
    title: "Owner, Artisan Crafts",
    avatar: "/placeholder.svg?height=100&width=100",
    rating: 5,
    type: "seller",
  },
  // Buyers
  {
    quote: "I found unique products here that I couldn't find anywhere else. The shopping experience is seamless!",
    author: "Alice Arji",
    title: "Happy Customer",
    avatar: "/placeholder.svg?height=100&width=100",
    rating: 5,
    type: "buyer",
  },
  {
    quote: "The variety of stores and products is amazing. I always find what I need, and checkout is a breeze.",
    author: "Omeh Emmanuel",
    title: "Frequent Shopper",
    avatar: "/placeholder.svg?height=100&width=100",
    rating: 5,
    type: "buyer",
  },
  {
    quote: "Excellent customer service and high-quality products. This is my go-to marketplace now!",
    author: "Olivia Ugwu",
    title: "Satisfied Buyer",
    avatar: "/placeholder.svg?height=100&width=100",
    rating: 5,
    type: "buyer",
  },
]

// ============================================================================
// TESTIMONIAL CARD COMPONENT
// ============================================================================

const TestimonialCard = React.memo(({ testimonial }: { testimonial: Testimonial }) => {
  const initials = testimonial.author
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)

  const typeColors = {
    seller: "text-[#e1a200]",
    buyer: "text-primary",
  }

  const typeBadges = {
    seller: { icon: Store, label: "Seller" },
    buyer: { icon: ShoppingBag, label: "Buyer" },
  }

  const TypeIcon = typeBadges[testimonial.type].icon

  return (
    <Card className="group relative flex flex-col justify-between h-full bg-card/95 backdrop-blur-sm border border-border/50 shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-[#e1a200]/10 hover:border-[#e1a200]/30 hover:scale-[1.02] overflow-hidden">
      {/* Decorative corner accent */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-[#e1a200]/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Quote icon */}
      <div className="absolute top-3 left-3 p-1.5 rounded-lg bg-[#e1a200]/10 opacity-50 group-hover:opacity-100 transition-all duration-300">
        <Quote className="w-4 h-4 text-[#e1a200]" aria-hidden="true" />
      </div>

      {/* Type badge */}
      <div className="absolute top-3 right-3">
        <Badge 
          variant="secondary" 
          className={cn(
            "text-xs px-2 py-0.5",
            testimonial.type === "seller" 
              ? "bg-[#e1a200]/10 border-[#e1a200]/30" 
              : "bg-primary/10 border-primary/30"
          )}
        >
          <TypeIcon className={cn("w-3 h-3 mr-1", typeColors[testimonial.type])} />
          {typeBadges[testimonial.type].label}
        </Badge>
      </div>

      <CardHeader className="pb-3 pt-12">
        {/* Star rating */}
        <div className="flex items-center gap-1 mb-2" role="img" aria-label={`${testimonial.rating} out of 5 stars`}>
          {Array.from({ length: testimonial.rating || 5 }).map((_, i) => (
            <Star key={i} className="w-3.5 h-3.5 fill-[#e1a200] text-[#e1a200]" aria-hidden="true" />
          ))}
        </div>
        <CardTitle className="text-sm sm:text-base font-semibold leading-relaxed text-foreground/90 group-hover:text-foreground transition-colors">
          "{testimonial.quote}"
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-3 border-t border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="relative flex-shrink-0">
            <Avatar className="h-10 w-10 border-2 border-border/50 group-hover:border-[#e1a200]/50 transition-colors">
              <AvatarImage src={testimonial.avatar} alt={`${testimonial.author}'s avatar`} />
              <AvatarFallback className="bg-gradient-to-br from-[#e1a200]/20 to-primary/20 text-[#e1a200] font-semibold text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            {/* Verified badge */}
            <div className="absolute -bottom-0.5 -right-0.5 p-0.5 rounded-full bg-[#e1a200] shadow-md">
              <Award className="w-2.5 h-2.5 text-white" aria-label="Verified" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">
              {testimonial.author}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {testimonial.title}
            </p>
          </div>
        </div>
      </CardContent>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#e1a200] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </Card>
  )
})

TestimonialCard.displayName = "TestimonialCard"

// ============================================================================
// MARQUEE ROW COMPONENT
// ============================================================================

function MarqueeRow({ items, direction = "left", speed = 60 }: MarqueeRowProps) {
  const [isPaused, setIsPaused] = React.useState(false)

  const duplicatedItems = React.useMemo(() => [...items, ...items], [items])

  return (
    <div
      className="relative w-full overflow-hidden py-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-label="Customer testimonials"
    >
      <div
        className={cn(
          "flex gap-4 sm:gap-6",
          direction === "left" ? "animate-marquee-left" : "animate-marquee-right",
          isPaused && "pause-animation"
        )}
        style={{
          animationDuration: `${speed}s`,
        }}
      >
        {duplicatedItems.map((testimonial, idx) => (
          <div key={`${testimonial.author}-${idx}`} className="flex-none w-[280px] sm:w-[320px] md:w-[360px]">
            <TestimonialCard testimonial={testimonial} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

const StatCard = React.memo(({ stat, accentColor }: { stat: Stat; accentColor: string }) => (
  <div className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-lg bg-muted/50 border border-border/50 hover:border-[#e1a200]/30 transition-all">
    <div className={cn("p-1.5 rounded-md", accentColor)}>
      <stat.icon className="w-4 h-4 text-[#e1a200]" aria-hidden="true" />
    </div>
    <div className="text-center">
      <p className="text-base sm:text-lg font-bold text-foreground">{stat.value}</p>
      <p className="text-xs text-muted-foreground">{stat.label}</p>
    </div>
  </div>
))

StatCard.displayName = "StatCard"

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TestimonialsSection() {
  const stats: Stat[] = [
    { value: "60K+", label: "Happy Users", icon: Users },
    { value: "4.9/5", label: "Average Rating", icon: Star },
    { value: "99%", label: "Satisfaction", icon: TrendingUp },
  ]

  return (
    <section className="relative w-full py-12 sm:py-16 lg:py-24 overflow-hidden">
      {/* Minimal Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
      
      {/* Optimized background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
        <div className="absolute top-1/4 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-[#e1a200]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container relative z-10 px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4 sm:space-y-6 mb-8 sm:mb-12"
        >
          {/* Badge */}
          <div className="flex justify-center">
            <Badge
              variant="secondary"
              className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold bg-gradient-to-r from-[#e1a200]/10 to-primary/10 border-[#e1a200]/30 transition-all duration-300 backdrop-blur-sm shadow-sm"
            >
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 text-[#e1a200]" aria-hidden="true" />
              User Testimonials
            </Badge>
          </div>

          {/* Heading */}
          <div className="space-y-2 sm:space-y-3">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                What Our{" "}
              </span>
              <span className="bg-gradient-to-r from-[#e1a200] via-[#d4b55e] to-primary bg-clip-text text-transparent">
                Users Say
              </span>
            </h2>
            <p className="max-w-2xl mx-auto text-muted-foreground text-base sm:text-lg px-4">
              Hear from both buyers and sellers who trust our marketplace every day
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-2xl mx-auto pt-4">
            {stats.map((stat, index) => (
              <StatCard key={index} stat={stat} accentColor="bg-[#e1a200]/10" />
            ))}
          </div>
        </motion.div>

        {/* Testimonials Marquee */}
        <MarqueeRow items={testimonials} direction="left" speed={50} />
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  )
}