import { NextResponse } from 'next/server';

export async function GET() {
  const response = NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'));
  response.cookies.delete('ess-demo-role');
  return response;
}

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete('ess-demo-role');
  return response;
}
