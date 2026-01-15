"use client"

import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Quote, Star, Users, ShoppingBag, TrendingUp, Award } from "lucide-react"
import { motion } from "framer-motion"

interface Testimonial {
  quote: string
  author: string
  title: string
  avatar: string
  rating?: number
}

const sellerTestimonials: Testimonial[] = [
  {
    quote: "This platform has revolutionized how I manage my online store. The features are intuitive and powerful!",
    author: "Jane Doe",
    title: "CEO, Fashionista Boutique",
    avatar: "/placeholder.svg?height=100&width=100",
    rating: 5,
  },
  {
    quote: "Setting up my shop was incredibly easy, and the analytics tools are a game-changer for understanding my customers.",
    author: "John Smith",
    title: "Founder, Gadget Hub",
    avatar: "/placeholder.svg?height=100&width=100",
    rating: 5,
  },
  {
    quote: "The support team is fantastic! They helped me every step of the way, and my sales have never been better.",
    author: "Sarah Lee",
    title: "Owner, Artisan Crafts",
    avatar: "/placeholder.svg?height=100&width=100",
    rating: 5,
  },
  {
    quote: "A truly comprehensive solution for e-commerce. From product listing to order fulfillment, everything is seamless.",
    author: "Michael Chen",
    title: "Manager, Tech Innovations",
    avatar: "/placeholder.svg?height=100&width=100",
    rating: 5,
  },
  {
    quote: "I love the clean interface and the robust features. It's exactly what I needed to scale my business.",
    author: "Emily White",
    title: "Creator, Unique Prints",
    avatar: "/placeholder.svg?height=100&width=100",
    rating: 5,
  },
  {
    quote: "Highly recommend this platform to anyone looking to start or grow their online presence. It's simply the best!",
    author: "David Brown",
    title: "Director, Gourmet Foods",
    avatar: "/placeholder.svg?height=100&width=100",
    rating: 5,
  },
]

const buyerTestimonials: Testimonial[] = [
  {
    quote: "I found unique products here that I couldn't find anywhere else. The shopping experience is seamless!",
    author: "Alice Johnson",
    title: "Happy Customer",
    avatar: "/placeholder.svg?height=100&width=100",
    rating: 5,
  },
  {
    quote: "The variety of stores and products is amazing. I always find what I need, and checkout is a breeze.",
    author: "Robert Davis",
    title: "Frequent Shopper",
    avatar: "/placeholder.svg?height=100&width=100",
    rating: 5,
  },
  {
    quote: "Excellent customer service and high-quality products. This is my go-to marketplace now!",
    author: "Olivia Wilson",
    title: "Satisfied Buyer",
    avatar: "/placeholder.svg?height=100&width=100",
    rating: 5,
  },
  {
    quote: "The best place to discover new brands and unique items. My favorite online shopping destination!",
    author: "Daniel Miller",
    title: "Enthusiastic Buyer",
    avatar: "/placeholder.svg?height=100&width=100",
    rating: 5,
  },
  {
    quote: "Fast shipping and great product quality. I'm always impressed with my purchases from this platform.",
    author: "Sophia Martinez",
    title: "Loyal Customer",
    avatar: "/placeholder.svg?height=100&width=100",
    rating: 5,
  },
  {
    quote: "A fantastic user experience from start to finish. Highly recommend for anyone looking for quality goods.",
    author: "James Taylor",
    title: "Regular User",
    avatar: "/placeholder.svg?height=100&width=100",
    rating: 5,
  },
]

function MarqueeRow({
  items,
  direction = "left",
  speed = 30,
}: {
  items: Testimonial[]
  direction?: "left" | "right"
  speed?: number
}) {
  const itemWidthSm = 320
  const itemWidthMd = 380
  const gapWidth = 24
  const itemCount = items.length

  const singleSetWidthSm = `${itemCount * itemWidthSm + (itemCount - 1) * gapWidth}px`
  const singleSetWidthMd = `${itemCount * itemWidthMd + (itemCount - 1) * gapWidth}px`

  return (
    <div
      className="relative w-full overflow-hidden py-4 sm:py-6 group"
      style={{
        '--item-width-sm': `${itemWidthSm}px`,
        '--item-width-md': `${itemWidthMd}px`,
        '--gap-width': `${gapWidth}px`,
        '--item-count': itemCount,
        '--translate-distance-sm': singleSetWidthSm,
        '--translate-distance-md': singleSetWidthMd,
      } as React.CSSProperties}
    >
      <div
        className="flex whitespace-nowrap gap-6"
        style={{
          animation: `marquee-${direction} ${speed}s linear infinite`,
        }}
      >
        {[...items, ...items].map((testimonial, idx) => (
          <div key={idx} className="flex-none w-[320px] md:w-[380px]">
            <Card className="group/card relative flex flex-col justify-between h-full bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-sm border border-border/50 shadow-lg transition-all duration-300 hover:shadow-2xl hover:shadow-[#e1a200]/10 hover:border-[#e1a200]/30 hover:scale-[1.02] overflow-hidden">
              {/* Decorative corner accent */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#e1a200]/10 to-transparent rounded-bl-full opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />
              
              {/* Quote icon */}
              <div className="absolute top-4 left-4 p-2 rounded-lg bg-[#e1a200]/10 opacity-50 group-hover/card:opacity-100 transition-all duration-300 group-hover/card:scale-110">
                <Quote className="w-4 h-4 sm:w-5 sm:h-5 text-[#e1a200]" />
              </div>

              <CardHeader className="pb-4 pt-16">
                {/* Star rating */}
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: testimonial.rating || 5 }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-[#e1a200] text-[#e1a200]" />
                  ))}
                </div>
                <CardTitle className="text-base sm:text-lg font-semibold leading-relaxed whitespace-normal text-foreground/90 group-hover/card:text-foreground transition-colors">
                  "{testimonial.quote}"
                </CardTitle>
              </CardHeader>

              <CardContent className="pt-4 border-t border-border/50">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-11 w-11 sm:h-12 sm:w-12 border-2 border-border/50 group-hover/card:border-[#e1a200]/50 transition-colors ring-2 ring-background">
                      <AvatarImage src={testimonial.avatar || "/placeholder.svg"} alt={testimonial.author} />
                      <AvatarFallback className="bg-gradient-to-br from-[#e1a200]/20 to-primary/20 text-[#e1a200] font-semibold">
                        {testimonial.author.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    {/* Verified badge */}
                    <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-[#e1a200] shadow-md">
                      <Award className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm sm:text-base text-foreground truncate">
                      {testimonial.author}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {testimonial.title}
                    </p>
                  </div>
                </div>
              </CardContent>

              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#e1a200] to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />
            </Card>
          </div>
        ))}
      </div>
      <style jsx>{`
        @keyframes marquee-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-1 * var(--translate-distance-sm)));
          }
        }
        @media (min-width: 768px) {
          @keyframes marquee-left {
            100% {
              transform: translateX(calc(-1 * var(--translate-distance-md)));
            }
          }
        }

        @keyframes marquee-right {
          0% {
            transform: translateX(calc(-1 * var(--translate-distance-sm)));
          }
          100% {
            transform: translateX(0);
          }
        }
        @media (min-width: 768px) {
          @keyframes marquee-right {
            0% {
              transform: translateX(calc(-1 * var(--translate-distance-md)));
            }
          }
        }

        .group:hover .flex {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}

export function TestimonialsSection() {
  return (
    <section className="relative w-full py-12 sm:py-16 lg:py-24 overflow-hidden">
      {/* Enhanced background with gradient and patterns */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
      
      {/* Animated background elements - Responsive */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[15%] -left-[15%] sm:top-[20%] sm:-left-[20%] w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 bg-[#e1a200]/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[15%] -right-[15%] sm:bottom-[20%] sm:-right-[20%] w-72 h-72 sm:w-88 sm:h-88 lg:w-96 lg:h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[700px] lg:w-[900px] h-[500px] sm:h-[700px] lg:h-[900px] bg-gradient-to-r from-[#e1a200]/3 via-transparent to-primary/3 rounded-full blur-3xl" />
      </div>
      
      {/* Subtle grid pattern - Responsive */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:2rem_2rem] sm:bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_70%,transparent_110%)] opacity-10" />

      <div className="container relative z-10 px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl space-y-12 sm:space-y-16 lg:space-y-20">
        {/* Sellers Section */}
        <div className="space-y-8 sm:space-y-10 lg:space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-4 sm:space-y-5"
          >
            {/* Badge */}
            <div className="flex justify-center">
              <Badge
                variant="secondary"
                className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold bg-gradient-to-r from-[#e1a200]/10 to-primary/10 text-foreground border-[#e1a200]/30 hover:from-[#e1a200]/20 hover:to-primary/20 transition-all duration-300 backdrop-blur-sm shadow-sm"
              >
                <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-[#e1a200]" />
                Seller Testimonials
              </Badge>
            </div>

            {/* Heading */}
            <div className="space-y-2 sm:space-y-3">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent">
                  What Our{" "}
                </span>
                <span className="bg-gradient-to-r from-[#e1a200] via-[#d4b55e] to-primary bg-clip-text text-transparent">
                  Sellers Say
                </span>
              </h2>
              <p className="max-w-[90%] sm:max-w-[85%] lg:max-w-[900px] mx-auto text-muted-foreground text-base sm:text-lg lg:text-xl leading-relaxed px-4 sm:px-0">
                Hear from the amazing entrepreneurs who are building their businesses with us
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-6 lg:gap-8 pt-4 sm:pt-6">
              {[
                { value: "10K+", label: "Happy Sellers", icon: Users },
                { value: "4.9/5", label: "Average Rating", icon: Star },
                { value: "99%", label: "Satisfaction", icon: TrendingUp },
              ].map((stat, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center gap-2 px-2 py-2 rounded-lg bg-muted/50 border border-border/50 hover:border-[#e1a200]/30 transition-all"
                >
                  <div className="p-1.5 rounded-md bg-[#e1a200]/10">
                    <stat.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#e1a200]" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm sm:text-base font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <MarqueeRow items={sellerTestimonials} direction="left" speed={60} />
        </div>

        {/* Divider */}
        <div className="relative py-8 sm:py-10 lg:py-12">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/50" />
          </div>
          <div className="relative flex justify-center">
            <div className="px-4 sm:px-6 bg-background">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="h-px w-12 sm:w-16 bg-gradient-to-r from-transparent to-border" />
                <div className="p-2.5 sm:p-3 rounded-full bg-gradient-to-br from-[#e1a200]/20 to-primary/20 shadow-lg">
                  <Quote className="w-5 h-5 sm:w-6 sm:h-6 text-[#e1a200]" />
                </div>
                <div className="h-px w-12 sm:w-16 bg-gradient-to-r from-border to-transparent" />
              </div>
            </div>
          </div>
        </div>

        {/* Buyers Section */}
        <div className="space-y-8 sm:space-y-10 lg:space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-4 sm:space-y-5"
          >
            {/* Badge */}
            <div className="flex justify-center">
              <Badge
                variant="secondary"
                className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold bg-gradient-to-r from-primary/10 to-[#e1a200]/10 text-foreground border-primary/30 hover:from-primary/20 hover:to-[#e1a200]/20 transition-all duration-300 backdrop-blur-sm shadow-sm"
              >
                <ShoppingBag className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-primary" />
                Buyer Testimonials
              </Badge>
            </div>

            {/* Heading */}
            <div className="space-y-2 sm:space-y-3">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent">
                  What Our{" "}
                </span>
                <span className="bg-gradient-to-r from-primary via-[#e1a200] to-[#d4b55e] bg-clip-text text-transparent">
                  Buyers Say
                </span>
              </h2>
              <p className="max-w-[90%] sm:max-w-[85%] lg:max-w-[900px] mx-auto text-muted-foreground text-base sm:text-lg lg:text-xl leading-relaxed px-4 sm:px-0">
                Discover why customers love shopping on our marketplace
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-6 lg:gap-8 pt-4 sm:pt-6">
              {[
                { value: "50K+", label: "Happy Buyers", icon: Users },
                { value: "4.8/5", label: "Average Rating", icon: Star },
                { value: "98%", label: "Return Rate", icon: TrendingUp },
              ].map((stat, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center gap-2 px-2 py-2 rounded-lg bg-muted/50 border border-border/50 hover:border-primary/30 transition-all"
                >
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <stat.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm sm:text-base font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <MarqueeRow items={buyerTestimonials} direction="right" speed={60} />
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-20 sm:h-24 lg:h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  )
}