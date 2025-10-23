import { NextResponse } from "next/server";
import Store from "@/models/Store";
import { getUserFromCookies } from "@/lib/auth"; // Gets { id, email, role }
import { connectToDB } from "@/lib/db";

export async function GET() {
  try {
    await connectToDB();

    const user = await getUserFromCookies();

    if (!user || (user.role !== "seller" && user.role !== "admin")) {
      return NextResponse.json(
        { message: "Unauthorized. Only sellers or admins can access this route." },
        { status: 401 }
      );
    }

    const store = await Store.findOne({ sellerId: user.id });

    if (!store) {
      return NextResponse.json(
        { message: "Store not found for this user." },
        { status: 404 }
      );
    }

    // Include role in the response
    return NextResponse.json(
      { store, role: user.role },
      { status: 200 }
    );

  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error", error: String(error) },
      { status: 500 }
    );
  }
}
