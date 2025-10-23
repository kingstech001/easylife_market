"use client"

import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Testimonial {
  quote: string
  author: string
  title: string
  avatar: string
}

const sellerTestimonials: Testimonial[] = [
  {
    quote: "This platform has revolutionized how I manage my online store. The features are intuitive and powerful!",
    author: "Jane Doe",
    title: "CEO, Fashionista Boutique",
    avatar: "/placeholder.svg?height=100&width=100",
  },
  {
    quote: "Setting up my shop was incredibly easy, and the analytics tools are a game-changer for understanding my customers.",
    author: "John Smith",
    title: "Founder, Gadget Hub",
    avatar: "/placeholder.svg?height=100&width=100",
  },
  {
    quote: "The support team is fantastic! They helped me every step of the way, and my sales have never been better.",
    author: "Sarah Lee",
    title: "Owner, Artisan Crafts",
    avatar: "/placeholder.svg?height=100&width=100",
  },
  {
    quote: "A truly comprehensive solution for e-commerce. From product listing to order fulfillment, everything is seamless.",
    author: "Michael Chen",
    title: "Manager, Tech Innovations",
    avatar: "/placeholder.svg?height=100&width=100",
  },
  {
    quote: "I love the clean interface and the robust features. It's exactly what I needed to scale my business.",
    author: "Emily White",
    title: "Creator, Unique Prints",
    avatar: "/placeholder.svg?height=100&width=100",
  },
  {
    quote: "Highly recommend this platform to anyone looking to start or grow their online presence. It's simply the best!",
    author: "David Brown",
    title: "Director, Gourmet Foods",
    avatar: "/placeholder.svg?height=100&width=100",
  },
]

const buyerTestimonials: Testimonial[] = [
  {
    quote: "I found unique products here that I couldn't find anywhere else. The shopping experience is seamless!",
    author: "Alice Johnson",
    title: "Happy Customer",
    avatar: "/placeholder.svg?height=100&width=100",
  },
  {
    quote: "The variety of stores and products is amazing. I always find what I need, and checkout is a breeze.",
    author: "Robert Davis",
    title: "Frequent Shopper",
    avatar: "/placeholder.svg?height=100&width=100",
  },
  {
    quote: "Excellent customer service and high-quality products. This is my go-to marketplace now!",
    author: "Olivia Wilson",
    title: "Satisfied Buyer",
    avatar: "/placeholder.svg?height=100&width=100",
  },
  {
    quote: "The best place to discover new brands and unique items. My favorite online shopping destination!",
    author: "Daniel Miller",
    title: "Enthusiastic Buyer",
    avatar: "/placeholder.svg?height=100&width=100",
  },
  {
    quote: "Fast shipping and great product quality. I'm always impressed with my purchases from this platform.",
    author: "Sophia Martinez",
    title: "Loyal Customer",
    avatar: "/placeholder.svg?height=100&width=100",
  },
  {
    quote: "A fantastic user experience from start to finish. Highly recommend for anyone looking for quality goods.",
    author: "James Taylor",
    title: "Regular User",
    avatar: "/placeholder.svg?height=100&width=100",
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
  // Define item widths and gap in pixels for calculation
  const itemWidthSm = 300; // Corresponds to w-[300px]
  const itemWidthMd = 350; // Corresponds to md:w-[350px]
  const gapWidth = 24; // Corresponds to gap-6 (1.5rem = 24px)
  const itemCount = items.length;

  // Calculate the exact width of one full set of items including gaps
  // (N items * itemWidth) + (N-1 gaps * gapWidth)
  // This is the distance the marquee needs to translate for one full loop
  const singleSetWidthSm = `${itemCount * itemWidthSm + (itemCount - 1) * gapWidth}px`;
  const singleSetWidthMd = `${itemCount * itemWidthMd + (itemCount - 1) * gapWidth}px`;

  return (
    <div
      className="relative w-full overflow-hidden py-4 group"
      style={{
        '--item-width-sm': `${itemWidthSm}px`,
        '--item-width-md': `${itemWidthMd}px`,
        '--gap-width': `${gapWidth}px`,
        '--item-count': itemCount,
        '--translate-distance-sm': singleSetWidthSm,
        '--translate-distance-md': singleSetWidthMd,
      } as React.CSSProperties} // Cast to React.CSSProperties to allow custom properties
    >
      <div
        className="flex whitespace-nowrap gap-6"
        style={{
          animation: `marquee-${direction} ${speed}s linear infinite`,
        }}
      >
        {/* Duplicate content to create seamless loop */}
        {[...items, ...items].map((testimonial, idx) => (
          <div key={idx} className="flex-none w-[300px] md:w-[350px]">
            <Card className="flex flex-col justify-between h-full bg-background/90 backdrop-blur-sm shadow-md transition-all hover:shadow-lg">
              <CardHeader className="pb-0">
                <CardTitle className="text-lg font-semibold leading-snug whitespace-normal">
                  {testimonial.quote}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 flex items-center gap-3">
                <Avatar className="h-10 w-10 border">
                  <AvatarImage src={testimonial.avatar || "/placeholder.svg"} alt={testimonial.author} />
                  <AvatarFallback>{testimonial.author.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{testimonial.author}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.title}</p>
                </div>
              </CardContent>
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

        /* Pause animation on hover */
        .group:hover .flex {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}

export function TestimonialsSection() {
  return (
    <section className="relative w-full py-16 md:py-24 lg:py-32 overflow-hidden block m-auto">
      {/* Background with gradient and patterns */}
      <div className="absolute inset-0 bg-gradient-to-br from-muted/30 via-background to-muted/50" />
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/3 via-transparent to-secondary/3 rounded-full blur-3xl" />
      </div>
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-10" />

      <div className="container relative z-10 px-4 md:px-6 space-y-16 block m-auto">
        {/* Sellers */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">What Our Sellers Say</h2>
          <p className="max-w-[900px] mx-auto text-gray-500 md:text-xl dark:text-gray-400">
            Hear from the amazing entrepreneurs who are building their businesses with us.
          </p>
        </div>
        <MarqueeRow items={sellerTestimonials} direction="left" speed={50} />

        {/* Buyers */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">What Our Buyers Say</h2>
          <p className="max-w-[900px] mx-auto text-gray-500 md:text-xl dark:text-gray-400">
            Discover why customers love shopping on our marketplace.
          </p>
        </div>
        <MarqueeRow items={buyerTestimonials} direction="right" speed={50} />
      </div>
      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  )
}
