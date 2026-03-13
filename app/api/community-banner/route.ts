import { NextResponse } from "next/server"

const COMMUNITY_IMAGES = [
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac",
  "https://images.unsplash.com/photo-1556761175-5973dc0f32e7",
  "https://images.unsplash.com/photo-1600880292203-757bb62b4baf",
  "https://images.unsplash.com/photo-1543269865-cbf427effbad",
  "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca",
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d",
]

export async function GET() {
  try {
    const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY

    if (unsplashAccessKey) {
      try {
        const response = await fetch(
          `https://api.unsplash.com/photos/random?query=community,people,teamwork,marketplace,collaboration&orientation=landscape&content_filter=high`,
          {
            headers: { Authorization: `Client-ID ${unsplashAccessKey}` },
            signal: AbortSignal.timeout(5000),
          }
        )
        if (response.ok) {
          const data = await response.json()
          return NextResponse.json(
            { success: true, imageUrl: data.urls.regular, source: "api" },
            { headers: { "Cache-Control": "no-store" } }
          )
        }
      } catch {}
    }

    // Fallback to curated community images
    const imageUrl = COMMUNITY_IMAGES[Math.floor(Math.random() * COMMUNITY_IMAGES.length)]
    return NextResponse.json(
      { success: true, imageUrl, source: "fallback" },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch {
    return NextResponse.json(
      { success: true, imageUrl: COMMUNITY_IMAGES[0], source: "fallback" },
      { headers: { "Cache-Control": "no-store" } }
    )
  }
}

export const dynamic = "force-dynamic"
export const revalidate = 0