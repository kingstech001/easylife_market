import { connectToDB } from '@/lib/db';
// import { getUserFromCookies } from '@/lib/auth';
import { NextResponse } from 'next/server';
import Shop from '@/models/Shop';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, slug, description, ownerId } = body;

    if (!name || !slug || !ownerId) {
      return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
    }

    await connectToDB();

    const existing = await Shop.findOne({ slug });
    if (existing) {
      return NextResponse.json({ message: 'Slug already taken' }, { status: 409 });
    }

    const newShop = await Shop.create({
      name,
      slug,
      description,
      ownerId,
      createdAt: new Date(),
    });

    return NextResponse.json({ shop: newShop }, { status: 201 });
  } catch (error) {
    console.error('Shop creation error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
