// app/api/user/location/route.ts
import { NextResponse } from "next/server"
import { connectToDB } from "@/lib/db"
import { getUserFromCookies } from "@/lib/auth"
import User from "@/models/User"

export async function POST(req: Request) {
  try {
    await connectToDB()

    const user = await getUserFromCookies()
    
    if (!user) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { latitude, longitude, address, city, state, country } = body

    // Update user's location
    await User.findByIdAndUpdate(user.id, {
      location: {
        type: "Point",
        coordinates: [longitude, latitude], // [lng, lat] for GeoJSON
        address,
        city,
        state,
        country,
      },
      lastLocationUpdate: new Date(),
    })

    return NextResponse.json(
      { 
        success: true,
        message: "Location saved successfully" 
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Location save error:", error)
    return NextResponse.json(
      { message: "Failed to save location", error: error.message },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    await connectToDB()

    const user = await getUserFromCookies()
    
    if (!user) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      )
    }

    const userData = await User.findById(user.id).select("location")

    return NextResponse.json(
      { 
        location: userData?.location || null 
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Location fetch error:", error)
    return NextResponse.json(
      { message: "Failed to fetch location", error: error.message },
      { status: 500 }
    )
  }
}