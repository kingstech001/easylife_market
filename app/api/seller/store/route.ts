import { NextResponse } from "next/server";
import  Store  from "@/models/Store";
import { getUserFromCookies } from "@/lib/auth"; // Gets { id, email, role }
import { connectToDB } from "@/lib/db";

export async function GET() {

  try {
    await connectToDB();

    const user = await getUserFromCookies();

    if (!user || user.role !== "seller") {
      return NextResponse.json(
        { message: "Unauthorized. Only sellers can access this route." },
        { status: 401 }
      );
    }

    const store = await Store.findOne({ sellerId: user.id });

    if (!store) {
      return NextResponse.json(
        { message: "Store not found for this seller." },
        { status: 404 }
      );
    }

    return NextResponse.json({ store }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error", error: String(error) },
      { status: 500 }
    );
  }
}
