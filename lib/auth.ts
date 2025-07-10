import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

export async function getUserFromCookies(): Promise<TokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    return decoded;
  } catch (err) {
    return null;
  }
}
