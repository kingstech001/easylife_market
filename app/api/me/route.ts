// app/api/me/route.ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) return NextResponse.json({ user: null });

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    return NextResponse.json({
      user: {
        id: payload.id,
        email: payload.email,
        role: payload.role,
        fullName: payload.fullName,
      },
    });
  } catch (err) {
    return NextResponse.json({ user: null });
  }
}
