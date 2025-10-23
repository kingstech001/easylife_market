// app/api/categories/route.ts
import { NextResponse } from "next/server"
import { connectToDB } from "@/lib/db"
import Category from "@/models/Category"

export async function GET() {
  try {
    await connectToDB()
    const categories = await Category.find().lean()
    return NextResponse.json({ categories })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}
