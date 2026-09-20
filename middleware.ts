import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const DEMO_ROLES = ['admin', 'faculty', 'counselor'] as const;
type DemoRole = typeof DEMO_ROLES[number];

const ALLOWED_ROUTES: Record<DemoRole, string> = {
  admin: '/dashboard/admin',
  faculty: '/dashboard/faculty',
  counselor: '/dashboard/counselor',
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── DEMO MODE ─────────────────────────────────────────────────────────────
  const demoRole = request.cookies.get('ess-demo-role')?.value as DemoRole | undefined;
  const isDemoSession = demoRole && DEMO_ROLES.includes(demoRole);

  if (isDemoSession) {
    if (pathname === '/login') {
      const url = request.nextUrl.clone();
      url.pathname = ALLOWED_ROUTES[demoRole];
      return NextResponse.redirect(url);
    }
    if (pathname.startsWith('/student/')) {
      return NextResponse.next();
    }
    if (pathname.startsWith('/dashboard')) {
      if (!pathname.startsWith(ALLOWED_ROUTES[demoRole])) {
        const url = request.nextUrl.clone();
        url.pathname = ALLOWED_ROUTES[demoRole];
        return NextResponse.redirect(url);
      }
      return NextResponse.next();
    }
    return NextResponse.next();
  }
  // ── END DEMO MODE ──────────────────────────────────────────────────────────

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2])
          );
        },
      },
    }
  );

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Supabase not configured — fall through to redirect
  }

  if (pathname.startsWith('/dashboard')) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    const role = user.user_metadata?.role as string | undefined;
    if (role && !pathname.startsWith(ALLOWED_ROUTES[role as DemoRole] ?? '')) {
      const url = request.nextUrl.clone();
      url.pathname = ALLOWED_ROUTES[role as DemoRole] ?? '/login';
      return NextResponse.redirect(url);
    }
  }

  if (pathname === '/login' && user) {
    const role = user.user_metadata?.role as string | undefined;
    const dest = role ? `/dashboard/${role}` : '/dashboard/admin';
    const url = request.nextUrl.clone();
    url.pathname = dest;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/student/:path*'],
};
