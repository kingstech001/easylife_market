import { NextResponse } from "next/server"

export async function GET() {
  try {
    const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY

    if (!unsplashAccessKey) {
      console.error("Unsplash Access Key not configured")
      return NextResponse.json({ success: false, message: "Banner service not configured" }, { status: 500 })
    }

    // Fetch a random shopping/ecommerce related image from Unsplash
    const response = await fetch(
      `https://api.unsplash.com/photos/random?query=shopping,ecommerce,marketplace,retail,store&orientation=landscape&content_filter=high`,
      {
        headers: {
          Authorization: `Client-ID ${unsplashAccessKey}`,
        },
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Unsplash API error:", errorText)
      throw new Error("Failed to fetch from Unsplash")
    }

    const data = await response.json()

    const banner = {
      id: data.id,
      imageUrl: data.urls.regular, // High quality image
      title: "Discover Quality Products",
      subtitle: "Browse our curated collection from trusted sellers",
      buttonText: "Shop Now",
      buttonLink: "/products",
    }

    return NextResponse.json({ success: true, banner })
  } catch (error) {
    console.error("Error fetching hero banner:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch banner" }, { status: 500 })
  }
}
