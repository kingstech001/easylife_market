import { NextResponse } from "next/server"

// Large curated collection of fallback banners
const FALLBACK_BANNERS = [
  // Shopping & Retail
  {
  id: "21",
  imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0",
  title: "Discover Great Restaurants",
  subtitle: "Order from your favorite local spots",
},
{
  id: "22",
  imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
  title: "Fresh & Delicious",
  subtitle: "Explore meals prepared with care",
},
{
  id: "23",
  imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e",
  title: "Grocery & Food Stores",
  subtitle: "Shop fresh produce and essentials",
},
{
  id: "24",
  imageUrl: "https://images.unsplash.com/photo-1555992336-03a23c7b20ee",
  title: "Cafe & Bakery Picks",
  subtitle: "Find your daily coffee and treats",
},
  {
    id: "1",
    imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8",
    title: "Discover Quality Products",
    subtitle: "Browse our curated collection from trusted sellers",
  },
  {
    id: "2",
    imageUrl: "https://images.unsplash.com/photo-1472851294608-062f824d29cc",
    title: "Shop With Confidence",
    subtitle: "Find everything you need from verified stores",
  },
  {
    id: "3",
    imageUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da",
    title: "Exclusive Deals",
    subtitle: "Get the best prices on premium products",
  },
  {
    id: "4",
    imageUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b",
    title: "Latest Collections",
    subtitle: "Explore trending items from top sellers",
  },
  {
    id: "5",
    imageUrl: "https://images.unsplash.com/photo-1491637639811-60e2756cc1c7",
    title: "Premium Marketplace",
    subtitle: "Your trusted platform for quality shopping",
  },
  // Fashion & Lifestyle
  {
    id: "6",
    imageUrl: "https://images.unsplash.com/photo-1445205170230-053b83016050",
    title: "Fashion Forward",
    subtitle: "Discover the latest trends in fashion",
  },
  {
    id: "7",
    imageUrl: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04",
    title: "Style Your Way",
    subtitle: "Express yourself with unique fashion finds",
  },
  {
    id: "8",
    imageUrl: "https://images.unsplash.com/photo-1469334031218-e382a71b716b",
    title: "Trendsetting Styles",
    subtitle: "Shop the hottest looks of the season",
  },
  // Modern Shopping
  {
    id: "9",
    imageUrl: "https://images.unsplash.com/photo-1516321497487-e288fb19713f",
    title: "Modern Shopping Experience",
    subtitle: "Seamless online shopping made easy",
  },
  {
    id: "10",
    imageUrl: "https://images.unsplash.com/photo-1581338834647-b0fb40704e21",
    title: "Shop Anytime, Anywhere",
    subtitle: "Your favorite stores at your fingertips",
  },
  // Tech & Gadgets
  {
    id: "11",
    imageUrl: "https://images.unsplash.com/photo-1498049794561-7780e7231661",
    title: "Tech & Innovation",
    subtitle: "Discover the latest in technology",
  },
  {
    id: "12",
    imageUrl: "https://images.unsplash.com/photo-1526738549149-8e07eca6c147",
    title: "Digital Lifestyle",
    subtitle: "Upgrade your tech collection",
  },
  // Home & Decor
  {
    id: "13",
    imageUrl: "https://images.unsplash.com/photo-1484101403633-562f891dc89a",
    title: "Home Essentials",
    subtitle: "Transform your living space",
  },
  {
    id: "14",
    imageUrl: "https://images.unsplash.com/photo-1487700160041-babef9c3cb55",
    title: "Stylish Living",
    subtitle: "Shop for your dream home",
  },
  // Beauty & Wellness
  {
    id: "15",
    imageUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9",
    title: "Beauty & Wellness",
    subtitle: "Discover products for self-care",
  },
  {
    id: "16",
    imageUrl: "https://images.unsplash.com/photo-1596704017254-9b121068ec31",
    title: "Premium Beauty",
    subtitle: "Top-rated skincare and cosmetics",
  },
  // Sports & Fitness
  {
    id: "17",
    imageUrl: "https://images.unsplash.com/photo-1556906781-9a412961c28c",
    title: "Active Lifestyle",
    subtitle: "Gear up for your fitness journey",
  },
  {
    id: "18",
    imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438",
    title: "Performance & Style",
    subtitle: "Premium athletic wear and equipment",
  },
  // Electronics
  {
    id: "19",
    imageUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c",
    title: "Latest Electronics",
    subtitle: "Shop cutting-edge technology",
  },
  {
    id: "20",
    imageUrl: "https://images.unsplash.com/photo-1550009158-9ebf69173e03",
    title: "Smart Devices",
    subtitle: "Upgrade your digital life",
  },
]

// Helper function to get a random fallback banner
function getRandomFallbackBanner() {
  const randomIndex = Math.floor(Math.random() * FALLBACK_BANNERS.length)
  return {
    ...FALLBACK_BANNERS[randomIndex],
    buttonText: "Shop Now",
    buttonLink: "/allStoreProducts",
  }
}

export async function GET() {
  try {
    const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY

    // If no API key, use random fallback
    if (!unsplashAccessKey) {
      console.log("⚠️ No Unsplash API key - using random fallback banner")
      const fallbackBanner = getRandomFallbackBanner()
      return NextResponse.json({ 
        success: true, 
        banner: fallbackBanner,
        source: "fallback" 
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate', // Prevent caching
        }
      })
    }

    console.log('🔍 Fetching fresh banner from Unsplash API')

    // Try to fetch from Unsplash API
    try {
      const response = await fetch(
  `https://api.unsplash.com/photos/random?query=shopping,ecommerce,marketplace,retail,store,fashion,lifestyle,restaurant,food,supermarket,grocery,cafe,bakery,fastfood,dining&orientation=landscape&content_filter=high`,
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

      const banner = {
        id: data.id,
        imageUrl: data.urls.regular,
        title: "Discover Quality Products",
        subtitle: "Browse our curated collection from trusted sellers",
        buttonText: "Shop Now",
        buttonLink: "/allStoreProducts",
      }


      return NextResponse.json({ 
        success: true, 
        banner,
        source: "api-fresh"
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate', // Prevent caching
        }
      })

    } catch (apiError) {
      // API failed - use random fallback
      console.warn('⚠️ Unsplash API failed, using random fallback:', apiError)
      const fallbackBanner = getRandomFallbackBanner()
      
      return NextResponse.json({ 
        success: true, 
        banner: fallbackBanner,
        source: "fallback-after-api-error"
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate', // Prevent caching
        }
      })
    }

  } catch (error) {
    // Any other error - use random fallback
    console.error("❌ Error in hero banner route:", error)
    const fallbackBanner = getRandomFallbackBanner()
    
    return NextResponse.json({ 
      success: true, 
      banner: fallbackBanner,
      source: "fallback-after-error"
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate', // Prevent caching
      }
    })
  }
}

// Make it dynamic and disable caching
export const dynamic = 'force-dynamic'
export const revalidate = 0