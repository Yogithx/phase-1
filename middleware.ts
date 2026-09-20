import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/dashboard')) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    const role = user.user_metadata?.role as string | undefined;
    const allowedRoutes: Record<string, string> = {
      admin: '/dashboard/admin',
      faculty: '/dashboard/faculty',
      counselor: '/dashboard/counselor',
    };
    if (role && !pathname.startsWith(allowedRoutes[role] ?? '')) {
      const url = request.nextUrl.clone();
      url.pathname = allowedRoutes[role] ?? '/login';
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
  matcher: ['/dashboard/:path*', '/login'],
};
