import { NextResponse } from "next/server"

interface HeroBanner {
  id: string
  imageUrl: string
  title: string
  subtitle: string
  buttonText: string
  buttonLink: string
}

interface BannerTheme {
  id: string
  query: string
  title: string
  subtitle: string
  buttonText: string
  buttonLink: string
  fallbackImageUrl: string
}

const BANNER_THEMES: BannerTheme[] = [
  {
    id: "restaurant-1",
    query: "restaurant dining food",
    title: "Discover Great Restaurants",
    subtitle: "Order from your favorite local spots and enjoy meals made with care.",
    buttonText: "Order Now",
    buttonLink: "/allStoreProducts",
    fallbackImageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0",
  },
  {
    id: "restaurant-2",
    query: "fresh meals restaurant kitchen",
    title: "Fresh and Delicious",
    subtitle: "Explore restaurant meals, chef specials, and daily food favorites.",
    buttonText: "Explore Meals",
    buttonLink: "/allStoreProducts",
    fallbackImageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
  },
  {
    id: "grocery-1",
    query: "grocery supermarket fresh produce",
    title: "Grocery and Food Stores",
    subtitle: "Shop fresh produce, pantry essentials, and everyday home needs.",
    buttonText: "Shop Groceries",
    buttonLink: "/allStoreProducts",
    fallbackImageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e",
  },
  {
    id: "cafe-1",
    query: "cafe bakery coffee pastries",
    title: "Cafe and Bakery Picks",
    subtitle: "Find your daily coffee, pastries, and freshly baked treats nearby.",
    buttonText: "Find Cafes",
    buttonLink: "/allStoreProducts",
    fallbackImageUrl: "https://images.unsplash.com/photo-1555992336-03a23c7b20ee",
  },
  {
    id: "retail-1",
    query: "shopping ecommerce retail store",
    title: "Discover Quality Products",
    subtitle: "Browse our curated collection from trusted sellers.",
    buttonText: "Shop Now",
    buttonLink: "/allStoreProducts",
    fallbackImageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8",
  },
  {
    id: "retail-2",
    query: "shopping verified marketplace",
    title: "Shop With Confidence",
    subtitle: "Find everything you need from verified stores in one place.",
    buttonText: "Browse Stores",
    buttonLink: "/allStoreProducts",
    fallbackImageUrl: "https://images.unsplash.com/photo-1472851294608-062f824d29cc",
  },
  {
    id: "retail-3",
    query: "online deals retail shopping",
    title: "Exclusive Deals",
    subtitle: "Get the best prices on premium products and trending items.",
    buttonText: "View Deals",
    buttonLink: "/allStoreProducts",
    fallbackImageUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da",
  },
  {
    id: "fashion-1",
    query: "fashion lifestyle clothing store",
    title: "Fashion Forward",
    subtitle: "Discover standout styles, seasonal looks, and fashion essentials.",
    buttonText: "Shop Fashion",
    buttonLink: "/allStoreProducts",
    fallbackImageUrl: "https://images.unsplash.com/photo-1445205170230-053b83016050",
  },
  {
    id: "tech-1",
    query: "tech gadgets electronics store",
    title: "Tech and Innovation",
    subtitle: "Discover the latest gadgets, devices, and digital essentials.",
    buttonText: "Shop Tech",
    buttonLink: "/allStoreProducts",
    fallbackImageUrl: "https://images.unsplash.com/photo-1498049794561-7780e7231661",
  },
]

function getRandomTheme() {
  const randomIndex = Math.floor(Math.random() * BANNER_THEMES.length)
  return BANNER_THEMES[randomIndex]
}

function buildBannerFromTheme(theme: BannerTheme, imageUrl?: string): HeroBanner {
  return {
    id: theme.id,
    imageUrl: imageUrl || theme.fallbackImageUrl,
    title: theme.title,
    subtitle: theme.subtitle,
    buttonText: theme.buttonText,
    buttonLink: theme.buttonLink,
  }
}

export async function GET() {
  try {
    const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY
    const selectedTheme = getRandomTheme()

    if (!unsplashAccessKey) {
      console.log("No Unsplash API key - using themed fallback banner")
      return NextResponse.json(
        {
          success: true,
          banner: buildBannerFromTheme(selectedTheme),
          source: "fallback",
        },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
        }
      )
    }

    console.log("Fetching fresh banner from Unsplash API")

    try {
      const response = await fetch(
        `https://api.unsplash.com/photos/random?query=${encodeURIComponent(selectedTheme.query)}&orientation=landscape&content_filter=high`,
        {
          headers: {
            Authorization: `Client-ID ${unsplashAccessKey}`,
          },
          signal: AbortSignal.timeout(5000),
        }
      )

      if (!response.ok) {
        throw new Error(`Unsplash API returned ${response.status}`)
      }

      const data = await response.json()

      return NextResponse.json(
        {
          success: true,
          banner: buildBannerFromTheme(selectedTheme, data.urls?.regular),
          source: "api-fresh",
        },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
        }
      )
    } catch (apiError) {
      console.warn("Unsplash API failed, using themed fallback:", apiError)

      return NextResponse.json(
        {
          success: true,
          banner: buildBannerFromTheme(selectedTheme),
          source: "fallback-after-api-error",
        },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
        }
      )
    }
  } catch (error) {
    console.error("Error in hero banner route:", error)
    const fallbackTheme = getRandomTheme()

    return NextResponse.json(
      {
        success: true,
        banner: buildBannerFromTheme(fallbackTheme),
        source: "fallback-after-error",
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    )
  }
}

export const dynamic = "force-dynamic"
export const revalidate = 0
