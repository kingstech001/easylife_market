// /app/api/notifications/route.ts
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { connectToDB } from "@/lib/db";
import User from "@/models/User";

export async function PUT(req: Request) {
  try {
    const token = req.headers.get("cookie")?.split("token=")[1]?.split(";")[0];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);

    const { marketingEmails, orderUpdates, newProducts } = await req.json();

    await connectToDB();
    const user = await User.findById(payload.id);
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    user.notifications = { marketingEmails, orderUpdates, newProducts };
    await user.save();

    return NextResponse.json({ message: "Notification preferences updated." });
  } catch (err) {
    console.error("[NOTIFICATION_UPDATE_ERROR]", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
