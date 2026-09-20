import { NextRequest, NextResponse } from 'next/server';

const DEMO_ACCOUNTS: Record<string, { role: 'admin' | 'faculty' | 'counselor'; password: string }> = {
  'admin@college.edu':    { role: 'admin',     password: 'demo123' },
  'faculty@college.edu':  { role: 'faculty',   password: 'demo123' },
  'counselor@college.edu':{ role: 'counselor', password: 'demo123' },
};

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  const account = DEMO_ACCOUNTS[email?.toLowerCase()?.trim()];
  if (!account || account.password !== password) {
    return NextResponse.json({ error: 'Invalid demo credentials' }, { status: 401 });
  }

  const response = NextResponse.json({ role: account.role, ok: true });
  response.cookies.set('ess-demo-role', account.role, {
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
  });
  return response;
}
