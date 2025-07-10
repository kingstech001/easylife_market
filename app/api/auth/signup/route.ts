export const runtime = "nodejs"; // 👈 Force Node.js runtime

import { NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  const body = await req.json();
  const { fullName, email, password, role } = body;

  if (!fullName || !email || !password || !role) {
    return NextResponse.json({ message: "All fields are required" }, { status: 400 });
  }

  await connectToDB();

  const existing = await User.findOne({ email });
  if (existing) {
    return NextResponse.json({ error: 'User already exists' }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 10);
  const newUser = await User.create({ fullName, email, password: hashed, role });

  return NextResponse.json({ message: 'User created', user: newUser });
}
