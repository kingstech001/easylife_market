import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Product from "@/models/Product";

export async function GET(
  req: Request,
  context: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await context.params; // ✅ await the params

    await connectToDB();

    const products = await Product.find({ storeId });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { message: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
